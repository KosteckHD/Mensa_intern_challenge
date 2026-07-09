import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { formatPrice, formatTime } from '../lib/format';
import { fallbackImages, imageFor } from '../lib/images';

export function CheckoutPage() {
  const { reservationId } = useParams();
  const {
    reservation,
    activeProduct,
    secondsLeft,
    ensureReservation,
    checkout,
    cancel,
  } = useDrop();
  const navigate = useNavigate();
  const [restoring, setRestoring] = useState(reservation?.id !== Number(reservationId));
  const [checkingOut, setCheckingOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const restorationAttempted = useRef(false);

  useEffect(() => {
    if (restorationAttempted.current) return;
    restorationAttempted.current = true;

    const id = Number(reservationId);
    if (!Number.isInteger(id) || id <= 0) {
      navigate('/products', { replace: true });
      return;
    }
    if (reservation?.id === id) {
      setRestoring(false);
      return;
    }
    void ensureReservation(id).then((restored) => {
      setRestoring(false);
      if (!restored) navigate('/products', { replace: true });
    });
  }, [ensureReservation, navigate, reservation?.id, reservationId]);

  if (restoring || !reservation) return <LoadingProducts />;

  const subtotal = activeProduct?.priceCents ?? 0;
  const shipping = 3500;
  const total = subtotal + shipping;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cardNumber = String(formData.get('cardNumber') ?? '').replace(/\s/g, '');
    setCheckingOut(true);
    try {
      const result = await checkout({
        firstName: String(formData.get('firstName') ?? ''),
        lastName: String(formData.get('lastName') ?? ''),
        shippingAddress: String(formData.get('shippingAddress') ?? ''),
        shippingCity: String(formData.get('shippingCity') ?? ''),
        shippingPostalCode: String(formData.get('shippingPostalCode') ?? ''),
        paymentReference: `demo-card-${cardNumber.slice(-4)}`,
      });
      navigate(`/checkout/success/${result.order.id}`, {
        replace: true,
        state: { result },
      });
    } catch {
      // Error routing is handled centrally by the context and layout.
    } finally {
      setCheckingOut(false);
    }
  }

  async function cancelReservation() {
    setCancelling(true);
    try {
      await cancel();
      navigate('/products');
    } catch {
      // Error routing is handled centrally by the context and layout.
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="checkout-page">
      <div className="checkout-title">
        <p className="kicker">Encrypted session / #{reservation.id}</p>
        <h1>Secure checkout</h1>
      </div>
      <form className="checkout-form" id="checkout-form" onSubmit={submit}>
        <section>
          <div className="form-section-title">
            <span>01</span>
            <h2>Shipping information</h2>
          </div>
          <div className="form-grid">
            <label>
              <span>First name</span>
              <input name="firstName" required autoComplete="given-name" />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" required autoComplete="family-name" />
            </label>
            <label className="wide">
              <span>Address</span>
              <input name="shippingAddress" required autoComplete="street-address" />
            </label>
            <label>
              <span>City</span>
              <input name="shippingCity" required autoComplete="address-level2" />
            </label>
            <label>
              <span>Postal code</span>
              <input name="shippingPostalCode" required autoComplete="postal-code" />
            </label>
          </div>
        </section>
        <section>
          <div className="form-section-title">
            <span>02</span>
            <h2>Payment method</h2>
          </div>
          <div className="form-grid">
            <label className="wide">
              <span>Card number</span>
              <input
                required
                name="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
              />
            </label>
            <label>
              <span>Expiry</span>
              <input name="cardExpiry" required autoComplete="cc-exp" placeholder="MM / YY" />
            </label>
            <label>
              <span>CVC</span>
              <input
                required
                name="cardCvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="000"
              />
            </label>
          </div>
        </section>
      </form>

      <aside className="checkout-summary">
        <div className="checkout-timer">
          <span><i /> Reservation active</span>
          <strong className={secondsLeft < 60 ? 'urgent' : ''}>
            {formatTime(secondsLeft)}
          </strong>
        </div>
        <div className="checkout-item">
          <img
            src={activeProduct ? imageFor(activeProduct) : fallbackImages[0]}
            alt={activeProduct?.name ?? 'Reserved sneaker'}
          />
          <div>
            <span>Selected item</span>
            <h2>{activeProduct?.name ?? 'Reserved pair'}</h2>
            <p>{reservation.shoeSize} / QTY: {reservation.quantity}</p>
          </div>
        </div>
        <div className="price-lines">
          <span><small>Subtotal</small><strong>{formatPrice(subtotal)}</strong></span>
          <span><small>Shipping (overnight)</small><strong>{formatPrice(shipping)}</strong></span>
          <span className="total"><small>Total</small><strong>{formatPrice(total)}</strong></span>
        </div>
        <button
          className="primary-button"
          type="submit"
          form="checkout-form"
          disabled={checkingOut}
        >
          {checkingOut ? 'Securing allocation...' : 'Complete checkout'}
          <span aria-hidden="true">→</span>
        </button>
        <button
          className="text-button"
          disabled={cancelling}
          onClick={() => void cancelReservation()}
        >
          {cancelling ? 'Cancelling...' : 'Cancel'}
        </button>
        <p className="legal-copy">
          By completing checkout, you agree to the DropLock terms. All sales are
          final.
        </p>
      </aside>
    </section>
  );
}
