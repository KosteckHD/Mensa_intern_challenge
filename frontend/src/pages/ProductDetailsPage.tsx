import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { droplockApi } from '../api/droplockApi';
import { LoadingProducts } from '../components/SystemState';
import { useDrop } from '../context/DropContext';
import {
  formatPrice,
  getDefaultSize,
  selectedSizeStock,
} from '../lib/format';
import { imageFor } from '../lib/images';
import { legacyProductSku } from '../lib/legacyProductAliases';
import { Product } from '../types/api';

export function ProductDetailsPage() {
  const { productId } = useParams();
  const productIdNumber = Number(productId);
  const legacySku = legacyProductSku(productId);
  const { products, loadingProducts, reserve } = useDrop();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationProduct = readNavigationProduct(
    location.state,
    productIdNumber,
  );
  const listedProduct =
    products.find((item) =>
      legacySku
        ? item.sku === legacySku
        : String(item.id) === String(productId),
    ) ?? null;
  const cachedProduct = listedProduct ?? navigationProduct;
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(
    cachedProduct,
  );
  const [loadingDetail, setLoadingDetail] = useState(!cachedProduct);
  const [notFound, setNotFound] = useState(false);
  const [shoeSize, setShoeSize] = useState('');
  const [email, setEmail] = useState('');
  const [reserving, setReserving] = useState(false);
  const product =
    fetchedProduct?.id === productIdNumber
      ? fetchedProduct
      : cachedProduct;

  useEffect(() => {
    if (legacySku) {
      if (listedProduct) {
        navigate(`/products/${listedProduct.id}`, {
          replace: true,
          state: { product: listedProduct },
        });
        return;
      }

      if (!loadingProducts) {
        setFetchedProduct(null);
        setNotFound(true);
        setLoadingDetail(false);
      }
      return;
    }

    if (!Number.isInteger(productIdNumber) || productIdNumber <= 0) {
      setFetchedProduct(null);
      setNotFound(true);
      setLoadingDetail(false);
      return;
    }

    let active = true;
    setFetchedProduct(cachedProduct);
    setNotFound(false);
    setLoadingDetail(!cachedProduct);

    void droplockApi
      .getProduct(productIdNumber)
      .then((result) => {
        if (!active) return;
        setFetchedProduct(result);
        setNotFound(false);
      })
      .catch(() => {
        if (active) setNotFound(!cachedProduct);
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [
    cachedProduct,
    legacySku,
    listedProduct,
    loadingProducts,
    navigate,
    productIdNumber,
  ]);

  useEffect(() => {
    if (product && !shoeSize) setShoeSize(getDefaultSize(product));
  }, [product, shoeSize]);

  if ((loadingProducts && !product) || loadingDetail) return <LoadingProducts />;

  if (!product || notFound) {
    return (
      <section className="product-missing">
        <p className="kicker">Product unavailable</p>
        <h1>This product could not be found.</h1>
        <p>It may have been removed from the current drop.</p>
        <button className="primary-button" onClick={() => navigate('/products')}>
          Back to products
        </button>
      </section>
    );
  }

  const selectedStock = selectedSizeStock(product, shoeSize);
  const releaseDate = product.releaseAt
    ? new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(product.releaseAt))
    : 'TBA';

  async function submitReservation() {
    if (!shoeSize || !product) {
      
      return;
    }
    setReserving(true);
    try {
      const created = await reserve(product, shoeSize, email);
      navigate(`/checkout/${created.id}`);
    } catch {
      // The context maps API failures to dedicated error routes.
    } finally {
      setReserving(false);
    }
  }

  return (
    <section className="product-showcase">
      <button className="product-back" onClick={() => navigate('/products')}>
        <span aria-hidden="true">&larr;</span> Products
      </button>

      <div className="product-showcase-grid">
        <div className="product-gallery">
          <div className="product-main-image">
            <span className="scan-line" aria-hidden="true" />
            <img src={imageFor(product)} alt={product.name} />
            <div className="product-reference">
              <span>REF: {product.sku}</span>
              <span>DROP ID: {String(product.id).padStart(6, '0')}</span>
            </div>
          </div>
          <div className="product-image-strip" aria-label="Product image">
            <button className="active" aria-label="Show main product image">
              <img src={imageFor(product)} alt="" />
            </button>
          </div>
        </div>

        <div className="product-information">
          <header className="product-identity">
            <div className="product-status-line">
              <span className="live-status"><i /> Live drop</span>
              <span>ID: {String(product.id).padStart(6, '0')}</span>
            </div>
            <p className="product-brand">{product.brand}</p>
            <h1>{product.name}</h1>
            <strong>{formatPrice(product.priceCents)}</strong>
          </header>

          <dl className="product-specification">
            <div><dt>SKU</dt><dd>{product.sku}</dd></div>
            <div><dt>Colorway</dt><dd>{product.colorway}</dd></div>
            <div><dt>Release date</dt><dd>{releaseDate}</dd></div>
            <div><dt>Available</dt><dd>{product.stockAvailable} pairs</dd></div>
          </dl>

          <fieldset className="showcase-size-picker">
            <legend>
              <span>Select size (EU)</span>
              <small>Supply is tracked per size</small>
            </legend>
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
                    aria-label={`${size.sizeCode.replace(/^EU\s*/i, '')}, ${
                      unavailable
                        ? 'sold out'
                        : `${size.stockAvailable} available`
                    }`}
                  >
                    <strong>{size.sizeCode.replace(/^EU\s*/i, '')}</strong>
                    {unavailable ? (
                      <small>Out</small>
                    ) : size.stockAvailable <= 3 ? (
                      <small>Low: {size.stockAvailable}</small>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="showcase-email">
            <span>Reservation email <small>Optional</small></span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>

          <div className="reservation-window">
            <div>
              <span>Reservation hold after confirmation</span>
              <strong>05:00</strong>
            </div>
            <p>
              Selected: <strong>{shoeSize || 'Choose a size'}</strong>
              {shoeSize && ` / ${selectedStock} available`}
            </p>
          </div>

          <button
            className="showcase-reserve"
            disabled={!shoeSize || selectedStock === 0 || reserving}
            onClick={() =>  submitReservation()}
          >
            {reserving ? 'Securing allocation...' : 'Reserve now'}
          </button>
          <p className="secure-note">Inventory is locked atomically at reservation.</p>
        </div>
      </div>

      <section className="product-notes">
        <article>
          <h2>Product details</h2>
          <p>
            {product.description ??
              'A limited sneaker release available while size-specific inventory lasts.'}
          </p>
        </article>
        <article>
          <h2>Reservation and checkout</h2>
          <p>
            A successful reservation holds one pair in the selected size for
            five minutes. Unpaid reservations return automatically to inventory.
          </p>
        </article>
      </section>
    </section>
  );
}

function readNavigationProduct(
  state: unknown,
  productId: number,
): Product | null {
  if (!state || typeof state !== 'object' || !('product' in state)) {
    return null;
  }

  const candidate = (state as { product?: Product }).product;
  return candidate && Number(candidate.id) === productId ? candidate : null;
}
