import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const apiBaseUrl = 'http://127.0.0.1:3101/api';

test('completes a real React to NestJS to PostgreSQL checkout', async ({
  page,
  request,
}) => {
  await page.goto(
    '/products/b89e12d5-e2c6-4100-a52c-e806f9a6b919',
  );
  await expect(page).toHaveURL(/\/products\/3$/);
  await expect(
    page.getByRole('heading', { name: 'Nike Air Max 1 Limited Blue' }),
  ).toBeVisible();

  const suffix = randomUUID();
  const productName = `Browser Drop ${suffix.slice(0, 8)}`;
  const createdResponse = await request.post(`${apiBaseUrl}/products`, {
    data: {
      sku: `BROWSER-E2E-${suffix}`,
      brand: 'Nike',
      model: 'Dunk Low',
      name: productName,
      colorway: 'Black/White',
      priceCents: 54900,
      imageUrl:
        'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
      sizes: [
        { sizeCode: 'EU 42', stockTotal: 1 },
        { sizeCode: 'EU 43', stockTotal: 2 },
      ],
    },
  });
  expect(createdResponse.ok()).toBeTruthy();
  const product = (await createdResponse.json()) as { id: number };

  await page.goto('/products');
  await page
    .getByRole('button', { name: `View details for ${productName}` })
    .click();
  await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
  await expect(
    page.getByRole('heading', { name: productName }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^42/ }).click();
  await page
    .getByRole('textbox', { name: 'Reservation email' })
    .fill('full-stack@example.com');
  await page.getByRole('button', { name: /Reserve now/ }).click();

  await expect(page).toHaveURL(/\/checkout\/\d+$/);

  await page.getByLabel('First name').fill('Ada');
  await page.getByLabel('Last name').fill('Lovelace');
  await page.getByLabel('Address').fill('1 Drop Street');
  await page.getByLabel('City').fill('Warsaw');
  await page.getByLabel('Postal code').fill('00-001');
  await page.getByLabel('Card number').fill('4242424242424242');
  await page.getByLabel('Expiry').fill('12/30');
  await page.getByLabel('CVC').fill('123');
  await page.getByRole('button', { name: /Complete checkout/ }).click();

  await expect(page).toHaveURL(/\/checkout\/success\/\d+$/);
  await expect(
    page.getByRole('heading', { name: 'Pair secured.' }),
  ).toBeVisible();
  await expect(page.getByText('$584')).toBeVisible();

  const refreshed = await request.get(`${apiBaseUrl}/products/${product.id}`);
  const inventory = (await refreshed.json()) as {
    stockAvailable: number;
    stockSold: number;
    sizes: Array<{
      sizeCode: string;
      stockAvailable: number;
      stockSold: number;
    }>;
  };
  const selectedSize = inventory.sizes.find(
    (size) => size.sizeCode === 'EU 42',
  );

  expect(inventory.stockAvailable).toBe(2);
  expect(inventory.stockSold).toBe(1);
  expect(selectedSize?.stockAvailable).toBe(0);
  expect(selectedSize?.stockSold).toBe(1);

  const cleanup = await request.delete(`${apiBaseUrl}/products/${product.id}`);
  expect(cleanup.ok()).toBeTruthy();
});
