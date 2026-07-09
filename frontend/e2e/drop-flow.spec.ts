import { expect, test } from '@playwright/test';
import {
  expectReservationPayload,
  installApiMock,
  order,
  reservation,
} from './mockApi';

test.describe('DropLock customer journey', () => {
  test('reserves a selected size and completes checkout', async ({ page }) => {
    const capture = await installApiMock(page);

    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    await page
      .getByRole('button', { name: 'Open Off-White x Dunk Low' })
      .click();

    await expect(page).toHaveURL(/\/products\/1$/);
    await page.getByRole('button', { name: /^42/ }).click();
    await page
      .getByRole('textbox', { name: 'Reservation email' })
      .fill('buyer@example.com');
    await page.getByRole('button', { name: /Reserve now/ }).click();

    await expectReservationPayload(capture);
    await expect(page).toHaveURL(/\/checkout\/101$/);
    await expect(
      page.getByRole('heading', { name: 'Off-White x Dunk Low' }),
    ).toBeVisible();

    await fillCheckout(page);
    await page.getByRole('button', { name: /Complete checkout/ }).click();

    await expect(page).toHaveURL(/\/checkout\/success\/501$/);
    await expect(
      page.getByRole('heading', { name: 'Pair secured.' }),
    ).toBeVisible();
    await expect(page.getByText(order.orderNumber)).toBeVisible();
    await expect(page.getByText('#501')).toBeVisible();
  });

  test('shows sold-out recovery after reservation conflict', async ({ page }) => {
    await installApiMock(page, { reservationStatus: 409 });

    await page.goto('/products/1');
    await page.getByRole('button', { name: /^42/ }).click();
    await page.getByRole('button', { name: /Reserve now/ }).click();

    await expect(page).toHaveURL(/\/errors\/sold-out$/);
    await expect(
      page.getByRole('heading', { name: 'Size sold out' }),
    ).toBeVisible();
    await expect(page.getByText('42', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /Choose another size/ }).click();
    await expect(page).toHaveURL(/\/products\/1$/);
  });

  test('loads a product directly when it is absent from the catalog response', async ({
    page,
  }) => {
    await installApiMock(page, { products: [] });

    await page.goto('/products/1');

    await expect(
      page.getByRole('heading', { name: 'Off-White x Dunk Low' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No active drops' }),
    ).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^42/ })).toBeEnabled();
    await expect(page.getByRole('button', { name: /Reserve now/ })).toBeEnabled();
  });

  test('keeps the clicked product visible when its refresh request fails', async ({
    page,
  }) => {
    await installApiMock(page, { productDetailStatus: 503 });

    await page.goto('/products');
    await page
      .getByRole('button', { name: 'View details for Off-White x Dunk Low' })
      .click();

    await expect(page).toHaveURL(/\/products\/1$/);
    await expect(
      page.getByRole('heading', { name: 'Off-White x Dunk Low' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'This product could not be found.' }),
    ).not.toBeVisible();
  });

  test('shows reservation-expired recovery when checkout returns 410', async ({
    page,
  }) => {
    await installApiMock(page, { checkoutStatus: 410 });
    await page.addInitScript((storedReservation) => {
      localStorage.setItem(
        'droplock-active-reservation',
        JSON.stringify(storedReservation),
      );
    }, reservation);

    await page.goto('/checkout/101');
    await fillCheckout(page);
    await page.getByRole('button', { name: /Complete checkout/ }).click();

    await expect(page).toHaveURL(/\/errors\/reservation-expired$/);
    await expect(
      page.getByRole('heading', { name: 'Reservation expired' }),
    ).toBeVisible();
    await expect(page.getByText(/pair returned to inventory/i)).toBeVisible();
  });

  test('renders the empty products state', async ({ page }) => {
    await installApiMock(page, { products: [] });

    await page.goto('/products');

    await expect(
      page.getByRole('heading', { name: 'No active drops' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Refresh scope/ }),
    ).toBeVisible();
  });

  test('renders loading state while products request is pending', async ({
    page,
  }) => {
    const capture = await installApiMock(page, { holdProducts: true });

    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Syncing products' }),
    ).toBeVisible();
    capture.releaseProducts();
    await expect(
      page.getByRole('heading', { name: 'Off-White x Dunk Low' }),
    ).toBeVisible();
  });
});

async function fillCheckout(page: import('@playwright/test').Page) {
  await page.getByLabel('First name').fill('Ada');
  await page.getByLabel('Last name').fill('Lovelace');
  await page.getByLabel('Address').fill('1 Drop Street');
  await page.getByLabel('City').fill('Warsaw');
  await page.getByLabel('Postal code').fill('00-001');
  await page.getByLabel('Card number').fill('4242424242424242');
  await page.getByLabel('Expiry').fill('12/30');
  await page.getByLabel('CVC').fill('123');
}
