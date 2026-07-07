CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  customer_email text,
  quantity integer NOT NULL,
  unit_price_cents integer NOT NULL,
  total_price_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity > 0),
  CHECK (unit_price_cents >= 0),
  CHECK (total_price_cents = quantity * unit_price_cents),
  CHECK (status IN ('confirmed', 'cancelled', 'refunded'))
);

CREATE INDEX IF NOT EXISTS orders_product_id_idx
  ON orders (product_id);

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON orders (created_at DESC);
