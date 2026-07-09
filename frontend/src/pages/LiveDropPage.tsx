import { useNavigate } from 'react-router-dom';
import { EmptyProducts, LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { formatPrice } from '../lib/format';
import { imageFor } from '../lib/images';
import { Product } from '../types/api';

export function LiveDropPage() {
  const { products, stats, loadingProducts, refreshProducts } = useDrop();
  const navigate = useNavigate();
  const sortedByReleaseDistance = [...products].sort(
    (first, second) =>
      releaseDistance(first.releaseAt) - releaseDistance(second.releaseAt),
  );
  const featured = sortedByReleaseDistance[0] ?? null;

  if (loadingProducts) return <LoadingProducts />;
  if (!featured) {
    return <EmptyProducts onRefresh={() => void refreshProducts()} />;
  }

  const openProduct = (product: Product) =>
    navigate(`/products/${product.id}`, { state: { product } });
  const releaseDate = featured.releaseAt
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(featured.releaseAt))
    : 'Available now';
  return (
    <section className="drop-landing">
      <article className="drop-hero">
        <img src={imageFor(featured)} alt={featured.name} />
        <div className="drop-hero-status">
          <span><i /> Live drop</span>
          <span>{releaseDate}</span>
        </div>

        <div className="drop-hero-copy">
          <h1>{featured.name}</h1>
          <span className="drop-colorway">{featured.colorway}</span>
          <p className="drop-description">
            {featured.description ??
              'A limited sneaker release available while inventory lasts.'}
          </p>
          <div className="drop-price-line">
            <strong>{formatPrice(featured.priceCents)}</strong>
            <span>{featured.stockAvailable} pairs available</span>
          </div>
          <div className="drop-actions">
            <button className="primary" onClick={() => openProduct(featured)}>
              Select your size <span aria-hidden="true">&rarr;</span>
            </button>
            <button onClick={() => navigate('/products')}>
              Browse all products
            </button>
          </div>
        </div>

        <dl className="drop-availability">
          <div>
            <dt>Available at</dt>
            <dd>{releaseDate}</dd>
          </div>
          <div>
            <dt>Total supply</dt>
            <dd>{featured.stockTotal}</dd>
          </div>
          <div>
            <dt>Reservation hold</dt>
            <dd>05:00</dd>
          </div>
        </dl>
      </article>

      <div className="drop-system-bar">
        <span><i /> Inventory online</span>
        <span>{products.length} active products</span>
        <span>{stats.available} pairs available</span>
        <span>{stats.sold} completed orders</span>
      </div>

      <section className="next-drops">
        <header>
          <div>
            <p className="kicker">Release queue</p>
            <h2>More live products</h2>
          </div>
          <button onClick={() => navigate('/products')}>
            View full catalog <span aria-hidden="true">&rarr;</span>
          </button>
        </header>

        <div className="next-drop-grid">
          {sortedByReleaseDistance
            .filter((product) => product.id !== featured.id && product.stockAvailable > 0)
            .slice(0, 4)
            .map((product, index) => (
            <button
              key={product.id}
              className="next-drop"
              onClick={() => openProduct(product)}
              aria-label={`Open ${product.name}`}
            >
              <span className="next-drop-index">
                {String(index + 2).padStart(2, '0')}
              </span>
              <img src={imageFor(product)} alt="" />
              <span className="next-drop-copy">
                <small>{product.brand}</small>
                <strong>{product.model}</strong>
                <small>{product.colorway}</small>
              </span>
              <span className="next-drop-stock">
                {product.stockAvailable > 0
                  ? `${product.stockAvailable} available`
                  : 'Sold out'}
              </span>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function releaseDistance(releaseAt: string | null): number {
  if (!releaseAt) return Number.MAX_SAFE_INTEGER;
  const releaseTime = new Date(releaseAt).getTime();
  return Number.isNaN(releaseTime)
    ? Number.MAX_SAFE_INTEGER
    : Math.abs(Date.now() - releaseTime);
}
