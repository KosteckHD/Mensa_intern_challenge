ALTER TABLE orders
  ADD COLUMN shipping_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN shipping_address text,
  ADD COLUMN shipping_city text,
  ADD COLUMN shipping_postal_code text,
  ADD COLUMN payment_reference text;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_check,
  DROP CONSTRAINT IF EXISTS orders_total_price_cents_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_total_price_cents_check
  CHECK (
    total_price_cents =
      quantity * unit_price_cents + shipping_cents
  );

ALTER TABLE orders
  ADD CONSTRAINT orders_shipping_cents_check
  CHECK (shipping_cents >= 0);
