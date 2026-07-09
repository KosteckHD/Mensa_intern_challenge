import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataPoint } from '../components/DataPoint';
import { EmptyProducts, LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import { formatPrice } from '../lib/format';
import { imageFor } from '../lib/images';
import { Product } from '../types/api';

const pageSize = 24;

export function ProductsPage() {
  const { products, stats, loadingProducts, refreshProducts } = useDrop();
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sizeFilter, setSizeFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const navigate = useNavigate();

  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((product) =>
            product.sizes.map((size) => size.sizeCode),
          ),
        ),
      ).sort(),
    [products],
  );

  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort(),
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
      const matchesBrand =
        brandFilter === 'all' || product.brand === brandFilter;

      return (
        matchesQuery &&
        matchesSize &&
        matchesBrand &&
        (!availableOnly || product.stockAvailable > 0)
      );
    });
  }, [availableOnly, brandFilter, products, query, sizeFilter]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [availableOnly, brandFilter, query, sizeFilter]);

  const valuationCents = products.reduce(
    (sum, product) => sum + product.priceCents * product.stockTotal,
    0,
  );
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredProducts.length;

  if (loadingProducts) return <LoadingProducts />;

  return (
    <section className="products-page">
      <section className="products-header">
        <div className="products-title-row">
          <h1>Products</h1>
          <div className="products-stats">
            <DataPoint label="TOTAL PRODUCTS" value={stats.products} />
            <DataPoint label="TOTAL PAIRS" value={stats.total} />
            <DataPoint label="VALUATION" value={formatPrice(valuationCents)} />
          </div>
        </div>

        <div className="products-toolbar">
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search SKU, Brand, Model..."
              aria-label="Search products"
            />
          </label>

          <div className="catalog-controls">
            <label className="switch catalog-availability">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              <span aria-hidden="true" />
              Only available
            </label>

            <label className="catalog-select">
              <span>Size</span>
              <select
                value={sizeFilter}
                onChange={(event) => setSizeFilter(event.target.value)}
                aria-label="Filter by size"
              >
                <option value="all">All</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size.replace(/^EU\s*/i, '')}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={`catalog-filter-button ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              <span aria-hidden="true">≡</span> Filters
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="catalog-filter-panel">
            <label>
              <span>Brand</span>
              <select
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
              >
                <option value="all">All brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                setQuery('');
                setAvailableOnly(true);
                setSizeFilter('all');
                setBrandFilter('all');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {visibleProducts.length === 0 ? (
        <EmptyProducts onRefresh={() => void refreshProducts()} />
      ) : (
        <section className="catalog-grid" aria-label="Product catalog">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </section>
      )}

      {filteredProducts.length > 0 && (
        <div className="catalog-load-more">
          <button
            disabled={!canLoadMore}
            onClick={() => setVisibleCount((count) => count + pageSize)}
          >
            Load next 24 items <span aria-hidden="true">↓</span>
          </button>
        </div>
      )}
    </section>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: () => void;
}) {
  const soldOut = product.stockAvailable === 0;
  const lowStock = product.stockAvailable > 0 && product.stockAvailable <= 3;
  const status = soldOut ? 'Sold out' : lowStock ? 'Low stock' : 'Live';

  return (
    <article
      className={`catalog-card ${soldOut ? 'catalog-card-sold' : ''}`}
    >
      <span
        className={`catalog-status ${
          soldOut ? 'sold' : lowStock ? 'low' : 'live'
        }`}
      >
        {!soldOut && !lowStock && <i />}
        {status}
      </span>

      <button
        className="catalog-image"
        onClick={onOpen}
        aria-label={`Open ${product.name}`}
      >
        <img src={imageFor(product)} alt={product.name} />
      </button>

      <div className="catalog-card-body">
        <div className="catalog-card-heading">
          <div>
            <p>{product.brand}</p>
            <h2>{product.name}</h2>
          </div>
          <strong>{formatPrice(product.priceCents)}</strong>
        </div>

        <p className="catalog-stock">
          <span aria-hidden="true">{soldOut ? '⊘' : lowStock ? '!' : '□'}</span>
          {product.stockAvailable} / {product.stockTotal} Available
        </p>

        <button
          className="catalog-details-button"
          onClick={onOpen}
          aria-label={`View details for ${product.name}`}
        >
          View details <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
