import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDrop } from '../context/DropContext';

export function Layout() {
  const { failure, reservation, refreshProducts } = useDrop();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCheckout = location.pathname.startsWith('/checkout/');
  const isCheckoutSuccess = location.pathname.startsWith('/checkout/success/');

  useEffect(() => {
    if (failure && !location.pathname.startsWith('/errors/')) {
      const errorPath =
        failure === 'expired' ? 'reservation-expired' : failure;
      navigate(`/errors/${errorPath}`, { state: { from: location.pathname } });
    }
  }, [failure, location.pathname, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app-shell ${isCheckoutSuccess ? 'success-shell' : ''}`}>
      {!isCheckoutSuccess && (
        <header className="topbar">
          <Link className="wordmark" to="/">DROPLOCK</Link>
          <span className="live-label"><i /> LIVE DROP</span>
          <nav className="topbar-links" aria-label="Primary navigation">
            <Link
              className={
                location.pathname === '/products' ||
                location.pathname.startsWith('/products/')
                  ? 'active'
                  : ''
              }
              to="/products"
            >
              Products
            </Link>
            {reservation && (
              <Link
                className={
                  location.pathname.startsWith('/reservation/') ||
                  location.pathname.startsWith('/checkout/')
                    ? 'active'
                    : ''
                }
                to={`/checkout/${reservation.id}`}
              >
                Cart
              </Link>
            )}
            <button onClick={() => void refreshProducts()}>Refresh</button>
          </nav>
          <button
            className="mobile-menu-button"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <nav
            id="mobile-navigation"
            className={`mobile-navigation ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="Mobile navigation"
          >
            <Link
              className={
                location.pathname === '/products' ||
                location.pathname.startsWith('/products/')
                  ? 'active'
                  : ''
              }
              to="/products"
            >
              Products
            </Link>
            {reservation && (
              <Link
                className={
                  location.pathname.startsWith('/reservation/') ||
                  location.pathname.startsWith('/checkout/')
                    ? 'active'
                    : ''
                }
                to={`/checkout/${reservation.id}`}
              >
                Cart
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                void refreshProducts();
              }}
            >
              Refresh
            </button>
          </nav>
        </header>
      )}

      <main
        className={
          isCheckoutSuccess
            ? 'success-main'
            : isCheckout
              ? 'checkout-main'
              : 'main'
        }
      >
        <Outlet />
      </main>

      <footer>
        <span>© 2026 DROPLOCK. UNCOMPROMISING SPEED.</span>
        <nav>
          <span>Terms</span>
          <span>Privacy</span>
          <span>API</span>
          <span>Status</span>
        </nav>
      </footer>
    </div>
  );
}
