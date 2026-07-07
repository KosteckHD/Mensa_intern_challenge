# Google Stitch UI Specification

Use this file as the frontend brief for Google Stitch.

The backend API should be running at:

```txt
http://localhost:3100/api
```

Create a React + TypeScript frontend for a limited sneaker drop app called **DropLock**.

The app is not a marketing landing page. The first screen must be the actual product drop and reservation experience.

## Product Concept

DropLock is a limited sneaker release app inspired by high-demand drops like Nike/Jordan releases.

The user should be able to:

- View available sneaker drops.
- See current inventory.
- Reserve one pair.
- See a reservation countdown.
- Complete checkout before the reservation expires.
- See a confirmed order after checkout.
- Understand sold-out, expired, failed, loading, and empty states.

## Visual Direction

Create a premium sneaker-drop interface, not a generic ecommerce catalog and not a SaaS dashboard.

Style:

- Clean black and white base.
- High contrast CTA buttons.
- Product imagery is the main visual signal.
- Small, sharp inventory/status badges.
- Compact but polished layout.
- Use subtle borders and restrained shadows.
- Avoid oversized marketing hero sections.
- Avoid decorative gradients and abstract illustrations.

Suggested palette:

- Background: near-white `#f7f7f4`
- Text: almost-black `#111111`
- Muted text: `#6b6b6b`
- Borders: `#deded8`
- Primary CTA: black
- Success: deep green
- Warning/failure: red or amber accents only where needed

Typography:

- Use a modern sans-serif.
- Product names should be strong and compact.
- Do not use viewport-scaled fonts.
- Make sure all text fits on mobile.

## Global App Shell

All screens should share the same shell.

Desktop layout:

- Sticky top bar, 64px height.
- Left: `DropLock` wordmark.
- Center or right: small live status pill, e.g. `LIVE DROP`.
- Right: small buttons for `Inventory`, `Orders`, and `Refresh`.
- Main content max width around 1200-1320px.
- Product/inventory area on the left.
- Reservation or checkout panel on the right when active.

Mobile layout:

- Top bar becomes compact.
- Product cards stack vertically.
- Active reservation or checkout becomes a sticky bottom sheet.
- Buttons must remain visible and must not overlap content.

Global UI pieces:

- Toast/banner area for API errors.
- Loading skeletons.
- Empty state.
- Retry button for network errors.
- Currency displayed from cents, e.g. `899.00 PLN` or `899 zl`.

## Screen 1: Entry / Live Drop

Purpose:

This is the first screen users see. It should immediately communicate that a limited sneaker drop is live and products can be reserved.

Desktop layout:

- Top bar as described above.
- First viewport contains:
  - Left: featured product image from the first available drop.
  - Right: compact drop summary panel.
  - Below or beside: product cards preview.
- Do not create a separate marketing hero. The product list must be visible in the first viewport.

Drop summary panel content:

- Title: `DropLock`
- Subtitle: `Limited sneaker reservations`
- Live status: `LIVE DROP`
- Total available pairs across all loaded products.
- Total sold pairs across all loaded products.
- Short line: `Reserve a pair before checkout time runs out.`
- CTA: `View inventory`

Product preview cards:

- Image.
- Brand.
- Model.
- Colorway.
- Price.
- Available stock.
- Reserve button.

Behavior:

- Fetch products with `GET /products` on load.
- Show loading skeletons while fetching.
- If no products are returned, show the empty state from Screen 7.
- If the request fails, show the network failure state from Screen 7.

## Screen 2: Full Inventory

Purpose:

Show the complete inventory and make stock status obvious.

Desktop layout:

- Page title: `Inventory`
- Subtitle: `All limited pairs currently available for reservation.`
- Above grid: compact stats row:
  - `Products`
  - `Available pairs`
  - `Reserved`
  - `Sold`
- Product grid with 3 columns on desktop.
- 2 columns on tablet.
- 1 column on mobile.

Product card content:

- Product image with fixed aspect ratio.
- Status badge:
  - `Available` if `stockAvailable > 0`
  - `Low stock` if `stockAvailable <= 3 && stockAvailable > 0`
  - `Sold out` if `stockAvailable === 0`
- Brand and model.
- Product name.
- Colorway.
- SKU in small muted text.
- Price.
- Release date.
- Stock counter: `X / Y pairs available`
- Reserve button.

