export const FOOTWEAR_SIZES = [
  'EU 40',
  'EU 41',
  'EU 42',
  'EU 43',
  'EU 44',
  'EU 45',
  'EU 46',
] as const;

export type FootwearSize = (typeof FOOTWEAR_SIZES)[number];

export const DEFAULT_FOOTWEAR_SIZE: FootwearSize = 'EU 42';

export function isFootwearSize(value: string): value is FootwearSize {
  return FOOTWEAR_SIZES.includes(value as FootwearSize);
}
