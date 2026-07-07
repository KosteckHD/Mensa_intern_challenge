import { ReservationStatus } from './reservation.types';

export interface CreateReservationBody {
  productId?: unknown;
  customerEmail?: unknown;
  quantity?: unknown;
}

export interface ListReservationsQuery {
  productId?: string;
  status?: ReservationStatus;
}
