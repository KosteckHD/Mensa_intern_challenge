import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataPoint } from '../components/DataPoint';
import { LoadingInventory } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { formatPrice, formatTime } from '../lib/format';
import { fallbackImages, imageFor } from '../lib/images';

export function ReservationPage() {
  const { reservationId } = useParams();
  const {
    reservation,
    activeProduct,
    secondsLeft,
    ensureReservation,
    cancel,
  } = useDrop();
  const navigate = useNavigate();
  const [restoring, setRestoring] = useState(reservation?.id !== Number(reservationId));
  const [cancelling, setCancelling] = useState(false);
  const restorationAttempted = useRef(false);

  useEffect(() => {
    if (restorationAttempted.current) return;
    restorationAttempted.current = true;

    const id = Number(reservationId);
    if (!Number.isInteger(id) || id <= 0) {
      navigate('/inventory', { replace: true });
      return;
    }
    if (reservation?.id === id) {
      setRestoring(false);
      return;
    }
    void ensureReservation(id).then((restored) => {
      setRestoring(false);
      if (!restored) navigate('/inventory', { replace: true });
    });
  }, [ensureReservation, navigate, reservation?.id, reservationId]);

  if (restoring || !reservation) return <LoadingInventory />;

  async function cancelReservation() {
    setCancelling(true);
    try {
      await cancel();
      navigate('/inventory');
    } catch {
      // Error routing is handled centrally by the context and layout.
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="reservation-page">
      <div className="reservation-visual">
        <img
          src={activeProduct ? imageFor(activeProduct) : fallbackImages[0]}
          alt={activeProduct?.name ?? 'Reserved sneaker'}
        />
        <div className="reservation-watermark">LOCKED</div>
      </div>
      <div className="reservation-details">
        <div className="reservation-status">
          <span><i /> Reservation active</span>
          <strong className={secondsLeft < 60 ? 'urgent' : ''}>
            {formatTime(secondsLeft)}
          </strong>
          <small>Cart expires</small>
        </div>
        <div className="reserved-heading">
          <p className="kicker">
            Inventory / Drop {String(activeProduct?.id ?? 0).padStart(3, '0')}
          </p>
          <h1>{activeProduct?.name ?? 'Reserved pair'}</h1>
          <p>{activeProduct?.sku}</p>
        </div>
        <div className="reservation-data">
          <DataPoint label="SIZE" value={reservation.shoeSize} />
          <DataPoint label="QTY" value={reservation.quantity} />
          <DataPoint label="RSV ID" value={`#${reservation.id}`} />
          <DataPoint
            label="TOTAL"
            value={formatPrice(activeProduct?.priceCents ?? 0)}
          />
        </div>
        <div className="reservation-actions">
          <button
            className="primary-button"
            onClick={() => navigate(`/checkout/${reservation.id}`)}
          >
            Complete checkout <span aria-hidden="true">→</span>
          </button>
          <button
            className="text-button danger"
            disabled={cancelling}
            onClick={() => void cancelReservation()}
          >
            {cancelling ? 'Cancelling...' : 'Cancel reservation'}
          </button>
        </div>
      </div>
    </section>
  );
}
