import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parsePositiveInteger } from '../shared/validation';
import { ListOrdersQuery } from './dto';
import { mapOrder, Order, OrderStatus } from './order.types';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(OrdersRepository)
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async list(query: ListOrdersQuery): Promise<Order[]> {
    const status = query.status ? parseStatus(query.status) : undefined;
    const rows = await this.ordersRepository.list({
      productId: query.productId
        ? parsePositiveInteger(query.productId, 'productId')
        : undefined,
      reservationId: query.reservationId
        ? parsePositiveInteger(query.reservationId, 'reservationId')
        : undefined,
      status,
    });

    return rows.map(mapOrder);
  }

  async findById(id: string | number): Promise<Order> {
    const row = await this.ordersRepository.findById(id);

    if (!row) {
      throw new NotFoundException('Order not found.');
    }

    return mapOrder(row);
  }
}

function parseStatus(status: string): OrderStatus {
  const allowedStatuses: OrderStatus[] = ['confirmed', 'cancelled', 'refunded'];

  if (!allowedStatuses.includes(status as OrderStatus)) {
    throw new BadRequestException('Invalid order status.');
  }

  return status as OrderStatus;
}
