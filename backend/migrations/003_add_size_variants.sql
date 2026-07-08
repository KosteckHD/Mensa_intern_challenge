CREATE TABLE IF NOT EXISTS product_sizes (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_code text NOT NULL,
  stock_total integer NOT NULL,
  stock_available integer NOT NULL,
  stock_reserved integer NOT NULL DEFAULT 0,
  stock_sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (stock_total >= 0),
  CHECK (stock_available >= 0),
  CHECK (stock_reserved >= 0),
  CHECK (stock_sold >= 0),
  CHECK (stock_available + stock_reserved + stock_sold = stock_total),
  UNIQUE (product_id, size_code)
);

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS shoe_size text NOT NULL DEFAULT 'EU 42';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shoe_size text NOT NULL DEFAULT 'EU 42';

INSERT INTO product_sizes (
  product_id,
  size_code,
  stock_total,
  stock_available,
  stock_reserved,
  stock_sold
)
SELECT
  p.id,
  'EU 42',
  p.stock_total,
  p.stock_available,
  p.stock_reserved,
  p.stock_sold
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM product_sizes ps
  WHERE ps.product_id = p.id
);

CREATE INDEX IF NOT EXISTS product_sizes_product_id_idx
  ON product_sizes (product_id);

CREATE INDEX IF NOT EXISTS product_sizes_product_size_idx
  ON product_sizes (product_id, size_code);

CREATE INDEX IF NOT EXISTS reservations_product_size_idx
  ON reservations (product_id, shoe_size);

CREATE INDEX IF NOT EXISTS orders_product_size_idx
  ON orders (product_id, shoe_size);
