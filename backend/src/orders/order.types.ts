export type OrderStatus = 'confirmed' | 'cancelled' | 'refunded';

export interface OrderRow {
  id: string;
  order_number: string;
  reservation_id: string;
  product_id: string;
  customer_email: string | null;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  reservationId: string;
  productId: string;
  customerEmail: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
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
    unitPriceCents: row.unit_price_cents,
    totalPriceCents: row.total_price_cents,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
