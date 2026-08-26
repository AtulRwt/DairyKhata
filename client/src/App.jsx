import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layouts
import OwnerLayout from './layouts/OwnerLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CustomerLoginPage from './pages/CustomerLoginPage';

// Owner Pages
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import CustomersPage from './pages/CustomersPage';
import EmployeesPage from './pages/EmployeesPage';
import WindowsPage from './pages/WindowsPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';

// Customer Pages
import CustomerHisabPage from './pages/CustomerHisabPage';

// Common
import LoadingSpinner from './components/LoadingSpinner';

// Protected route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) {
    if (role === 'customer') return <Navigate to="/hisab" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { initialize, isLoading, isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/customer-login" element={<CustomerLoginPage />} />
        </Route>

        {/* Owner + Employee routes */}
        <Route
          element={
            <ProtectedRoute roles={['owner', 'employee']}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/customers"
            element={
              <ProtectedRoute roles={['owner', 'employee']}>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute roles={['owner']}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/windows"
            element={
              <ProtectedRoute roles={['owner']}>
                <WindowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute roles={['owner']}>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['owner']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Customer route */}
        <Route
          path="/hisab"
          element={
            <ProtectedRoute roles={['customer']}>
              <CustomerHisabPage />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? role === 'customer'
                ? <Navigate to="/hisab" replace />
                : <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
