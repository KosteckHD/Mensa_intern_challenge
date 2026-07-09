import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDrop } from '../context/DropContext';
import { fallbackShoeSize } from '../lib/format';
import { fallbackImages, imageFor } from '../lib/images';
import { FailureKind } from '../types/api';

type ErrorLocationState = {
  from?: string;
};

export function ErrorPage() {
  const { errorKind } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    failure,
    lastAttempt,
    clearFailure,
    refreshProducts,
  } = useDrop();
  const state = location.state as ErrorLocationState | null;
  const kind = parseFailure(errorKind) ?? failure ?? 'network';
  const expired = kind === 'expired';
  const soldOut = kind === 'sold-out' || kind === 'checkout-conflict';
  const network = kind === 'network';
  const title = expired
    ? 'Reservation expired'
    : soldOut
      ? 'Size sold out'
      : 'Connection terminated';
  const message = expired
    ? 'Your hold ended and the pair returned to inventory. The session has timed out.'
    : soldOut
      ? 'This size was reserved by another buyer before your request completed.'
      : 'Backend is not reachable. Make sure the NestJS server is running on the configured API URL, then retry.';

  async function retryConnection() {
    clearFailure();
    await refreshProducts();
    navigate(state?.from ?? '/products', { replace: true });
  }

  function returnToProduct() {
    clearFailure();
    navigate(
      lastAttempt.product
        ? `/products/${lastAttempt.product.id}`
        : '/products',
      { replace: true },
    );
  }

  async function returnToProducts() {
    clearFailure();
    await refreshProducts();
    navigate('/products', { replace: true });
  }

  return (
    <div className="failure-screen" role="alert" aria-labelledby="failure-title">
      <button
        className="failure-close"
        onClick={() => {
          clearFailure();
          navigate('/products');
        }}
        aria-label="Close"
      >
        ×
      </button>
      <section>
        <div className="failure-code">
          <span aria-hidden="true">{network ? '⌁' : expired ? '◷' : '!'}</span>
          <strong>Error {network ? '503' : expired ? '410' : '409'}</strong>
        </div>
        <h1 id="failure-title">{title}</h1>
        <p>{message}</p>
        {!network && (
          <div className="failure-product">
            <img
              src={
                lastAttempt.product
                  ? imageFor(lastAttempt.product)
                  : fallbackImages[2]
              }
              alt={lastAttempt.product?.name ?? 'Sneaker'}
            />
            <div>
              <span>
                {lastAttempt.product?.colorway ?? 'Limited allocation'}
              </span>
              <h2>{lastAttempt.product?.name ?? 'Reserved sneaker'}</h2>
            </div>
            <div>
              <span>Attempted size</span>
              <strong>
                {(lastAttempt.shoeSize || fallbackShoeSize).replace(
                  /^EU\s*/i,
                  '',
                )}
              </strong>
            </div>
          </div>
        )}
        <div className="failure-actions">
          <button
            className="primary-button"
            onClick={() =>
              void (network ? retryConnection() : returnToProduct())
            }
          >
            {network
              ? 'Force retry'
              : expired
                ? 'Try again'
                : 'Choose another size'}
            <span aria-hidden="true">→</span>
          </button>
          <button
            className="secondary-button"
            onClick={() => void returnToProducts()}
          >
            {network ? 'Back to products' : 'Refresh products'}
          </button>
        </div>
      </section>
    </div>
  );
}

function parseFailure(value: string | undefined): FailureKind | null {
  if (value === 'reservation-expired') return 'expired';
  if (
    value === 'sold-out' ||
    value === 'checkout-conflict' ||
    value === 'network'
  ) {
    return value;
  }
  return null;
}
