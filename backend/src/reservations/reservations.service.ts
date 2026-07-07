import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { mapOrder } from '../orders/order.types';
import { OrdersRepository } from '../orders/orders.repository';
import { ProductsRepository } from '../products/products.repository';
import {
  optionalEmail,
  requirePositiveInteger,
  requireString,
} from '../shared/validation';
import { CreateReservationBody, ListReservationsQuery } from './dto';
import {
  CheckoutResult,
  mapReservation,
  Reservation,
  ReservationStatus,
} from './reservation.types';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservationsService.name);
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
    @Inject(OrdersRepository)
    private readonly ordersRepository: OrdersRepository,
    @Inject(ProductsRepository)
    private readonly productsRepository: ProductsRepository,
    @Inject(ReservationsRepository)
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  onModuleInit(): void {
    const intervalMs = Number(process.env.EXPIRED_RESERVATIONS_SWEEP_MS ?? 30000);

    if (intervalMs <= 0) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.expireActiveReservations().catch((error) => {
        this.logger.error('Failed to expire reservations.', error);
      });
    }, intervalMs);

    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  async list(query: ListReservationsQuery): Promise<Reservation[]> {
    const status = query.status ? parseStatus(query.status) : undefined;
    const rows = await this.reservationsRepository.list({
      productId: query.productId,
      status,
    });

    return rows.map(mapReservation);
  }

  async findById(id: string): Promise<Reservation> {
    const row = await this.reservationsRepository.findById(id);

    if (!row) {
      throw new NotFoundException('Reservation not found.');
    }

    return mapReservation(row);
  }

  async create(body: CreateReservationBody): Promise<Reservation> {
    const productId = requireString(body.productId, 'productId');
    const quantity =
      body.quantity === undefined
        ? 1
        : requirePositiveInteger(body.quantity, 'quantity');
    const customerEmail = optionalEmail(body.customerEmail);
    const ttlSeconds = Number(process.env.RESERVATION_TTL_SECONDS ?? 600);

    if (ttlSeconds <= 0) {
      throw new BadRequestException('RESERVATION_TTL_SECONDS must be positive.');
    }

    return this.database.transaction(async (client) => {
      await this.reservationsRepository.expireActiveReservations(client);

      const product = await this.productsRepository.reserveStock(
        client,
        productId,
        quantity,
      );

      if (!product) {
        throw new ConflictException('Product is sold out or unavailable.');
      }

      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const reservation = await this.reservationsRepository.create(client, {
        productId,
        customerEmail,
        quantity,
        expiresAt,
      });

      return mapReservation(reservation);
    });
  }

  async checkout(id: string): Promise<CheckoutResult> {
    const result = await this.database.transaction(async (client) => {
      const reservation = await this.reservationsRepository.findByIdForUpdate(
        client,
        id,
      );

      if (!reservation) {
        throw new NotFoundException('Reservation not found.');
      }

      if (reservation.status !== 'active') {
        throw new ConflictException(
          `Reservation cannot be checked out because it is ${reservation.status}.`,
        );
      }

      if (reservation.is_expired) {
        const expired = await this.reservationsRepository.expireOne(client, id);
        const stockMoved = await this.reservationsRepository.moveReservedToAvailable(
          client,
          reservation.product_id,
          reservation.quantity,
        );

        if (!stockMoved) {
          throw new ConflictException('Reserved stock could not be restored.');
        }

        return {
          state: 'expired' as const,
          reservation: mapReservation(expired),
        };
      }

      const completed = await this.reservationsRepository.complete(client, id);
      const product = await this.reservationsRepository.moveReservedToSold(
        client,
        reservation.product_id,
        reservation.quantity,
      );

      if (!product) {
        throw new ConflictException('Reserved stock could not be checked out.');
      }

      const order = await this.ordersRepository.create(client, {
        orderNumber: buildOrderNumber(),
        reservationId: reservation.id,
        productId: reservation.product_id,
        customerEmail: reservation.customer_email,
        quantity: reservation.quantity,
        unitPriceCents: product.price_cents,
      });

      return {
        state: 'completed' as const,
        reservation: mapReservation(completed),
        order: mapOrder(order),
      };
    });

    if (result.state === 'expired') {
      throw new GoneException({
        message: 'Reservation expired.',
        reservation: result.reservation,
      });
    }

    return {
      reservation: result.reservation,
      order: result.order,
    };
  }

  async cancel(id: string): Promise<Reservation> {
    const result = await this.database.transaction(async (client) => {
      const reservation = await this.reservationsRepository.findByIdForUpdate(
        client,
        id,
      );

      if (!reservation) {
        throw new NotFoundException('Reservation not found.');
      }

      if (reservation.status !== 'active') {
        throw new ConflictException(
          `Reservation cannot be cancelled because it is ${reservation.status}.`,
        );
      }

      if (reservation.is_expired) {
        const expired = await this.reservationsRepository.expireOne(client, id);
        const stockMoved = await this.reservationsRepository.moveReservedToAvailable(
          client,
          reservation.product_id,
          reservation.quantity,
        );

        if (!stockMoved) {
          throw new ConflictException('Reserved stock could not be restored.');
        }

        return {
          state: 'expired' as const,
          reservation: mapReservation(expired),
        };
      }

      const cancelled = await this.reservationsRepository.cancel(client, id);
      const stockMoved = await this.reservationsRepository.moveReservedToAvailable(
        client,
        reservation.product_id,
        reservation.quantity,
      );

      if (!stockMoved) {
        throw new ConflictException('Reserved stock could not be restored.');
      }

      return {
        state: 'cancelled' as const,
        reservation: mapReservation(cancelled),
      };
    });

    if (result.state === 'expired') {
      throw new GoneException({
        message: 'Reservation expired.',
        reservation: result.reservation,
      });
    }

    return result.reservation;
  }

  async expireActiveReservations(): Promise<{ expiredCount: number }> {
    const expiredCount = await this.database.transaction((client) =>
      this.reservationsRepository.expireActiveReservations(client),
    );

    return { expiredCount };
  }
}

function parseStatus(status: string): ReservationStatus {
  const allowedStatuses: ReservationStatus[] = [
    'active',
    'completed',
    'expired',
    'cancelled',
  ];

  if (!allowedStatuses.includes(status as ReservationStatus)) {
    throw new BadRequestException('Invalid reservation status.');
  }

  return status as ReservationStatus;
}

function buildOrderNumber(): string {
  return `ORD-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}