Reserve button states:

- Enabled: `Reserve pair`
- Loading: `Reserving...`
- Disabled sold out: `Sold out`

Behavior:

- Clicking a product card opens Screen 3 as a detail drawer or detail panel.
- Clicking `Reserve pair` can either open Screen 3 or directly create a reservation if email is already known.
- After a successful reservation, refresh products.
- After a `409 Conflict`, refresh products and show the sold-out failure state.

## Screen 3: Product Detail / Reserve

Purpose:

Let the user inspect one sneaker and reserve one pair.

Desktop layout:

- Use a right-side drawer or centered modal.
- Left side: larger product image.
- Right side: product details and reservation form.

Content:

- Brand.
- Product name.
- Model.
- Colorway.
- SKU.
- Description.
- Price.
- Available stock.
- Release date.
- Quantity fixed at `1`.
- Email input labelled `Email for reservation`.
- Primary CTA: `Reserve pair`.
- Secondary CTA: `Back to inventory`.

Validation:

- Email is optional from the backend perspective, but UI should ask for it.
- If email is empty, allow reservation but show helper text: `You can reserve without email for this demo.`

API:

```http
POST /reservations
Content-Type: application/json

{
  "productId": "product-id",
  "customerEmail": "buyer@example.com",
  "quantity": 1
}
```

Success behavior:

- Store the reservation in `localStorage`.
- Open Screen 4.
- Refresh product inventory.

Failure behavior:

- `409`: show sold-out failure state.
- Network error: show retry banner.

## Screen 4: Active Reservation / Checkout

Purpose:

Show the active reservation and let the user finish checkout before it expires.

Desktop layout:

- If a reservation exists, show a persistent right-side panel.
- The panel should be visible while browsing inventory.
- On mobile, show it as a sticky bottom sheet.

Panel content:

- Header: `Reservation active`
- Countdown timer from `reservation.expiresAt`.
- Product thumbnail and product name.
- Quantity.
- Price estimate.
- Reservation ID in small muted text.
- Status badge: `active`.
- Primary CTA: `Complete checkout`.
- Secondary CTA: `Cancel reservation`.

Countdown behavior:

- Show minutes and seconds.
- Under 60 seconds, visually emphasize the countdown.
- At zero:
  - Disable checkout.
  - Show `Reservation expired`.
  - Refresh product inventory.

API:

Checkout:

```http
POST /reservations/:id/checkout
```

Cancel:

```http
POST /reservations/:id/cancel
```

Checkout success:

- Open Screen 5.
- Clear active reservation from `localStorage`.
- Refresh products.

Checkout expired:

- If backend returns `410`, open Screen 6B.
- Clear active reservation from `localStorage`.
- Refresh products.

Checkout conflict:

- If backend returns `409`, open Screen 6C.

## Screen 5: Checkout Success

Purpose:

Confirm the order after checkout succeeds.

Layout:

- Use a focused confirmation view, modal, or full-width success section.
- Do not make it look like a generic payment receipt page.
- It should feel like a sneaker drop confirmation.

Content:

- Success badge: `Order confirmed`
- Main title: `Your pair is locked.`
- Order number from `order.orderNumber`.
- Product thumbnail.
- Product name.
- Colorway.
- Quantity.
- Total price from `order.totalPriceCents`.
- Reservation status: `completed`.
- Order status: `confirmed`.
- CTA: `Back to inventory`.
- Secondary CTA: `View orders`.

API response shape:

```ts
type CheckoutResponse = {
  reservation: Reservation;
  order: Order;
};
```

Behavior:

- After success, no active reservation should remain.
- Product inventory should refresh so stock sold is reflected.

## Screen 6: Failure States

Failure states must be designed as real UI states, not browser alerts.

### Screen 6A: Sold Out During Reservation

Trigger:

- `POST /reservations` returns `409`.

Layout:

- Banner or modal over inventory.
- Keep product context visible if possible.

Content:

- Title: `Sold out`
- Message: `This pair was reserved by other buyers before your request completed.`
- CTA: `Refresh inventory`
- Secondary CTA: `Browse other pairs`

Behavior:

- Refresh products immediately.
- Disable reserve button if `stockAvailable === 0`.

### Screen 6B: Reservation Expired

Trigger:

