const legacyProductSkuById: Record<string, string> = {
  '77afc0ec-d7b2-43ca-b755-efe007292c44': 'NIKE-AJ1-LOST-FOUND',
  'e367e00d-dd7b-40c2-b623-bafb5e7b4761': 'NIKE-DUNK-PANDA-LOW',
  'b89e12d5-e2c6-4100-a52c-e806f9a6b919':
    'NIKE-AM1-UNIVERSITY-BLUE',
};

export function legacyProductSku(productId: string | undefined): string | null {
  if (!productId) return null;
  return legacyProductSkuById[productId.toLowerCase()] ?? null;
}
