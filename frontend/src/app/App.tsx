import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AccountPage } from '../pages/AccountPage';
import { AdminPage } from '../pages/AdminPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { HomePage } from '../pages/HomePage';
import { ItineraryPage } from '../pages/ItineraryPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { SharedPage } from '../pages/SharedPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/shared/:token" element={<SharedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/itineraries/:id" element={<ItineraryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute admin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
