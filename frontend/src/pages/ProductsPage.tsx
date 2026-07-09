import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataPoint } from '../components/DataPoint';
import { EmptyProducts, LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { formatPrice } from '../lib/format';
import { imageFor } from '../lib/images';
import { Product } from '../types/api';

export function ProductsPage() {
  const { products, stats, loadingProducts, refreshProducts } = useDrop();
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sizeFilter, setSizeFilter] = useState('all');
  const navigate = useNavigate();

  const sizes = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((product) => product.sizes.map((size) => size.sizeCode))),
      ).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = [
        product.brand,
        product.model,
        product.name,
        product.colorway,
        product.sku,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesSize =
        sizeFilter === 'all' ||
        product.sizes.some(
          (size) => size.sizeCode === sizeFilter && size.stockAvailable > 0,
        );
      return (
        matchesQuery &&
        matchesSize &&
        (!availableOnly || product.stockAvailable > 0)
      );
    });
  }, [availableOnly, products, query, sizeFilter]);

  const valuationCents = products.reduce(
    (sum, product) => sum + product.priceCents * product.stockTotal,
    0,
  );

  if (loadingProducts) return <LoadingProducts />;

  return (
    <section className="inventory-page">
      <div className="inventory-heading">
        <div>
          <p className="kicker">Live drop</p>
          <h1>Products</h1>
        </div>
        <div className="inventory-stats">
          <DataPoint label="TOTAL PRODUCTS" value={stats.products} />
          <DataPoint label="TOTAL PAIRS" value={stats.total} />
          <DataPoint label="VALUATION" value={formatPrice(valuationCents)} />
        </div>
      </div>

      <div className="inventory-tools">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search model, brand or SKU"
            aria-label="Search products"
          />
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.target.checked)}
          />
          <span aria-hidden="true" />
          Only available
        </label>
        <label className="size-filter">
          <span>Size</span>
          <select
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value)}
            aria-label="Filter by size"
          >
            <option value="all">All sizes</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyProducts onRefresh={() => void refreshProducts()} />
      ) : (
        <div className="inventory-list">
          {filteredProducts.map((product, index) => (
            <ProductRow
              key={product.id}
              product={product}
              index={index}
              onOpen={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductRow({
  product,
  index,
  onOpen,
}: {
  product: Product;
  index: number;
  onOpen: () => void;
}) {
  const soldOut = product.stockAvailable === 0;
  const lowStock = product.stockAvailable > 0 && product.stockAvailable <= 3;

  return (
    <article className={`inventory-row ${soldOut ? 'is-sold-out' : ''}`}>
      <div className="row-index">{String(index + 1).padStart(2, '0')}</div>
      <button className="row-image" onClick={onOpen} aria-label={`Open ${product.name}`}>
        <img src={imageFor(product)} alt={product.name} />
      </button>
      <div className="row-product">
        <span className={`status ${soldOut ? 'sold' : lowStock ? 'low' : ''}`}>
          {soldOut ? 'Sold out' : lowStock ? 'Low stock' : 'Live'}
        </span>
        <p>{product.brand}</p>
        <h2>{product.name}</h2>
        <small>{product.sku} / {product.colorway}</small>
      </div>
      <div className="row-sizes">
        <span className="data-label">SELECT SIZE (EU)</span>
        <div>
          {product.sizes.slice(0, 6).map((size) => (
            <span
              className={size.stockAvailable === 0 ? 'unavailable' : ''}
              key={size.id}
            >
              {size.sizeCode.replace(/^EU\s*/i, '')}
            </span>
          ))}
        </div>
      </div>
      <div className="row-stock">
        <strong>{product.stockAvailable}</strong>
        <span>/ {product.stockTotal} available</span>
      </div>
      <div className="row-action">
        <strong>{formatPrice(product.priceCents)}</strong>
        <button
          className="arrow-button"
          disabled={soldOut}
          onClick={onOpen}
          aria-label="Select size"
        >
          →
        </button>
      </div>
    </article>
  );
}