- Countdown reaches zero.
- Or checkout returns `410`.

Content:

- Title: `Reservation expired`
- Message: `Your hold ended and the pair returned to available inventory.`
- CTA: `Try again`
- Secondary CTA: `Back to inventory`

Behavior:

- Clear reservation from `localStorage`.
- Refresh products.
- Disable checkout.

### Screen 6C: Checkout Conflict

Trigger:

- Checkout returns `409`.

Content:

- Title: `Checkout unavailable`
- Message: `This reservation can no longer be checked out.`
- CTA: `Back to inventory`

Behavior:

- Fetch reservation status if needed.
- Refresh products.

### Screen 6D: Network Failure

Trigger:

- Any API call fails because the server is unavailable.

Content:

- Title: `Connection problem`
- Message: `The drop server could not be reached.`
- CTA: `Retry`

Behavior:

- Retry the failed request.
- Keep existing UI state when possible.

## Screen 7: Loading And Empty States

### Loading Products

Show skeleton cards with:

- Image placeholder.
- Text rows.
- Stock badge placeholder.
- Disabled CTA placeholder.

### Empty Inventory

Content:

- Title: `No active drops`
- Message: `There are no sneaker drops available right now.`
- CTA: `Refresh`

### Loading Checkout

When checkout is in progress:

- Disable checkout and cancel buttons.
- Button label: `Completing checkout...`
- Keep countdown visible.

## Screen 8: Orders / Demo History

Purpose:

Optional demo/admin view to prove checkout creates orders.

Layout:

- Compact list or drawer.
- Latest orders first.

Content per order:

- Order number.
- Product ID or product name if locally matched.
- Quantity.
- Total price.
- Status.
- Created date.

API:

```http
GET /orders
GET /orders/:id
```

## API Types

```ts
type Product = {
  id: string;
  sku: string;
  slug: string;
  brand: string;
  model: string;
  name: string;
  colorway: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  releaseAt: string | null;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

type Reservation = {
  id: string;
  productId: string;
  customerEmail: string | null;
  quantity: number;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  reservationId: string;
  productId: string;
  customerEmail: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  status: 'confirmed' | 'cancelled' | 'refunded';
  createdAt: string;
  updatedAt: string;
};

type CheckoutResponse = {
  reservation: Reservation;
  order: Order;
};
```

## API Client Requirements

Use a typed client:

```ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';
```

Required functions:

- `getProducts(): Promise<Product[]>`
- `createReservation(input: { productId: string; customerEmail?: string; quantity: 1 }): Promise<Reservation>`
- `checkoutReservation(reservationId: string): Promise<CheckoutResponse>`
- `cancelReservation(reservationId: string): Promise<Reservation>`
- `getOrders(): Promise<Order[]>`

Refresh products after:

- Reservation success.
- Reservation conflict.
- Checkout success.
- Checkout expiry.
- Cancellation.

## Polish UI Copy

Use Polish labels in the UI. If the generator has encoding issues, ASCII fallback is acceptable.

Preferred labels:

- `DropLock`
- `Limitowany drop`
- `Dostepne pary`
- `Zarezerwuj pare`
- `Rezerwacja aktywna`
- `Dokoncz checkout`
- `Zamowienie potwierdzone`
- `Rezerwacja wygasla`
- `Wyprzedane`
- `Odswiez inventory`

## Final Stitch Prompt

Copy this prompt into Stitch:

```txt
Create a React + TypeScript app called DropLock for a limited sneaker drop.

Use the API at http://localhost:3100/api.

Build all screens from this specification:

1. Entry / Live Drop screen.
2. Full Inventory screen.
3. Product Detail / Reserve drawer.
4. Active Reservation / Checkout panel.
5. Checkout Success screen.
6. Failure states: sold out, expired reservation, checkout conflict, network failure.
7. Loading and empty states.
8. Optional Orders / Demo History screen.

The first screen must be the actual drop inventory experience, not a marketing landing page.

Use a premium sneaker-release visual style: clean black and white base, sharp product imagery, compact inventory badges, clear CTAs, responsive mobile bottom sheet for active reservation, and no generic SaaS dashboard look.

Implement typed API calls for products, reservations, checkout, cancellation, and orders. Persist active reservation in localStorage. Refresh inventory after reservation, checkout, cancellation, conflict, and expiry.
```
