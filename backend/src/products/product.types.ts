export interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  brand: string;
  model: string;
  name: string;
  colorway: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  release_at: Date | null;
  stock_total: number;
  stock_available: number;
  stock_reserved: number;
  stock_sold: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface Product {
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
  releaseAt: Date | null;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    name: row.name,
    colorway: row.colorway,
    description: row.description,
    priceCents: row.price_cents,
    imageUrl: row.image_url,
    releaseAt: row.release_at,
    stockTotal: row.stock_total,
    stockAvailable: row.stock_available,
    stockReserved: row.stock_reserved,
    stockSold: row.stock_sold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}
