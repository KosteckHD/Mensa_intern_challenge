export interface ProductRow {
  id: number;
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

export interface ProductSizeRow {
  id: number;
  product_id: number;
  size_code: string;
  stock_total: number;
  stock_available: number;
  stock_reserved: number;
  stock_sold: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductSize {
  id: number;
  productId: number;
  sizeCode: string;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithSizesRow extends ProductRow {
  sizes: ProductSizeRow[];
}

export interface Product {
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
  releaseAt: Date | null;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  sizes: ProductSize[];
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export function mapProduct(row: ProductWithSizesRow): Product {
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
    sizes: row.sizes.map(mapProductSize),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export function mapProductSize(row: ProductSizeRow): ProductSize {
  return {
    id: row.id,
    productId: row.product_id,
    sizeCode: row.size_code,
    stockTotal: row.stock_total,
    stockAvailable: row.stock_available,
    stockReserved: row.stock_reserved,
    stockSold: row.stock_sold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
