export type OrderStatus = 'confirmed' | 'cancelled' | 'refunded';

export interface OrderRow {
  id: number;
  order_number: string;
  reservation_id: number;
  product_id: number;
  customer_email: string | null;
  quantity: number;
  shoe_size: string;
  unit_price_cents: number;
  shipping_cents: number;
  total_price_cents: number;
  first_name: string | null;
  last_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  payment_reference: string | null;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  orderNumber: string;
  reservationId: number;
  productId: number;
  customerEmail: string | null;
  quantity: number;
  shoeSize: string;
  unitPriceCents: number;
  shippingCents: number;
  totalPriceCents: number;
  firstName: string | null;
  lastName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  paymentReference: string | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    reservationId: row.reservation_id,
    productId: row.product_id,
    customerEmail: row.customer_email,
    quantity: row.quantity,
    shoeSize: row.shoe_size,
    unitPriceCents: row.unit_price_cents,
    shippingCents: row.shipping_cents,
    totalPriceCents: row.total_price_cents,
    firstName: row.first_name,
    lastName: row.last_name,
    shippingAddress: row.shipping_address,
    shippingCity: row.shipping_city,
    shippingPostalCode: row.shipping_postal_code,
    paymentReference: row.payment_reference,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
