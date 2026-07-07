import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/database/database.service';
import { OrdersRepository } from '../src/orders/orders.repository';
import { ProductsRepository } from '../src/products/products.repository';
import { ReservationsRepository } from '../src/reservations/reservations.repository';
import { ReservationsService } from '../src/reservations/reservations.service';

const describeIfDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Reservations concurrency', () => {
  let database: DatabaseService;
  let productsRepository: ProductsRepository;
  let reservationsService: ReservationsService;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.EXPIRED_RESERVATIONS_SWEEP_MS = '0';

    const moduleRef = await Test.createTestingModule({
      providers: [
        DatabaseService,
        OrdersRepository,
        ProductsRepository,
        ReservationsRepository,
        ReservationsService,
      ],
    }).compile();

    database = moduleRef.get(DatabaseService);
    productsRepository = moduleRef.get(ProductsRepository);
    reservationsService = moduleRef.get(ReservationsService);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('does not over-reserve stock under concurrent requests', async () => {
    const sku = `TEST-${randomUUID()}`;
    const product = await productsRepository.create({
      sku,
      slug: sku.toLowerCase(),
      brand: 'Nike',
      model: 'Air Max',
      name: 'Nike Air Max Test Drop',
      colorway: 'Black/Red',
      description: null,
      priceCents: 79900,
      imageUrl: null,
      releaseAt: null,
      stockTotal: 5,
    });

    const attempts = await Promise.allSettled(
      Array.from({ length: 50 }, () =>
        reservationsService.create({ productId: product.id }),
      ),
    );

    const successes = attempts.filter(
      (attempt) => attempt.status === 'fulfilled',
    );
    const failures = attempts.filter((attempt) => attempt.status === 'rejected');
    const refreshed = await productsRepository.findById(product.id);

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(45);
    expect(refreshed?.stock_available).toBe(0);
    expect(refreshed?.stock_reserved).toBe(5);
    expect(refreshed?.stock_sold).toBe(0);
  });

  it('creates an order during checkout and moves reserved stock to sold', async () => {
    const sku = `CHECKOUT-${randomUUID()}`;
    const product = await productsRepository.create({
      sku,
      slug: sku.toLowerCase(),
      brand: 'Nike',
      model: 'Dunk Low',
      name: 'Nike Dunk Low Checkout Test',
      colorway: 'White/Black',
      description: null,
      priceCents: 54900,
      imageUrl: null,
      releaseAt: null,
      stockTotal: 1,
    });

    const reservation = await reservationsService.create({
      productId: product.id,
      customerEmail: 'checkout@example.com',
    });

    const checkout = await reservationsService.checkout(reservation.id);
    const refreshed = await productsRepository.findById(product.id);

    expect(checkout.reservation.status).toBe('completed');
    expect(checkout.order.reservationId).toBe(reservation.id);
    expect(checkout.order.unitPriceCents).toBe(54900);
    expect(checkout.order.totalPriceCents).toBe(54900);
    expect(refreshed?.stock_available).toBe(0);
    expect(refreshed?.stock_reserved).toBe(0);
    expect(refreshed?.stock_sold).toBe(1);
  });

  it('expires reservations and returns reserved stock to available', async () => {
    const sku = `EXPIRE-${randomUUID()}`;
    const product = await productsRepository.create({
      sku,
      slug: sku.toLowerCase(),
      brand: 'Nike',
      model: 'Air Max 1',
      name: 'Nike Air Max Expiry Test',
      colorway: 'Blue/Grey',
      description: null,
      priceCents: 69900,
      imageUrl: null,
      releaseAt: null,
      stockTotal: 1,
    });

    const reservation = await reservationsService.create({
      productId: product.id,
      customerEmail: 'expired@example.com',
    });

    await database.query(
      `
        UPDATE reservations
        SET expires_at = now() - interval '1 second'
        WHERE id = $1
      `,
      [reservation.id],
    );

    const result = await reservationsService.expireActiveReservations();
    const refreshed = await productsRepository.findById(product.id);
    const expiredReservation = await reservationsService.findById(reservation.id);

    expect(result.expiredCount).toBeGreaterThanOrEqual(1);
    expect(expiredReservation.status).toBe('expired');
    expect(refreshed?.stock_available).toBe(1);
    expect(refreshed?.stock_reserved).toBe(0);
    expect(refreshed?.stock_sold).toBe(0);
  });
});
