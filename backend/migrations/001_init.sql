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

CREATE TABLE IF NOT EXISTS reservations (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  customer_email text,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  CHECK (quantity > 0),
  CHECK (status IN ('active', 'completed', 'expired', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS products_archived_at_idx
  ON products (archived_at);

CREATE INDEX IF NOT EXISTS reservations_product_id_idx
  ON reservations (product_id);

CREATE INDEX IF NOT EXISTS reservations_active_expiry_idx
  ON reservations (expires_at)
  WHERE status = 'active';
