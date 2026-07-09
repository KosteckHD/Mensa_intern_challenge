import { useNavigate } from 'react-router-dom';
import { DataPoint } from '../components/DataPoint';
import { EmptyProducts, LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { imageFor } from '../lib/images';

export function LiveDropPage() {
  const { products, stats, loadingProducts, refreshProducts } = useDrop();
  const navigate = useNavigate();
  const product =
    products.find((item) => item.stockAvailable > 0) ?? products[0] ?? null;

  if (loadingProducts) return <LoadingProducts />;
  if (!product) {
    return <EmptyProducts onRefresh={() => void refreshProducts()} />;
  }

  return (
    <section className="live-page">
      <div className="hero-media">
        <img src={imageFor(product)} alt={product.name} />
        <div className="hero-corner">
          <span>SYS_MODEL</span>
          <strong>{product.model}</strong>
        </div>
        <button
          className="media-open"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          Open drop <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="hero-copy">
        <div>
          <p className="kicker">Limited release protocol</p>
          <h1>{product.name}</h1>
          <p className="colorway">{product.colorway}</p>
        </div>
        <p className="intro">
          Real-time inventory consensus is active. Select a size and secure your
          allocation before the reservation window closes.
        </p>
        <div className="hero-meta">
          <DataPoint label="REF_SKU" value={product.sku} />
          <DataPoint label="AVAIL_POOL" value={product.stockAvailable} />
          <DataPoint label="TOTAL_UNITS" value={product.stockTotal} />
        </div>
        <button className="primary-button" onClick={() => navigate('/products')}>
          View products <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="protocol-bar">
        <span><i /> SYSTEM ONLINE</span>
        <span>RESERVATION WINDOW: 05:00</span>
        <span>{stats.sold} SETTLED TX</span>
      </div>

      <div className="live-list">
        <div className="section-title">
          <p className="kicker">Current allocation</p>
          <h2>Live products</h2>
        </div>
        <div className="live-products">
          {products.slice(0, 4).map((item, index) => (
            <button
              key={item.id}
              onClick={() => navigate(`/products/${item.id}`)}
            >
              <span className="item-index">0{index + 1}</span>
              <img src={imageFor(item)} alt="" />
              <span className="item-info">
                <strong>{item.model}</strong>
                <small>{item.colorway}</small>
              </span>
              <span
                className={`stock-tag ${
                  item.stockAvailable === 0 ? 'sold' : ''
                }`}
              >
                {item.stockAvailable === 0
                  ? 'DEPLETED'
                  : `${item.stockAvailable} LEFT`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
