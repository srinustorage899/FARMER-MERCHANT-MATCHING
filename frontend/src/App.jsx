import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider } from './hooks/useLanguage';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import UploadCropPage from './pages/UploadCropPage';
import FarmerProfilePage from './pages/FarmerProfilePage';
import MerchantDashboard from './pages/MerchantDashboard';
import FindFarmersPage from './pages/FindFarmersPage';
import MyOrdersPage from './pages/MyOrdersPage';
import MerchantProfilePage from './pages/MerchantProfilePage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      {/* Homepage — public landing page */}
      <Route
        path="/"
        element={
          session
            ? <Navigate to={session.role === 'farmer' ? '/farmer' : '/merchant'} replace />
            : <HomePage />
        }
      />

      {/* Auth page (Login / Sign Up) */}
      <Route
        path="/login"
        element={
          session
            ? <Navigate to={session.role === 'farmer' ? '/farmer' : '/merchant'} replace />
            : <LoginPage />
        }
      />

      {/* Farmer routes */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute role="farmer">
            <FarmerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/upload"
        element={
          <ProtectedRoute role="farmer">
            <UploadCropPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/profile"
        element={
          <ProtectedRoute role="farmer">
            <FarmerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Merchant routes */}
      <Route
        path="/merchant"
        element={
          <ProtectedRoute role="merchant">
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/find-farmers"
        element={
          <ProtectedRoute role="merchant">
            <FindFarmersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/orders"
        element={
          <ProtectedRoute role="merchant">
            <MyOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/profile"
        element={
          <ProtectedRoute role="merchant">
            <MerchantProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Settings (any authenticated user) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
