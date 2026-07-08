import { Product, Reservation, Stats } from '../types/api';

export const fallbackShoeSize = 'EU 42';

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainder
    .toString()
    .padStart(2, '0')}`;
}

export function getDefaultSize(product: Product): string {
  return (
    product.sizes.find((size) => size.stockAvailable > 0)?.sizeCode ??
    product.sizes[0]?.sizeCode ??
    ''
  );
}

export function selectedSizeStock(product: Product, shoeSize: string): number {
  return product.sizes.find((size) => size.sizeCode === shoeSize)?.stockAvailable ?? 0;
}

export function calculateStats(products: Product[]): Stats {
  return products.reduce(
    (result, product) => ({
      products: result.products + 1,
      available: result.available + product.stockAvailable,
      reserved: result.reserved + product.stockReserved,
      sold: result.sold + product.stockSold,
      total: result.total + product.stockTotal,
    }),
    { products: 0, available: 0, reserved: 0, sold: 0, total: 0 },
  );
}

export function readStoredReservation(storageKey: string): Reservation | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Reservation>;
    if (!parsed.id || !parsed.productId) return null;
    return {
      ...(parsed as Reservation),
      shoeSize: parsed.shoeSize ?? fallbackShoeSize,
    };
  } catch {
    return null;
  }
}
