# Limited Sneaker Drop Backend

NestJS + TypeScript backend for a limited sneaker drop reservation system.

## Core decision

PostgreSQL is used because inventory correctness is a transactional problem. The backend intentionally uses parameterized SQL through `pg` instead of an ORM so transaction boundaries, row locks and conditional inventory updates remain explicit.

## Main invariant

`stock_available + stock_reserved + stock_sold = stock_total`

This invariant exists on both `products` and `product_sizes`. Product rows keep aggregate counters for fast reads. `product_sizes` is the critical reservation table because each sneaker size has separate supply.

Reservations move stock through this lifecycle:

`available -> reserved -> sold`

Expired or cancelled reservations move stock back:

`reserved -> available`

## Setup

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npm run migrate
npm run seed
npm run start:dev
```

## Important endpoints

```txt
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/sizes
PATCH  /api/products/:id/sizes/:sizeCode
DELETE /api/products/:id/sizes/:sizeCode

POST   /api/reservations
GET    /api/reservations
GET    /api/reservations/:id
POST   /api/reservations/:id/checkout
POST   /api/reservations/:id/cancel
POST   /api/reservations/cleanup/expired

GET    /api/orders
GET    /api/orders/:id
```

Checkout returns both the completed reservation and the created order:

```json
{
  "reservation": {
    "id": 12,
    "status": "completed"
  },
  "order": {
    "id": 4,
    "orderNumber": "ORD-4EE946DBDE1C",
    "status": "confirmed",
    "unitPriceCents": 89900,
    "shippingCents": 3500,
    "totalPriceCents": 93400
  }
}
```

## Race condition protection

Creating a reservation uses a single conditional update inside a database transaction:

```sql
UPDATE product_sizes
SET stock_available = stock_available - $3,
    stock_reserved = stock_reserved + $3
WHERE product_id = $1
  AND size_code = $2
  AND stock_available >= $3
RETURNING *;
```

If `RETURNING` gives no row, the request receives `409 Conflict`. PostgreSQL row-level locking makes concurrent attempts serialize on the product-size row, so the same size cannot be reserved twice.

## Primary keys

The schema uses `serial` integer primary keys. This keeps the recruitment challenge easy to inspect, seed, debug, and explain. The trade-off is that public numeric IDs are enumerable, so a production version could keep internal `bigserial` IDs and add separate public UUIDs for API URLs.

## Orders

Orders are created only during checkout. The app does not expose `POST /orders` because an order must always come from a valid active reservation.

Each order stores a price snapshot:

- `unit_price_cents`
- `shipping_cents`
- `total_price_cents`

It also stores shipping details and an opaque payment reference. Raw card data
is intentionally not accepted or persisted.

This prevents historical orders from changing if the product price is edited later.

## Run the concurrency test

Create a separate test database or reuse the local one during development:

```bash
set TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/sneaker_drop
npm test
```

For the isolated test database used by the full suite:

```bash
docker compose -f docker-compose.e2e.yml up -d --wait
set DATABASE_URL=postgres://postgres:postgres@localhost:55433/sneaker_drop_e2e
npm run migrate
set TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55433/sneaker_drop_e2e
npm test
```

## Frontend prompts

Google Stitch prompts are in `docs/google-stitch-prompts.md`.

The implemented React frontend is in `../frontend`.
