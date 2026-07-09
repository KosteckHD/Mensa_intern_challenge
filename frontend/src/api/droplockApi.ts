import {
  CheckoutInput,
  CheckoutResponse,
  Order,
  Product,
  Reservation,
} from '../types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100/api';
const REQUEST_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Request timed out. Make sure the DropLock backend is running and reachable.'
        : 'Unable to reach the DropLock backend. Make sure the server is running on the configured API URL.';

    throw new ApiError(0, message);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = response.statusText;

    try {
      const errorBody = await response.json();

      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(', ');
      } else if (typeof errorBody.message === 'string') {
        message = errorBody.message;
      } else {
        message = JSON.stringify(errorBody);
      }
    } catch {
      message = await response.text();
    }

    throw new ApiError(response.status, message);
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
      body: JSON.stringify({
        ...input,
        productId: Number(input.productId),
        quantity: Number(input.quantity),
        shoeSize: input.shoeSize,
      }),
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
