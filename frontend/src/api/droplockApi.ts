import {
  CheckoutInput,
  CheckoutResponse,
  Order,
  Product,
  Reservation,
} from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return response.json() as Promise<T>;
}

export const droplockApi = {
  listProducts: () => request<Product[]>('/products'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  getReservation: (id: number) => request<Reservation>(`/reservations/${id}`),
  createReservation: (input: {
    productId: number;
    customerEmail?: string;
    quantity: number;
    shoeSize: string;
  }) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  checkoutReservation: (id: number, input: CheckoutInput) =>
    request<CheckoutResponse>(`/reservations/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  cancelReservation: (id: number) =>
    request<Reservation>(`/reservations/${id}/cancel`, {
      method: 'POST',
    }),
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
};
