export type ProductSize = {
  id: number;
  productId: number;
  sizeCode: string;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  sku: string;
  slug: string;
  brand: string;
  model: string;
  name: string;
  colorway: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  releaseAt: string | null;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  sizes: ProductSize[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type Reservation = {
  id: number;
  productId: number;
  customerEmail: string | null;
  quantity: number;
  shoeSize: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type Order = {
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
  status: 'confirmed' | 'cancelled' | 'refunded';
  createdAt: string;
  updatedAt: string;
};

export type CheckoutResponse = {
  reservation: Reservation;
  order: Order;
};

export type CheckoutInput = {
  firstName: string;
  lastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentReference: string;
};

export type FailureKind = 'sold-out' | 'expired' | 'checkout-conflict' | 'network';

export type Stats = {
  products: number;
  available: number;
  reserved: number;
  sold: number;
  total: number;
};

export type ReservationAttempt = {
  product: Product | null;
  shoeSize: string;
};
