import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const describeIfDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDatabase('DropLock API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.EXPIRED_RESERVATIONS_SWEEP_MS = '0';
    process.env.RESERVATION_TTL_SECONDS = '300';
    process.env.SHIPPING_CENTS = '3500';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports size inventory CRUD and returns the archived product', async () => {
    const product = await createProduct([
      { sizeCode: 'EU 42', stockTotal: 2 },
    ]);

    expect(product.body.stockTotal).toBe(2);
    expect(product.body.sizes).toHaveLength(1);

    const added = await request(app.getHttpServer())
      .post(`/api/products/${product.body.id}/sizes`)
      .send({ sizeCode: 'EU 43', stockTotal: 4 })
      .expect(201);

    expect(added.body.stockTotal).toBe(6);
    expect(added.body.sizes).toHaveLength(2);

    const updated = await request(app.getHttpServer())
      .patch(`/api/products/${product.body.id}/sizes/EU%2043`)
      .send({ stockTotal: 3 })
      .expect(200);

    expect(updated.body.stockTotal).toBe(5);

    const removed = await request(app.getHttpServer())
      .delete(`/api/products/${product.body.id}/sizes/EU%2043`)
      .expect(200);

    expect(removed.body.stockTotal).toBe(2);
    expect(removed.body.sizes).toHaveLength(1);

    const archived = await request(app.getHttpServer())
      .delete(`/api/products/${product.body.id}`)
      .expect(200);

    expect(archived.body.archivedAt).toBeTruthy();
    await request(app.getHttpServer())
      .get(`/api/products/${product.body.id}`)
      .expect(404);
  });

  it('validates numeric route identifiers at the HTTP boundary', async () => {
    await request(app.getHttpServer()).get('/api/products/not-a-number').expect(400);
    await request(app.getHttpServer())
      .get('/api/reservations/not-a-number')
      .expect(400);
    await request(app.getHttpServer()).get('/api/orders/not-a-number').expect(400);
  });

  it('completes checkout with shipping details and server-calculated total', async () => {
    const product = await createProduct([
      { sizeCode: 'EU 42', stockTotal: 1 },
    ]);
    const reservation = await request(app.getHttpServer())
      .post('/api/reservations')
      .send({
        productId: product.body.id,
        customerEmail: 'checkout@example.com',
        quantity: 1,
        shoeSize: 'EU 42',
      })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post(`/api/reservations/${reservation.body.id}/checkout`)
      .send(checkoutDetails())
      .expect(201);

    expect(checkout.body.order.unitPriceCents).toBe(54900);
    expect(checkout.body.order.shippingCents).toBe(3500);
    expect(checkout.body.order.totalPriceCents).toBe(58400);
    expect(checkout.body.order.firstName).toBe('Ada');
    expect(checkout.body.order.paymentReference).toBe('test-payment-4242');
  });

  it('does not oversell through concurrent HTTP reservation requests', async () => {
    const product = await createProduct([
      { sizeCode: 'EU 42', stockTotal: 3 },
    ]);

    const attempts = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app.getHttpServer())
          .post('/api/reservations')
          .send({
            productId: product.body.id,
            quantity: 1,
            shoeSize: 'EU 42',
          }),
      ),
    );

    expect(attempts.filter((response) => response.status === 201)).toHaveLength(3);
    expect(attempts.filter((response) => response.status === 409)).toHaveLength(17);

    const refreshed = await request(app.getHttpServer())
      .get(`/api/products/${product.body.id}`)
      .expect(200);

    expect(refreshed.body.stockAvailable).toBe(0);
    expect(refreshed.body.stockReserved).toBe(3);
    expect(refreshed.body.sizes[0].stockAvailable).toBe(0);
  });

  function createProduct(
    sizes: Array<{ sizeCode: string; stockTotal: number }>,
  ) {
    const suffix = randomUUID();
    return request(app.getHttpServer())
      .post('/api/products')
      .send({
        sku: `E2E-${suffix}`,
        brand: 'Nike',
        model: 'Dunk Low',
        name: 'HTTP E2E Drop',
        colorway: 'Black/White',
        priceCents: 54900,
        sizes,
      })
      .expect(201);
  }
});

function checkoutDetails() {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    shippingAddress: '1 Drop Street',
    shippingCity: 'Warsaw',
    shippingPostalCode: '00-001',
    paymentReference: 'test-payment-4242',
  };
}
