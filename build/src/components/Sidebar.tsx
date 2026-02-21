/**
 * Sidebar Component
 * Navigation sidebar for dashboard
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  FileQuestion,
  BookOpen,
  User,
  Settings,
  Users,
  GraduationCap,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const studentNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
  { name: 'Quizzes', href: '/dashboard/quizzes', icon: FileQuestion },
  { name: 'Content', href: '/dashboard/content', icon: BookOpen },
];

const adminNav: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: Users, badge: 'New' },
  { name: 'Subjects', href: '/admin/subjects', icon: GraduationCap },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
];

const bottomNav: NavItem[] = [
  { name: 'Profile', href: 'profile', icon: User },
  { name: 'Settings', href: 'settings', icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const basePath = isAdmin ? '/admin' : '/dashboard';
  const navItems = isAdmin ? adminNav : studentNav;

  const isActive = (href: string) => {
    if (href === basePath) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link to={basePath} className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LearnSync
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
        {navItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          </motion.div>
        ))}

        {/* Divider */}
        <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

        {/* Bottom Navigation */}
        {bottomNav.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (navItems.length + index) * 0.05 }}
          >
            <Link
              to={`${basePath}/${item.href}`}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive(`${basePath}/${item.href}`)
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
        <Link to={`${basePath}/profile`} className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          )}
        </Link>
      </div>
    </motion.aside>
  );
}