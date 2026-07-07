# Mensa Intern Challenge - Limited Sneaker Drop

Full-stack internship challenge implementation for a limited product drop. The app models a sneaker release where many users can try to reserve the same limited item at the same time, while PostgreSQL transactions keep inventory accurate.

## Current Status

The backend is implemented and verified locally. The frontend contract and Google Stitch prompts are prepared in `backend/docs/google-stitch-prompts.md`.

Implemented:

- View available sneaker drops.
- Reserve a product for a limited time.
- Complete checkout for an active reservation.
- Create an order during checkout.
- Expire reservations and return stock to availability.
- Protect inventory from race conditions with PostgreSQL transactions.
- Integration tests for concurrent reservations, checkout, and expiry.

Still to deliver before final submission:

- React + TypeScript frontend.
- Hosted frontend and backend links.
- Final GitHub repository link in this README.
- Short video walkthrough.

## Tech Stack

Backend:

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- `pg` driver with handwritten SQL

Database:

- PostgreSQL

Frontend:

- Planned: React + TypeScript
- Prompts prepared for Google Stitch

## Why PostgreSQL

Inventory correctness is a transactional problem. PostgreSQL gives row-level locking, transactions, constraints, indexes, and atomic conditional updates. Those features are exactly what this challenge needs to prevent overselling during concurrent reservations.

I intentionally avoided an ORM. The backend uses parameterized SQL through `pg` so the transaction boundaries and locking behavior are explicit and easy to explain.

## Data Model

Main tables:

- `products`: sneaker drop data and stock counters.
- `reservations`: temporary holds on stock.
- `orders`: confirmed orders created during checkout.

The key inventory invariant is enforced with a database check constraint:

```sql
stock_available + stock_reserved + stock_sold = stock_total
```

Stock lifecycle:

```txt
available -> reserved -> sold
```

Expired or cancelled reservations move stock back:

```txt
reserved -> available
```

The full PostgreSQL schema is in `backend/schema.sql`.

## Race Condition Protection

The critical reservation operation uses one conditional update inside a transaction:

```sql
UPDATE products
SET
  stock_available = stock_available - $2,
  stock_reserved = stock_reserved + $2
WHERE id = $1
  AND archived_at IS NULL
  AND stock_available >= $2
RETURNING *;
```

If the query returns no row, the API responds with `409 Conflict`. Under concurrent requests, PostgreSQL serializes updates on the product row, so the same limited stock cannot be reserved twice.

## Reservation Expiration

Reservations expire after `RESERVATION_TTL_SECONDS`.

Expiration is handled in two ways:

- A background sweep in the NestJS service.
- Manual cleanup endpoint: `POST /api/reservations/cleanup/expired`.

When a reservation expires, the backend updates the reservation status and moves stock from `reserved` back to `available` in one transaction.

## API Overview

Products:

```txt
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
```

Reservations:

```txt
GET  /api/reservations
POST /api/reservations
GET  /api/reservations/:id
POST /api/reservations/:id/checkout
POST /api/reservations/:id/cancel
POST /api/reservations/cleanup/expired
```

Orders:

```txt
GET /api/orders
GET /api/orders/:id
```

Checkout response:

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

## Local Setup

```bash
cd backend
npm install
docker compose up -d
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Run migrations and seed data:

```bash
npm run migrate
npm run seed
```

Start the backend:

```bash
npm run start:dev
```

By default, local PostgreSQL is exposed on:

```txt
localhost:55432
```

The backend defaults to:

```txt
http://localhost:3000/api
```

During local verification I used `PORT=3100` because port `3000` was already taken.

## Testing

Run the TypeScript build:

```bash
npm run build
```

Run tests against a real PostgreSQL database:

```bash
set TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/sneaker_drop
npm test
```

The most important test starts 50 concurrent reservation attempts against a product with only 5 items. Exactly 5 reservations succeed and the rest fail with conflict behavior.

Verified locally:

```txt
npm run build -> OK
npm test with TEST_DATABASE_URL -> 3 passed
```

## Assumptions

- Each reservation can reserve one or more units, but the UI will initially reserve one pair.
- A reservation must exist before checkout.
- Orders are created only by checkout, not directly through `POST /orders`.
- Payment processing is outside the scope of this challenge.
- Product deletion is implemented as soft archive to keep historical reservations and orders valid.

## Trade-Offs

- I used explicit SQL instead of an ORM to make concurrency behavior transparent.
- Inventory counters are stored on `products` for fast reads and guarded by database constraints.
- Reservation expiry is implemented with a background sweep instead of a separate queue system because this is a small challenge app.
- Orders store a price snapshot so historical orders do not change if product prices are edited later.

## What I Would Improve With More Time

- Add authentication and per-user reservations.
- Add payment provider integration.
- Add OpenAPI/Swagger documentation.
- Add end-to-end tests with the React frontend.
- Add observability around reservation conflicts and expiry sweeps.
- Use a production job runner or queue for expiry processing at larger scale.

## Deployment

Planned deployment:

- Backend: Render, Railway, or Fly.io.
- PostgreSQL: Neon, Supabase, or Railway Postgres.
- Frontend: Vercel or Netlify.

Hosted links will be added here after deployment.

## Video Walkthrough Plan

Maximum 5-minute structure:

1. Explain the limited sneaker drop problem and race condition risk.
2. Show the database schema and inventory invariant.
3. Show the atomic reservation SQL.
4. Demonstrate reservation, checkout, and order creation.
5. Run or show the concurrent reservation test.
6. Briefly show the frontend flow.
