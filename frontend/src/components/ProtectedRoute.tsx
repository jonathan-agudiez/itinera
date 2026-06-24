import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-state">Loading Itinera…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}
