import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // Synchronous import for instant shell
import Skeleton from './components/Skeleton';
import ErrorBoundary from './components/ErrorBoundary';

// Page components are lazy-loaded to keep initial bundle small
const Home = lazy(() => import('./pages/Home'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminAddProduct = lazy(() => import('./pages/admin/AddProduct'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminSettings = lazy(() => import('./pages/admin/Dashboard')); // Placeholder for now

// Defer heavy non-critical components
const NotificationHandler = lazy(() => import('./hooks/useNotifications').then(m => ({
  default: () => {
    m.useNotifications();
    return null;
  }
})));

const LazyToaster = lazy(() => import('react-hot-toast').then(m => ({ default: m.Toaster })));

// Ultra-lightweight fallback for route transitions
const PageFallback = () => (
  <div className="page page-transition" style={{ padding: '1rem' }}>
    <Skeleton height="200px" style={{ marginBottom: '2.5rem', borderRadius: 'var(--border-radius-md)' }} />
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} width="80px" height="32px" style={{ borderRadius: '20px' }} />
      ))}
    </div>
    <div className="product-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass" style={{ padding: '1.25rem', height: '360px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="180px" />
          <Skeleton height="24px" width="70%" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <Skeleton height="24px" width="40px" />
            <Skeleton height="36px" width="80px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={null}>
          <NotificationHandler />
          <LazyToaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 15, 15, 0.8)',
                color: '#fff',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--accent-blue)',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff4b2b',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Suspense>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Storefront Routes with Default Layout */}
            <Route element={<Layout><Home /></Layout>} path="/" />
            <Route element={<Layout><Cart /></Layout>} path="/cart" />
            <Route element={<Layout><Orders /></Layout>} path="/orders" />
            <Route element={<Layout><OrderDetails /></Layout>} path="/order/:id" />
            <Route element={<Layout><ProductDetails /></Layout>} path="/product/:id" />
            <Route element={<Layout><Profile /></Layout>} path="/profile" />
            <Route element={<Layout><Login /></Layout>} path="/login" />
            <Route element={<Layout><Register /></Layout>} path="/register" />
            
            {/* Admin Routes - These use AdminLayout internally */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/add" element={<AdminAddProduct />} />
            <Route path="/admin/products/edit/:id" element={<AdminAddProduct />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
