# Mensa Intern Challenge - Limited Sneaker Drop

Full-stack internship challenge implementation for a limited product drop. The app models a sneaker release where many users can try to reserve the same limited item at the same time, while PostgreSQL transactions keep inventory accurate.

Repository: [github.com/KosteckHD/Mensa_intern_challenge](https://github.com/KosteckHD/Mensa_intern_challenge)

## Current Status

The backend is implemented and verified locally. The React + TypeScript frontend is implemented in `frontend/`, based on the Google Stitch mockups and connected to the backend API.

Implemented:

- View available sneaker drops.
- Reserve a product for a limited time.
- Complete checkout for an active reservation.
- Create an order during checkout.
- Expire reservations and return stock to availability.
- Protect inventory from race conditions with PostgreSQL transactions.
- Integration tests for concurrent reservations, checkout, and expiry.
- Frontend screens for live drop, inventory, reservation, checkout, success, and failure states.

Still to deliver before final submission:

- Hosted frontend and backend links.
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

- React
- TypeScript
- Vite

## Why PostgreSQL

Inventory correctness is a transactional problem. PostgreSQL gives row-level locking, transactions, constraints, indexes, and atomic conditional updates. Those features are exactly what this challenge needs to prevent overselling during concurrent reservations.

I intentionally avoided an ORM. The backend uses parameterized SQL through `pg` so the transaction boundaries and locking behavior are explicit and easy to explain.

## Data Model

Main tables:

- `products`: sneaker drop data and aggregate stock counters.
- `product_sizes`: size-level stock counters for each product.
- `reservations`: temporary holds on a specific product and shoe size.
- `orders`: confirmed orders created during checkout.

The key inventory invariant is enforced with a database check constraint:

```sql
stock_available + stock_reserved + stock_sold = stock_total
```

This invariant exists on both `products` and `product_sizes`. The critical source of truth for reservation availability is `product_sizes`, because each shoe size has its own supply.

Stock lifecycle:

```txt
available -> reserved -> sold
```

Expired or cancelled reservations move stock back:

```txt
reserved -> available
```

The full PostgreSQL schema is in `backend/schema.sql`.

## Primary Key Decision

The schema uses `serial` integer primary keys. For this recruitment challenge that keeps SQL, seed data, API examples, and debugging simple and readable.

The trade-off is that numeric IDs are easy to enumerate if they are exposed publicly. For a production marketplace, I would likely use:

- internal `bigserial` primary keys for larger ID space and efficient joins
- public `uuid` column for API exposure

For this challenge, `serial` is enough and keeps the implementation focused on the race-condition problem.

## Race Condition Protection

The critical reservation operation uses one conditional update inside a transaction:

```sql
UPDATE product_sizes
SET
  stock_available = stock_available - $3,
  stock_reserved = stock_reserved + $3
WHERE product_id = $1
  AND size_code = $2
  AND stock_available >= $3
RETURNING *;
```

If the query returns no row, the API responds with `409 Conflict`. Under concurrent requests, PostgreSQL serializes updates on the `(product_id, size_code)` inventory row, so the same limited size cannot be reserved twice.

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
POST   /api/products/:id/sizes
PATCH  /api/products/:id/sizes/:sizeCode
DELETE /api/products/:id/sizes/:sizeCode
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
    "id": 12,
    "shoeSize": "EU 42",
    "status": "completed"
  },
  "order": {
    "id": 4,
    "orderNumber": "ORD-4EE946DBDE1C",
    "shoeSize": "EU 42",
    "status": "confirmed",
    "unitPriceCents": 89900,
    "shippingCents": 3500,
    "totalPriceCents": 93400
  }
}
```

Checkout accepts shipping details and an opaque payment reference. Raw card
details are never sent to or stored by this backend:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "shippingAddress": "1 Drop Street",
  "shippingCity": "Warsaw",
  "shippingPostalCode": "00-001",
  "paymentReference": "demo-card-4242"
}
```

## Local Setup

Backend:

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

Frontend:

```bash
cd frontend
npm install
npm run dev
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

For the frontend, set the backend URL if needed:

```bash
set VITE_API_BASE_URL=http://localhost:3100/api
npm run dev
```

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

Run the browser end-to-end suite:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

The Playwright suite runs against desktop and mobile Chromium. It covers the
complete reservation and checkout flow, verifies the selected-size API payload,
and checks sold-out (`409`), expired reservation (`410`), loading, and empty
inventory states. API responses are controlled in the browser suite so these UI
tests remain deterministic; PostgreSQL concurrency is covered separately by the
backend integration tests above.

Run the real browser-to-database flow after starting and migrating the isolated
database from `backend/docker-compose.e2e.yml`:

```bash
cd frontend
npm run test:e2e:full
```

Verified locally:

```txt
backend npm run build -> OK
frontend npm run build -> OK
frontend npm run test:e2e -> 10 passed
backend npm test with TEST_DATABASE_URL -> 7 passed
frontend npm run test:e2e:full -> 1 passed
```

## Assumptions

- Each reservation can reserve one or more units, but the UI will initially reserve one pair.
- Each sneaker size has its own supply, so users reserve a specific `shoeSize`.
- A reservation must exist before checkout.
- Orders are created only by checkout, not directly through `POST /orders`.
- Payment processing is outside the scope of this challenge. Checkout stores
  only an opaque demo payment reference, never raw card data.
- Product deletion is implemented as soft archive to keep historical reservations and orders valid.

## Trade-Offs

- I used explicit SQL instead of an ORM to make concurrency behavior transparent.
- Aggregate inventory counters are stored on `products` for fast reads, while `product_sizes` is used for size-specific reservation correctness.
- Reservation expiry is implemented with a background sweep instead of a separate queue system because this is a small challenge app.
- Orders store a price snapshot so historical orders do not change if product prices are edited later.

## What I Would Improve With More Time

- Add authentication and per-user reservations.
- Add payment provider integration.
- Add OpenAPI/Swagger documentation.
- Add visual-regression and automated accessibility checks to the E2E suite.
- Add observability around reservation conflicts and expiry sweeps.
- Use a production job runner or queue for expiry processing at larger scale.

## Deployment

The repository includes `render.yaml`, which provisions the NestJS API, React
static site, PostgreSQL database, migrations, environment variables, health
check, and SPA route rewrite.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/KosteckHD/Mensa_intern_challenge)

Expected service URLs after creating the Blueprint:

- Frontend: `https://kosteckhd-mensa-droplock-web.onrender.com`
- Backend: `https://kosteckhd-mensa-droplock-api.onrender.com/api`

Confirm the generated Render subdomains after deployment and replace these
expected URLs if Render adds a suffix.

## Video Walkthrough Plan

Maximum 5-minute structure:

1. Explain the limited sneaker drop problem and race condition risk.
2. Show the database schema and inventory invariant.
3. Show the atomic reservation SQL.
4. Demonstrate reservation, checkout, and order creation.
5. Run or show the concurrent reservation test.
6. Briefly show the frontend flow.
