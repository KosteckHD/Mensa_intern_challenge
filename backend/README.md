# Limited Sneaker Drop Backend

NestJS + TypeScript backend for a limited sneaker drop reservation system.

## Core decision

PostgreSQL is used because inventory correctness is a transactional problem. The backend intentionally uses parameterized SQL through `pg` instead of an ORM so transaction boundaries, row locks and conditional inventory updates remain explicit.

## Main invariant

`products.stock_available + products.stock_reserved + products.stock_sold = products.stock_total`

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
    "id": "uuid",
    "status": "completed"
  },
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-4EE946DBDE1C",
    "status": "confirmed",
    "unitPriceCents": 89900,
    "totalPriceCents": 89900
  }
}
```

## Race condition protection

Creating a reservation uses a single conditional update inside a database transaction:

```sql
UPDATE products
SET stock_available = stock_available - $2,
    stock_reserved = stock_reserved + $2
WHERE id = $1
  AND stock_available >= $2
  AND archived_at IS NULL
RETURNING *;
```

If `RETURNING` gives no row, the request receives `409 Conflict`. PostgreSQL row-level locking makes concurrent attempts serialize on the product row, so the same pair cannot be reserved twice.

## Orders

Orders are created only during checkout. The app does not expose `POST /orders` because an order must always come from a valid active reservation.

Each order stores a price snapshot:

- `unit_price_cents`
- `total_price_cents`

This prevents historical orders from changing if the product price is edited later.

## Run the concurrency test

Create a separate test database or reuse the local one during development:

```bash
set TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/sneaker_drop
npm test
```

## Frontend prompts

Google Stitch prompts are in `docs/google-stitch-prompts.md`.
