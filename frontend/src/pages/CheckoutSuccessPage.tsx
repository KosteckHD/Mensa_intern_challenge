import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { droplockApi } from '../api/droplockApi';
import { DataPoint } from '../components/DataPoint';
import { LoadingInventory } from '../components/SystemState';
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

  useEffect(() => {
    if (order) return;
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) {
      navigate('/inventory', { replace: true });
      return;
    }
    void droplockApi
      .getOrder(id)
      .then(setOrder)
      .catch(() => navigate('/inventory', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate, order, orderId]);

  if (loading || !order) return <LoadingInventory />;

  const product =
    products.find((item) => item.id === order.productId) ?? null;

  return (
    <section className="success-page">
      <div className="success-mark" aria-hidden="true">✓</div>
      <p className="kicker">Transaction settled</p>
      <h1>Pair secured.</h1>
      <p className="success-copy">
        Your checkout is complete. The allocation has been permanently removed
        from available inventory.
      </p>
      <div className="success-order">
        <img
          src={product ? imageFor(product) : fallbackImages[0]}
          alt={product?.name ?? 'Purchased sneaker'}
        />
        <div>
          <span>Order {order.orderNumber}</span>
          <h2>{product?.name ?? 'Limited pair'}</h2>
          <p>{order.shoeSize} / QTY: {order.quantity}</p>
        </div>
        <strong>{formatPrice(order.totalPriceCents)}</strong>
      </div>
      <div className="success-meta">
        <DataPoint label="STATUS" value="CONFIRMED" />
        <DataPoint label="ORDER ID" value={`#${order.id}`} />
        <DataPoint label="RESERVATION" value={`#${order.reservationId}`} />
      </div>
      <button className="primary-button" onClick={() => navigate('/inventory')}>
        Return to inventory <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
