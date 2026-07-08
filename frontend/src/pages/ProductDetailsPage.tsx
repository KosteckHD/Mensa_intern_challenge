import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyInventory, LoadingInventory } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import {
  formatPrice,
  getDefaultSize,
  selectedSizeStock,
} from '../lib/format';
import { imageFor } from '../lib/images';

export function ProductDetailsPage() {
  const { productId } = useParams();
  const { products, loadingProducts, refreshProducts, reserve } = useDrop();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === Number(productId)) ?? null;
  const [shoeSize, setShoeSize] = useState('');
  const [email, setEmail] = useState('');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (product && !shoeSize) setShoeSize(getDefaultSize(product));
  }, [product, shoeSize]);

  if (loadingProducts) return <LoadingInventory />;
  if (!product) {
    return <EmptyInventory onRefresh={() => void refreshProducts()} />;
  }

  const selectedStock = selectedSizeStock(product, shoeSize);

  async function submitReservation() {
    if (!shoeSize) return;
    setReserving(true);
    try {
      const created = await reserve(product!, shoeSize, email);
      navigate(`/reservation/${created.id}`);
    } catch {
      // The context maps API failures to dedicated error routes.
    } finally {
      setReserving(false);
    }
  }

  return (
    <section className="product-detail">
      <button className="back-button" onClick={() => navigate('/inventory')}>
        ← Back to inventory
      </button>
      <div className="detail-media">
        <img src={imageFor(product)} alt={product.name} />
        <span className="image-code">IMG_0{product.id} / DROP</span>
      </div>
      <div className="detail-panel">
        <div className="detail-heading">
          <div>
            <p className="kicker">Live drop</p>
            <h1>{product.name}</h1>
            <p>{product.colorway}</p>
          </div>
          <strong className="detail-price">{formatPrice(product.priceCents)}</strong>
        </div>
        <div className="aggregate">
          <span>SKU: {product.sku}</span>
          <span>AGGREGATE: {product.stockAvailable} PAIRS</span>
        </div>
        <fieldset className="size-picker">
          <legend>Select size (EU)</legend>
          <div>
            {product.sizes.map((size) => {
              const unavailable = size.stockAvailable === 0;
              return (
                <button
                  type="button"
                  key={size.id}
                  className={shoeSize === size.sizeCode ? 'selected' : ''}
                  disabled={unavailable}
                  onClick={() => setShoeSize(size.sizeCode)}
                >
                  <strong>{size.sizeCode.replace(/^EU\s*/i, '')}</strong>
                  <small>
                    {unavailable
                      ? 'OUT'
                      : size.stockAvailable <= 5
                        ? `${size.stockAvailable} LEFT`
                        : 'READY'}
                  </small>
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="input-field">
          <span>Reservation email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </label>
        <div className="reserve-block">
          <p>Reservation guaranteed for 5 minutes</p>
          <button
            className="primary-button"
            disabled={!shoeSize || selectedStock === 0 || reserving}
            onClick={() => void submitReservation()}
          >
            {reserving ? 'Securing allocation...' : 'Reserve pair'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
