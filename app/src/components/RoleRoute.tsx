/**
 * Role Route Component
 * Restricts access based on user role
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { getUserHomePath } from '../lib/navigation';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={allowedRoles.some((role) => role === 'admin' || role === 'superadmin') ? '/admin/login' : '/login'} replace />;
  }

  if (!allowedRoles.includes(user?.role || '')) {
    toast.error('You do not have permission to access this page');
    return <Navigate to={getUserHomePath(user)} replace />;
  }

  return <>{children}</>;
}
