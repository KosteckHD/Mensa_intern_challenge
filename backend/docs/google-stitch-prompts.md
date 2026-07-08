# DropLock Google Stitch Mockups And Prompts

This file is the UI brief for Google Stitch. It should create mockups only. Do not ask Stitch to invent backend behavior, database logic, marketing copy, abstract illustrations, or generative decorative assets.

Backend API base URL for the final app:

```txt
http://localhost:3100/api
```

## Core UX Rules

- Build the real app experience first, not a landing page.
- The first screen must show the live sneaker drop and inventory access.
- Every product has multiple size variants. The user must select a shoe size before reserving.
- Inventory status must be shown per size, not only per product.
- Use images returned by the API (`imageUrl`) or neutral product placeholders. Do not create AI/generative artwork inside the UI.
- Keep the interface compact, operational, and easy to scan.
- Avoid nested cards, decorative blobs, generic SaaS dashboard styling, oversized hero-only screens, and explanatory in-app text about how the app works.
- Keep buttons and labels short. Text must not overflow on mobile.
- Use consistent header, spacing, status badges, and CTA placement across screens.

Visual direction:

- Premium sneaker drop.
- Black and near-white base.
- Sharp product imagery.
- Thin borders.
- 4-8px radius max.
- High-contrast primary CTA.
- Green only for confirmed/success states.
- Red/amber only for real errors or urgent countdowns.

## Required Mockup Set

Create these mockups:

1. Live Drop / Entry
2. Full Inventory
3. Product Detail + Size Selection
4. Reservation Active
5. Checkout Desktop
6. Checkout Mobile
7. Checkout Success
8. Failure: Sold Out / Size Unavailable
9. Failure: Reservation Expired
10. Loading / Empty / Network Error
11. Optional Orders History

The screens should feel like one product, not separate unrelated pages.

## API Shapes To Design Against

