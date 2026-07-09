import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { droplockApi } from '../api/droplockApi';
import { LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { formatPrice } from '../lib/format';
import { fallbackImages, imageFor } from '../lib/images';
import { CheckoutResponse, Order } from '../types/api';

type SuccessLocationState = {
  result?: CheckoutResponse;
};

export function CheckoutSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { products } = useDrop();
  const state = location.state as SuccessLocationState | null;
  const [order, setOrder] = useState<Order | null>(state?.result?.order ?? null);
  const [loading, setLoading] = useState(!state?.result?.order);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order) return;
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) {
      navigate('/products', { replace: true });
      return;
    }
    void droplockApi
      .getOrder(id)
      .then(setOrder)
      .catch(() => navigate('/products', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate, order, orderId]);

  if (loading || !order) return <LoadingProducts />;

  const product =
    products.find((item) => item.id === order.productId) ?? null;

  async function copyOrderNumber() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="checkout-success" aria-labelledby="success-title">
      <div className="checkout-success-content">
        <header className="success-confirmation">
          <div className="success-check" aria-hidden="true">✓</div>
          <span>Order confirmed</span>
          <h1 id="success-title">Your pair is locked</h1>
          <p>Order #{order.orderNumber}</p>
        </header>

        <article className="confirmed-order">
          <div className="confirmed-product-image">
            <img
              src={product ? imageFor(product) : fallbackImages[0]}
              alt={product?.name ?? 'Purchased sneaker'}
            />
            <span>{order.quantity}x</span>
          </div>

          <div className="confirmed-order-body">
            <div>
              <h2>{product?.name ?? 'Limited pair'}</h2>
              <dl>
                <div>
                  <dt>Size</dt>
                  <dd>{order.shoeSize}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatPrice(order.totalPriceCents)}</dd>
                </div>
              </dl>
            </div>

            <ol className="order-timeline" aria-label="Order status">
              <li>
                <i aria-hidden="true" />
                <span>Reservation completed</span>
              </li>
              <li>
                <i aria-hidden="true" />
                <span>Order confirmed</span>
              </li>
            </ol>
          </div>
        </article>

        <div className="success-identifiers">
          <span>Order ID <strong>#{order.id}</strong></span>
          <span>Reservation <strong>#{order.reservationId}</strong></span>
        </div>

        <div className="success-actions">
          <button onClick={() => navigate('/products')}>
            Back to products
          </button>
          <button className="primary" onClick={() => void copyOrderNumber()}>
            {copied ? 'Order number copied' : 'Copy order number'}
          </button>
        </div>

        <p className="success-footnote">
          Order details are recorded and inventory has been permanently updated.
        </p>
      </div>
    </section>
  );
}
