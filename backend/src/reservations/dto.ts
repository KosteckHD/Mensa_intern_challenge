import { ReservationStatus } from './reservation.types';

export interface CreateReservationBody {
  productId?: unknown;
  customerEmail?: unknown;
  quantity?: unknown;
  shoeSize?: unknown;
}

export interface CheckoutReservationBody {
  firstName?: unknown;
  lastName?: unknown;
  shippingAddress?: unknown;
  shippingCity?: unknown;
  shippingPostalCode?: unknown;
  paymentReference?: unknown;
}

export interface ListReservationsQuery {
  productId?: string;
  status?: ReservationStatus;
}
