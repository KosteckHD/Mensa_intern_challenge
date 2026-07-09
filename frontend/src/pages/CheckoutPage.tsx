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
              <input
                name="firstName"
                required
                autoComplete="given-name"
                pattern="[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:[ '-][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*"
                minLength={2}
                maxLength={50}
                title="Use letters, spaces, apostrophes or hyphens."
              />
            </label>
            <label>
              <span>Last name</span>
              <input
                name="lastName"
                required
                autoComplete="family-name"
                pattern="[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:[ '-][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*"
                minLength={2}
                maxLength={50}
                title="Use letters, spaces, apostrophes or hyphens."
              />
            </label>
            <label className="wide">
              <span>Address</span>
              <input
                name="shippingAddress"
                required
                autoComplete="street-address"
                pattern="[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż][A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźż .,'/-]{2,99}"
                maxLength={100}
                title="Enter a valid street address (3–100 characters)."
              />
            </label>
            <label>
              <span>City</span>
              <input
                name="shippingCity"
                required
                autoComplete="address-level2"
                pattern="[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:[ '-][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*"
                minLength={2}
                maxLength={60}
                title="Use letters, spaces, apostrophes or hyphens."
              />
            </label>
            <label>
              <span>Postal code</span>
              <input
                name="shippingPostalCode"
                required
                autoComplete="postal-code"
                inputMode="numeric"
                pattern="[0-9]{2}-[0-9]{3}"
                maxLength={6}
                placeholder="00-000"
                title="Use the Polish postal code format: 00-000."
                onInput={(event) => formatPostalCode(event.currentTarget)}
              />
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
                pattern="[0-9]{4}(?: [0-9]{4}){3}"
                maxLength={19}
                title="Enter a 16 digit card number."
                onInput={(event) => formatCardNumber(event.currentTarget)}
              />
            </label>
            <label>
              <span>Expiry</span>
              <input
                name="cardExpiry"
                required
                autoComplete="cc-exp"
                inputMode="numeric"
                placeholder="MM/YY"
                pattern="(?:0[1-9]|1[0-2])/[0-9]{2}"
                maxLength={5}
                title="Use the MM/YY format with a valid month."
                onInput={(event) => formatCardExpiry(event.currentTarget)}
              />
            </label>
            <label>
              <span>CVC</span>
              <input
                required
                name="cardCvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="000"
                pattern="[0-9]{3,4}"
                minLength={3}
                maxLength={4}
                title="Enter the 3 or 4 digit security code."
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

function digitsOnly(input: HTMLInputElement, maxLength: number): string {
  return input.value.replace(/\D/g, '').slice(0, maxLength);
}

function formatCardNumber(input: HTMLInputElement) {
  input.value = digitsOnly(input, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatCardExpiry(input: HTMLInputElement) {
  const digits = digitsOnly(input, 4);
  input.value = digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

function formatPostalCode(input: HTMLInputElement) {
  const digits = digitsOnly(input, 5);
  input.value = digits.length > 2
    ? `${digits.slice(0, 2)}-${digits.slice(2)}`
    : digits;
}
