export interface CreateProductBody {
  sku?: unknown;
  brand?: unknown;
  model?: unknown;
  name?: unknown;
  colorway?: unknown;
  description?: unknown;
  priceCents?: unknown;
  imageUrl?: unknown;
  releaseAt?: unknown;
  stockTotal?: unknown;
  sizes?: unknown;
}

export interface UpdateProductBody {
  sku?: unknown;
  brand?: unknown;
  model?: unknown;
  name?: unknown;
  colorway?: unknown;
  description?: unknown;
  priceCents?: unknown;
  imageUrl?: unknown;
  releaseAt?: unknown;
}

export interface CreateProductSizeBody {
  sizeCode?: unknown;
  stockTotal?: unknown;
}

export interface UpdateProductSizeBody {
  stockTotal?: unknown;
}
