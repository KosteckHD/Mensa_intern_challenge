import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError, droplockApi } from '../api/droplockApi';
import { calculateStats, readStoredReservation } from '../lib/format';
import {
  CheckoutResponse,
  CheckoutInput,
  FailureKind,
  Product,
  Reservation,
  ReservationAttempt,
  Stats,
} from '../types/api';

const reservationStorageKey = 'droplock-active-reservation';

type DropContextValue = {
  products: Product[];
  stats: Stats;
  reservation: Reservation | null;
  activeProduct: Product | null;
  lastAttempt: ReservationAttempt;
  failure: FailureKind | null;
  loadingProducts: boolean;
  secondsLeft: number;
  refreshProducts: () => Promise<void>;
  reserve: (product: Product, shoeSize: string, email: string) => Promise<Reservation>;
  checkout: (input: CheckoutInput) => Promise<CheckoutResponse>;
  cancel: () => Promise<void>;
  ensureReservation: (id: number) => Promise<Reservation | null>;
  clearFailure: () => void;
};

const DropContext = createContext<DropContextValue | null>(null);

export function DropProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(() =>
    readStoredReservation(reservationStorageKey),
  );
  const [lastAttempt, setLastAttempt] = useState<ReservationAttempt>({
    product: null,
    shoeSize: '',
  });
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [tick, setTick] = useState(Date.now());

  const loadProducts = useCallback(async (preserveFailure: boolean) => {
    setLoadingProducts(true);
    try {
      setProducts(await droplockApi.listProducts());
      if (!preserveFailure) setFailure(null);
    } catch {
      if (!preserveFailure) setFailure('network');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const refreshProducts = useCallback(
    () => loadProducts(false),
    [loadProducts],
  );

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (reservation) {
      localStorage.setItem(reservationStorageKey, JSON.stringify(reservation));
    } else {
      localStorage.removeItem(reservationStorageKey);
    }
  }, [reservation]);

  const activeProduct = useMemo(
    () =>
      reservation
        ? products.find((product) => product.id === reservation.productId) ?? null
        : null,
    [products, reservation],
  );

  const secondsLeft = reservation
    ? Math.max(
        0,
        Math.floor((new Date(reservation.expiresAt).getTime() - tick) / 1000),
      )
    : 0;

  useEffect(() => {
    if (reservation?.status === 'active' && secondsLeft === 0) {
      setLastAttempt({ product: activeProduct, shoeSize: reservation.shoeSize });
      setReservation(null);
      setFailure('expired');
      void loadProducts(true);
    }
  }, [activeProduct, loadProducts, reservation, secondsLeft]);

  async function reserve(product: Product, shoeSize: string, email: string) {
    setLastAttempt({ product, shoeSize });

    try {
      const created = await droplockApi.createReservation({
        productId: product.id,
        customerEmail: email || undefined,
        quantity: 1,
        shoeSize,
      });

      const nextReservation = { ...created, shoeSize };
      setReservation(nextReservation);
      setFailure(null);
      void refreshProducts();
      return nextReservation;
    } catch (error) {
      setFailure(
        error instanceof ApiError && error.status === 409 ? 'sold-out' : 'network',
      );
      void loadProducts(true);
      throw error;
    }
  }

  async function checkout(input: CheckoutInput) {
    if (!reservation) throw new Error('No active reservation');
    setLastAttempt({ product: activeProduct, shoeSize: reservation.shoeSize });
    try {
      const result = await droplockApi.checkoutReservation(
        reservation.id,
        input,
      );
      setReservation(null);
      setFailure(null);
      void refreshProducts();
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) {
        setReservation(null);
        setFailure('expired');
      } else if (error instanceof ApiError && error.status === 409) {
        setFailure('checkout-conflict');
      } else {
        setFailure('network');
      }
      void loadProducts(true);
      throw error;
    }
  }

  async function cancel() {
    if (!reservation) return;
    setLastAttempt({ product: activeProduct, shoeSize: reservation.shoeSize });
    try {
      await droplockApi.cancelReservation(reservation.id);
      setReservation(null);
      setFailure(null);
      void refreshProducts();
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) {
        setReservation(null);
        setFailure('expired');
      } else {
        setFailure('network');
      }
      throw error;
    }
  }

  const ensureReservation = useCallback(
    async (id: number) => {
      if (reservation?.id === id) return reservation;
      try {
        const restored = await droplockApi.getReservation(id);
        if (restored.status !== 'active') return null;
        setReservation(restored);
        return restored;
      } catch (error) {
        setFailure(
          error instanceof ApiError && error.status === 410
            ? 'expired'
            : 'network',
        );
        return null;
      }
    },
    [reservation],
  );

  const value: DropContextValue = {
    products,
    stats: calculateStats(products),
    reservation,
    activeProduct,
    lastAttempt,
    failure,
    loadingProducts,
    secondsLeft,
    refreshProducts,
    reserve,
    checkout,
    cancel,
    ensureReservation,
    clearFailure: () => setFailure(null),
  };

  return <DropContext.Provider value={value}>{children}</DropContext.Provider>;
}

export function useDrop(): DropContextValue {
  const context = useContext(DropContext);
  if (!context) throw new Error('useDrop must be used within DropProvider');
  return context;
}
