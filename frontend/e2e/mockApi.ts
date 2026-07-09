import { expect, Page, Route } from '@playwright/test';

const pixel =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export const product = {
  id: 1,
  sku: 'NK-DRNK-OW-99',
  slug: 'off-white-dunk-low',
  brand: 'Nike x Off-White',
  model: 'Dunk Low',
  name: 'Off-White x Dunk Low',
  colorway: 'Lot 50 / Black Silver',
  description: 'A limited collaborative sneaker release.',
  priceCents: 120000,
  imageUrl: pixel,
  releaseAt: '2026-07-09T10:00:00.000Z',
  stockTotal: 10,
  stockAvailable: 5,
  stockReserved: 1,
  stockSold: 4,
  sizes: [
    size(11, 'EU 41', 0),
    size(12, 'EU 42', 3),
    size(13, 'EU 43', 2),
  ],
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-09T10:00:00.000Z',
  archivedAt: null,
};

export const reservation = {
  id: 101,
  productId: 1,
  customerEmail: 'buyer@example.com',
  quantity: 1,
  shoeSize: 'EU 42',
  status: 'active',
  expiresAt: '2099-07-09T10:05:00.000Z',
  createdAt: '2026-07-09T10:00:00.000Z',
  updatedAt: '2026-07-09T10:00:00.000Z',
  completedAt: null,
  cancelledAt: null,
};

export const order = {
  id: 501,
  orderNumber: 'DL-20260709-0501',
  reservationId: 101,
  productId: 1,
  customerEmail: 'buyer@example.com',
  quantity: 1,
  shoeSize: 'EU 42',
  unitPriceCents: 120000,
  shippingCents: 3500,
  totalPriceCents: 123500,
  firstName: 'Ada',
  lastName: 'Lovelace',
  shippingAddress: '1 Drop Street',
  shippingCity: 'Warsaw',
  shippingPostalCode: '00-001',
  paymentReference: 'demo-card-4242',
  status: 'confirmed',
  createdAt: '2026-07-09T10:01:00.000Z',
  updatedAt: '2026-07-09T10:01:00.000Z',
};

type MockOptions = {
  products?: typeof product[];
  holdProducts?: boolean;
  productDetailStatus?: number;
  reservationStatus?: number;
  checkoutStatus?: number;
};

export type ApiCapture = {
  reservationBody: Record<string, unknown> | null;
  releaseProducts: () => void;
};

export async function installApiMock(
  page: Page,
  options: MockOptions = {},
): Promise<ApiCapture> {
  let releaseProducts = () => {};
  const productsGate = options.holdProducts
    ? new Promise<void>((resolve) => {
        releaseProducts = resolve;
      })
    : null;
  const capture: ApiCapture = {
    reservationBody: null,
    releaseProducts: () => releaseProducts(),
  };
  const products = options.products ?? [product];

  await page.route('http://localhost:3100/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === 'GET' && path === '/api/products') {
      if (productsGate) await productsGate;
      await json(route, 200, products);
      return;
    }

    if (method === 'GET' && path === '/api/products/1') {
      if (options.productDetailStatus && options.productDetailStatus !== 200) {
        await json(route, options.productDetailStatus, {
          statusCode: options.productDetailStatus,
          message: 'Product lookup failed',
        });
        return;
      }
      await json(route, 200, product);
      return;
    }

    if (method === 'POST' && path === '/api/reservations') {
      capture.reservationBody = request.postDataJSON() as Record<string, unknown>;
      if (options.reservationStatus && options.reservationStatus !== 201) {
        await json(route, options.reservationStatus, {
          statusCode: options.reservationStatus,
          message: 'Selected size is no longer available',
        });
        return;
      }
      await json(route, 201, reservation);
      return;
    }

    if (method === 'GET' && path === '/api/reservations/101') {
      await json(route, 200, reservation);
      return;
    }

    if (method === 'POST' && path === '/api/reservations/101/checkout') {
      if (options.checkoutStatus && options.checkoutStatus !== 201) {
        await json(route, options.checkoutStatus, {
          statusCode: options.checkoutStatus,
          message: 'Reservation has expired',
        });
        return;
      }
      await json(route, 201, {
        reservation: {
          ...reservation,
          status: 'completed',
          completedAt: '2026-07-09T10:01:00.000Z',
        },
        order,
      });
      return;
    }

    if (method === 'POST' && path === '/api/reservations/101/cancel') {
      await json(route, 201, {
        ...reservation,
        status: 'cancelled',
        cancelledAt: '2026-07-09T10:01:00.000Z',
      });
      return;
    }

    if (method === 'GET' && path === '/api/orders/501') {
      await json(route, 200, order);
      return;
    }

    await json(route, 404, { statusCode: 404, message: 'Not found' });
  });

  return capture;
}

export async function expectReservationPayload(
  capture: ApiCapture,
): Promise<void> {
  await expect
    .poll(() => capture.reservationBody)
    .toEqual({
      productId: 1,
      customerEmail: 'buyer@example.com',
      quantity: 1,
      shoeSize: 'EU 42',
    });
}

function size(id: number, sizeCode: string, stockAvailable: number) {
  return {
    id,
    productId: 1,
    sizeCode,
    stockTotal: stockAvailable,
    stockAvailable,
    stockReserved: 0,
    stockSold: 0,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-09T10:00:00.000Z',
  };
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}
