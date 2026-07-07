import { Order } from '../orders/order.types';

export type ReservationStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface ReservationRow {
  id: string;
  product_id: string;
  customer_email: string | null;
  quantity: number;
  status: ReservationStatus;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  cancelled_at: Date | null;
  is_expired?: boolean;
}

export interface Reservation {
  id: string;
  productId: string;
  customerEmail: string | null;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export function mapReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    productId: row.product_id,
    customerEmail: row.customer_email,
    quantity: row.quantity,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  };
}

export interface CheckoutResult {
  reservation: Reservation;
  order: Order;
}