```ts
type ProductSize = {
  id: number;
  productId: number;
  sizeCode: string; // example: "EU 42"
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: number;
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
  stockTotal: number;      // aggregate across all sizes
  stockAvailable: number;  // aggregate across all sizes
  stockReserved: number;   // aggregate across all sizes
  stockSold: number;       // aggregate across all sizes
  sizes: ProductSize[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

type Reservation = {
  id: number;
  productId: number;
  customerEmail: string | null;
  quantity: number;
  shoeSize: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

type Order = {
  id: number;
  orderNumber: string;
  reservationId: number;
  productId: number;
  customerEmail: string | null;
  quantity: number;
  shoeSize: string;
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

Required API calls:

```txt
GET  /products
POST /reservations
POST /reservations/:id/checkout
POST /reservations/:id/cancel
GET  /orders
```

Reservation request:

```json
{
  "productId": 1,
  "shoeSize": "EU 42",
  "customerEmail": "buyer@example.com",
  "quantity": 1
}
```

## Mockup 1: Live Drop / Entry

Purpose:

Show that the drop is live and immediately expose product availability.

Desktop layout:

- Sticky top nav, 64px high.
- Left: `DROPLOCK` brand.
- Center/right: `LIVE DROP` status pill.
- Nav actions: `Inventory`, `Orders`, `Refresh`.
- First viewport uses a 12-column layout:
  - 8 columns: featured sneaker image from the first product.
  - 4 columns: drop summary panel.
  - bottom row: 3-4 compact allocation cards.

Drop summary panel:

- Title: `DROPLOCK`
- Subtitle: `Limited sneaker reservations`
- Metrics:
  - total products
  - total available pairs
  - reserved pairs
  - sold pairs
- CTA: `View inventory`

Product preview cards:

- image
- model
- colorway
- lowest available size count, e.g. `EU 42: 3 left`
- aggregate available count

Mobile layout:

- Header remains fixed.
- Featured image first.
- Summary panel below.
- Allocation cards as horizontal scroll or two-column grid.

Prompt:

```txt
Create the DropLock Live Drop screen. Use a premium sneaker drop layout, not a marketing landing page. The first viewport must show a featured sneaker image, live status, inventory metrics, and preview product cards. Include aggregate stock and at least one visible size-level stock hint per card. Use product imagery, thin borders, black/white palette, compact CTAs, and no decorative/generative visuals.
```

## Mockup 2: Full Inventory

Purpose:

Let users scan all products and understand available supply across sizes.

Desktop layout:

- Page title: `Inventory`
- Stats row:
  - Products
  - Available pairs
  - Reserved
  - Sold
- Search input.
- Toggle: `Only available`
- Optional filter: `Size`
- Product grid: 3 columns desktop, 2 tablet, 1 mobile.

Product card:

- image with fixed aspect ratio
- status badge:
  - `Available`
  - `Low stock`
  - `Sold out`
- brand/model
- colorway
- price
- aggregate stock: `12 / 20 available`
- visible size chips:
  - `EU 40`
  - `EU 41`
  - `EU 42`
  - `EU 43`
- each chip shows availability state:
  - enabled if size stock > 0
  - muted/disabled if size stock = 0
- CTA: `Select size`

UX rule:

Do not let users reserve from this card without selecting a size unless a size has already been selected.

Prompt:

```txt
Create the DropLock Full Inventory screen. Show a searchable and filterable sneaker inventory grid. Each product card must display aggregate stock and size chips with per-size availability. The primary action should be "Select size", not direct checkout. Sold-out sizes must be visibly disabled. Keep layout dense, readable, and responsive.
```

## Mockup 3: Product Detail + Size Selection

Purpose:

Let the user inspect one product and choose the exact size variant before reservation.

Layout:

- Desktop: right-side drawer or split detail panel.
- Mobile: full-screen sheet.

Content:

- large product image
- brand
- model/name
- colorway
- SKU
- description
- price
- release date
- aggregate stock
- size selector grid
- email input
- CTA: `Reserve pair`
- secondary: `Back to inventory`

Size selector:

- Show all `product.sizes`.
- Each size tile contains:
  - size code, e.g. `EU 42`
  - available count, e.g. `3 left`
- Disabled when `stockAvailable === 0`.
- Selected size has strong black border.
- If no size selected, reserve CTA is disabled.

Prompt:

```txt
Create the Product Detail and Size Selection screen for DropLock. The core interaction is selecting an available shoe size before reserving. Show a large product image, product details, price, SKU, email field, and a size grid with per-size stock counts. Disable sold-out sizes and disable the Reserve Pair button until an available size is selected.
```

## Mockup 4: Reservation Active

Purpose:

Make the temporary reservation visible and urgent.

Desktop layout:

- Persistent right panel while browsing inventory.
- Width around 360px.
- Does not cover product grid content.

Mobile layout:

- Sticky bottom sheet.
- Countdown and checkout CTA remain visible.
- Does not overlap text in the product card list.

Panel content:

- header: `Reservation active`
- countdown from `expiresAt`
- product thumbnail
- product name
- selected size, e.g. `EU 42`
- quantity
- price estimate
- reservation id shortened
- primary CTA: `Complete checkout`
- secondary CTA: `Cancel reservation`

Urgency:

- under 60 seconds, countdown becomes red/urgent.
- at 0 seconds, checkout disabled and expired failure state appears.

Prompt:

```txt
Create the Active Reservation screen state for DropLock. Show a persistent reservation panel on desktop and a sticky bottom sheet on mobile. Include countdown, product thumbnail, selected shoe size, quantity, price, reservation id, Complete Checkout CTA, and Cancel Reservation CTA. The selected size must be prominent because inventory is size-specific.
```

## Mockup 5: Checkout Desktop

Purpose:

Complete checkout for a valid active reservation.

Desktop layout:

- Two-column layout:
  - left: checkout details
  - right: sticky order summary
- Keep reservation timer visible in the right column.

Left column:

- product image
- product name
- colorway
- selected size
- reservation status
- shipping details mock fields
- payment method mock fields

Right column:

- `Reservation active`
- countdown
- subtotal
- shipping
- quantity
- total
- selected size
- primary CTA: `Complete checkout`
- secondary CTA: `Cancel reservation`

UX:

- This is a demo checkout, so payment fields can be prefilled/read-only.
- No real payment provider.
- Checkout button disabled when timer reaches zero.

Prompt:

```txt
Create the DropLock Checkout Desktop screen. Use a two-column transactional layout with product and mock shipping/payment details on the left and sticky order summary on the right. Show selected shoe size, countdown timer, total price, Complete Checkout button, and Cancel Reservation button. Keep it compact and focused on finishing checkout before expiry.
```

## Mockup 6: Checkout Mobile

Purpose:

Make checkout usable on a narrow screen during a time-limited reservation.

Mobile layout:

- Header with close/back.
- Product image and details.
- Selected size shown near the product title.
- Order summary list.
- Sticky bottom checkout sheet:
  - countdown bar
  - payment preview
  - total
  - complete checkout button
  - cancel reservation button

UX:

- Sticky sheet must not hide important content.
- Buttons must fit within width.
- Countdown remains visible at all times.

Prompt:

```txt
Create the DropLock Checkout Mobile screen. It should use a compact product summary and a sticky bottom sheet containing the countdown, total, Complete Checkout CTA, and Cancel Reservation CTA. The selected shoe size must be visible in both the product summary and checkout sheet. Ensure no text or buttons overflow.
```

## Mockup 7: Checkout Success

Purpose:

Confirm that checkout created an order.

Layout:

- Focused success view, modal, or full section.
- Not a generic receipt.
- Should feel like the pair has been locked.

Content:

- success badge: `Order confirmed`
- headline: `Your pair is locked`
- order number
- product thumbnail
- product name
- selected shoe size
- quantity
- total price
- reservation status: `completed`
- order status: `confirmed`
- CTA: `Back to inventory`
- secondary: `View orders`

Prompt:

```txt
Create the DropLock Checkout Success screen. Confirm that the user's pair is locked. Show order number, product thumbnail, product name, selected shoe size, quantity, total price, reservation status completed, and order status confirmed. Provide Back to Inventory and View Orders actions.
```

## Mockup 8: Failure - Sold Out / Size Unavailable

Purpose:

Handle race condition failure cleanly.

Trigger:

- `POST /reservations` returns `409`.
- Another user reserved the last pair in the selected size.

Content:

- title: `Size sold out`
- message: `This size was reserved by another buyer before your request completed.`
- show product name and selected size
- CTA: `Choose another size`
- secondary: `Refresh inventory`

Behavior:

- Refresh product data.
- Disable the sold-out size chip.
- Keep product detail context visible.

Prompt:

```txt
Create the DropLock Size Sold Out failure state. This state appears when the selected shoe size is no longer available because another user reserved it first. Show product context, selected size, clear error message, Choose Another Size CTA, and Refresh Inventory secondary action.
```

## Mockup 9: Failure - Reservation Expired

Purpose:

Handle checkout after the reservation timer expires.

Trigger:

- countdown reaches zero
- checkout returns `410`

Content:

- title: `Reservation expired`
- message: `Your hold ended and the pair returned to inventory.`
- product name
- selected size
- CTA: `Try again`
- secondary: `Back to inventory`

Behavior:

- Clear active reservation.
- Refresh inventory.
- Disable checkout.

Prompt:

```txt
Create the DropLock Reservation Expired screen. Show that the timer ended, the selected size returned to inventory, and checkout is no longer available. Include product name, selected shoe size, Try Again CTA, and Back to Inventory secondary action.
```

## Mockup 10: Loading / Empty / Network Error

Purpose:

Make non-happy paths predictable.

States:

- inventory loading skeleton
- product detail loading skeleton
- checkout processing state
- empty inventory
- network error

Rules:

- No browser alerts.
- Use in-app banners or compact empty states.
- Retry action must be visible.
- Checkout loading keeps countdown visible.

Prompt:

```txt
Create DropLock loading, empty, and network error states. Include inventory skeleton cards, empty inventory state, checkout processing state with countdown still visible, and network error with Retry CTA. Keep layout stable so content does not jump.
```

## Mockup 11: Orders History

Purpose:

Demo/admin proof that checkout creates orders.

Layout:

- Compact list or side drawer.
- Latest orders first.

Order row:

- order number
- product name
- selected shoe size
- quantity
- total price
- status
- created date

Prompt:

```txt
Create the DropLock Orders History screen. Show a compact list of confirmed orders with order number, product name, selected shoe size, quantity, total price, status, and date. This screen is secondary and should not distract from the main reservation flow.
```

## Final Combined Stitch Prompt

```txt
Create complete mockups for a React + TypeScript app called DropLock.

DropLock is a limited sneaker drop reservation app. The backend API is http://localhost:3100/api.

Do not create a marketing landing page. Do not use generative illustrations or decorative generated assets. Use product images from the API or neutral image placeholders.

The crucial UX rule is that every product has size-specific inventory. Users must select an available shoe size before reservation. Sold-out sizes must be disabled. Race-condition failures should explain that the selected size sold out.

Create these screens:
1. Live Drop / Entry
2. Full Inventory
3. Product Detail + Size Selection
4. Reservation Active
5. Checkout Desktop
6. Checkout Mobile
7. Checkout Success
8. Failure: Sold Out / Size Unavailable
9. Failure: Reservation Expired
10. Loading / Empty / Network Error
11. Orders History

Use a premium sneaker-release UI: compact, sharp, black and near-white, thin borders, strong product imagery, high contrast CTAs, clear status badges, responsive layout, no nested cards, no oversized hero-only page, no generic SaaS dashboard styling.

Design against these API fields: Product has sizes: ProductSize[]. Reservation and Order both contain shoeSize. Reservation request requires numeric productId, shoeSize, quantity 1, and optional customerEmail.
```
