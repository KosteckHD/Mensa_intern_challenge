import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDrop } from '../context/DropContext';

export function Layout() {
  const { failure, reservation, refreshProducts } = useDrop();
  const location = useLocation();
  const navigate = useNavigate();
  const isCheckout = location.pathname.startsWith('/checkout/');

  useEffect(() => {
    if (failure && !location.pathname.startsWith('/errors/')) {
      const errorPath =
        failure === 'expired' ? 'reservation-expired' : failure;
      navigate(`/errors/${errorPath}`, { state: { from: location.pathname } });
    }
  }, [failure, location.pathname, navigate]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" to="/">DROPLOCK</Link>
        <span className="live-label"><i /> LIVE DROP</span>
        <nav aria-label="Primary navigation">
          <Link
            className={location.pathname === '/inventory' ? 'active' : ''}
            to="/inventory"
          >
            Inventory
          </Link>
          {reservation && (
            <Link
              className={
                location.pathname.startsWith('/reservation/') ||
                location.pathname.startsWith('/checkout/')
                  ? 'active'
                  : ''
              }
              to={`/reservation/${reservation.id}`}
            >
              Reservation
            </Link>
          )}
          <button onClick={() => void refreshProducts()}>Refresh</button>
        </nav>
      </header>

      <main className={isCheckout ? 'checkout-main' : 'main'}>
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
