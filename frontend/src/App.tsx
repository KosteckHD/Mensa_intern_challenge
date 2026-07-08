import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DropProvider } from './context/DropContext';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';
import { ErrorPage } from './pages/ErrorPage';
import { InventoryPage } from './pages/InventoryPage';
import { LiveDropPage } from './pages/LiveDropPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { ReservationPage } from './pages/ReservationPage';

export function App() {
  return (
    <BrowserRouter>
      <DropProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LiveDropPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="products/:productId" element={<ProductDetailsPage />} />
            <Route
              path="reservation/:reservationId"
              element={<ReservationPage />}
            />
            <Route
              path="checkout/:reservationId"
              element={<CheckoutPage />}
            />
            <Route
              path="checkout/success/:orderId"
              element={<CheckoutSuccessPage />}
            />
          </Route>
          <Route path="errors/:errorKind" element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DropProvider>
    </BrowserRouter>
  );
}
