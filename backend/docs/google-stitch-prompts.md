# Google Stitch Prompts And Mockups

Use these prompts after the backend is running at `http://localhost:3100/api`.

The frontend should cover every required challenge flow:

- View available products.
- Reserve a product.
- Complete checkout for a reservation.
- Handle expired reservations.
- Communicate clearly with the backend through the API contract below.

## Required Mockups

Ask Stitch to create these screens/states:

1. Product drop grid
   - Product image, brand, model, colorway, price, release date, and available stock.
   - Reserve button disabled when `stockAvailable === 0`.
   - Sold-out visual state.

2. Product focus view
   - Larger product image.
   - Drop details.
   - Stock status.
   - Quantity fixed to one pair for the first version.
   - Email input for reservation.

3. Active reservation panel
   - Countdown based on `reservation.expiresAt`.
   - Reservation status badge.
   - Checkout button.
   - Cancel reservation button.
   - Persist active reservation in `localStorage`.

4. Checkout success view
   - Show `order.orderNumber`.
   - Show product name, quantity, and total price.
   - Confirm that reservation status is `completed`.

5. Expired reservation state
   - Show that the reservation expired.
   - Disable checkout.
   - Refresh product inventory.
   - Let the user try reserving again if stock is available.

6. Sold-out conflict state
   - Handle `409 Conflict` from `POST /reservations`.
   - Show a clear sold-out message.
   - Refresh product inventory.

7. Loading and empty states
   - Product loading skeleton.
   - Empty catalog state.
   - Network error state with retry.

8. Optional order history panel
   - Read from `GET /orders`.
   - Show latest confirmed orders for demo/admin visibility.

## Prompt 1: Main App

Create a React + TypeScript frontend for a limited sneaker drop app called DropLock.

The app should connect to this API base URL:

`http://localhost:3100/api`

Build the actual shopping/reservation experience as the first screen, not a marketing landing page.

Core user flow:

1. Load products from `GET /products`.
2. Display limited sneaker drops with image, brand, model, colorway, price, release date, and available stock.
3. Let a user reserve one pair with `POST /reservations`.
4. After reservation success, show a countdown using `expiresAt`.
5. Let the user complete checkout with `POST /reservations/:id/checkout`.
6. After checkout success, show the generated `order.orderNumber`.
7. Handle errors clearly:
   - `409` means sold out or invalid reservation state.
   - `410` means reservation expired.
   - `404` means reservation/order/product not found.

Use a refined sneaker-release style: clean black/white base, sharp product imagery, high-contrast calls to action, and compact stock/status indicators. Avoid a generic SaaS dashboard look.

Required layout:

- Top bar with DropLock brand, live drop status, and small order history button.
- Main grid of products.
- Right-side or bottom active reservation panel.
- Modal or full-width success section after checkout.
- Toast/banner area for `409`, `410`, and network errors.

Expected API shapes:

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

## Prompt 2: Polish UI Copy

Update the frontend copy to Polish while keeping API field names unchanged.

Use short labels:

- "Dostepne pary"
- "Zarezerwuj"
- "Rezerwacja aktywna"
- "Dokoncz checkout"
- "Zamowienie potwierdzone"
- "Rezerwacja wygasla"
- "Wyprzedane"

The UI should still feel like a premium sneaker drop, not a regular ecommerce catalog.

## Prompt 3: Error And Loading States

Add complete loading, empty, and error states.

Requirements:

- Disable reserve buttons while a reservation request is in flight.
- Disable checkout after the countdown reaches zero.
- If checkout returns `410`, show that the reservation expired and refresh products.
- If reserve returns `409`, show that the product sold out and refresh products.
- Store the active reservation in localStorage so a page refresh keeps the countdown visible.
- Provide a way to cancel the active reservation with `POST /reservations/:id/cancel`.

## Prompt 4: API Integration Details

Implement a small typed API client.

Use:

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

- reservation success
- reservation conflict
- checkout success
- checkout expiry
- cancellation

## Prompt 5: Mobile Responsive Mockup

Create a mobile version:

- Product cards stack vertically.
- Active reservation panel becomes a sticky bottom sheet.
- Countdown and checkout button stay visible without covering product text.
- Buttons must not overflow on narrow screens.
- Use concise labels and stable card heights.
