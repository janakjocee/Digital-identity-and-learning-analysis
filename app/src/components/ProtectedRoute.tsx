/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApprovedStudent?: boolean;
}

export default function ProtectedRoute({ children, requireApprovedStudent = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireApprovedStudent) {
    if (user?.role !== 'student') {
      return <Navigate to="/admin" replace />;
    }
    if (user.status !== 'approved') {
      return <Navigate to="/account-status" replace />;
    }
  }

  return <>{children}</>;
}
