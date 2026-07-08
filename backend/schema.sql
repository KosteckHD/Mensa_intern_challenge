CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  brand text NOT NULL,
  model text NOT NULL,
  name text NOT NULL,
  colorway text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  image_url text,
  release_at timestamptz,
  stock_total integer NOT NULL,
  stock_available integer NOT NULL,
  stock_reserved integer NOT NULL DEFAULT 0,
  stock_sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CHECK (price_cents >= 0),
  CHECK (stock_total >= 0),
  CHECK (stock_available >= 0),
  CHECK (stock_reserved >= 0),
  CHECK (stock_sold >= 0),
  CHECK (stock_available + stock_reserved + stock_sold = stock_total)
);

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

CREATE TABLE IF NOT EXISTS reservations (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  customer_email text,
  quantity integer NOT NULL DEFAULT 1,
  shoe_size text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  CHECK (quantity > 0),
  CHECK (status IN ('active', 'completed', 'expired', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  reservation_id integer NOT NULL UNIQUE REFERENCES reservations(id),
  product_id integer NOT NULL REFERENCES products(id),
  customer_email text,
  quantity integer NOT NULL,
  shoe_size text NOT NULL,
  unit_price_cents integer NOT NULL,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_price_cents integer NOT NULL,
  first_name text,
  last_name text,
  shipping_address text,
  shipping_city text,
  shipping_postal_code text,
  payment_reference text,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity > 0),
  CHECK (unit_price_cents >= 0),
  CHECK (shipping_cents >= 0),
  CHECK (
    total_price_cents =
      quantity * unit_price_cents + shipping_cents
  ),
  CHECK (status IN ('confirmed', 'cancelled', 'refunded'))
);

CREATE INDEX IF NOT EXISTS products_archived_at_idx
  ON products (archived_at);

CREATE INDEX IF NOT EXISTS product_sizes_product_id_idx
  ON product_sizes (product_id);

CREATE INDEX IF NOT EXISTS product_sizes_product_size_idx
  ON product_sizes (product_id, size_code);

CREATE INDEX IF NOT EXISTS reservations_product_id_idx
  ON reservations (product_id);

CREATE INDEX IF NOT EXISTS reservations_product_size_idx
  ON reservations (product_id, shoe_size);

CREATE INDEX IF NOT EXISTS reservations_active_expiry_idx
  ON reservations (expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS orders_product_id_idx
  ON orders (product_id);

CREATE INDEX IF NOT EXISTS orders_product_size_idx
  ON orders (product_id, shoe_size);

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON orders (created_at DESC);
