import { OrderStatus } from './order.types';

export interface ListOrdersQuery {
  productId?: string;
  reservationId?: string;
  status?: OrderStatus;
}
