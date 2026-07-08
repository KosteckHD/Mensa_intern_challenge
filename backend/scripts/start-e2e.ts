async function main(): Promise<void> {
  process.env.DATABASE_URL ??=
    'postgres://postgres:postgres@localhost:55433/sneaker_drop_e2e';
  process.env.PORT ??= '3101';
  process.env.CORS_ORIGIN ??= 'http://127.0.0.1:4175';
  process.env.EXPIRED_RESERVATIONS_SWEEP_MS ??= '0';
  process.env.RESERVATION_TTL_SECONDS ??= '300';
  process.env.SHIPPING_CENTS ??= '3500';

  await import('../src/main');
}

void main();
