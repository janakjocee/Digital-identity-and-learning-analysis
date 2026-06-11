import type { User } from '../contexts/AuthContext';

export function getUserHomePath(user: User | null): string {
  if (!user) return '/login';
  if (user.role === 'admin' || user.role === 'superadmin') return '/admin';
  if (user.status !== 'approved') return '/account-status';
  return '/dashboard';
}
