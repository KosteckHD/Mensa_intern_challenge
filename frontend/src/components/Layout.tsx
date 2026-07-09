import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDrop } from '../context/DropContext';

export function Layout() {
  const { failure, reservation, refreshProducts } = useDrop();
  const location = useLocation();
  const navigate = useNavigate();
  const isCheckout = location.pathname.startsWith('/checkout/');
  const isCheckoutSuccess = location.pathname.startsWith('/checkout/success/');

  useEffect(() => {
    if (failure && !location.pathname.startsWith('/errors/')) {
      const errorPath =
        failure === 'expired' ? 'reservation-expired' : failure;
      navigate(`/errors/${errorPath}`, { state: { from: location.pathname } });
    }
  }, [failure, location.pathname, navigate]);

  return (
    <div className={`app-shell ${isCheckoutSuccess ? 'success-shell' : ''}`}>
      {!isCheckoutSuccess && (
        <header className="topbar">
          <Link className="wordmark" to="/">DROPLOCK</Link>
          <span className="live-label"><i /> LIVE DROP</span>
          <nav aria-label="Primary navigation">
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
                Checkout
              </Link>
            )}
            <button onClick={() => void refreshProducts()}>Refresh</button>
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
