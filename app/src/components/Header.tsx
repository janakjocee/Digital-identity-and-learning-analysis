/**
 * Header Component
 * Top header for dashboard
 */

import { useState } from 'react';
import { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const basePath = isAdmin ? '/admin' : '/dashboard';
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    navigate(isAdmin ? `/admin/students?search=${encodeURIComponent(query)}` : `/dashboard/content?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
      {/* Search */}
      <form className="flex-1 max-w-md" onSubmit={submitSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder={isAdmin ? 'Search students...' : 'Search subjects and lessons...'}
            className="pl-10 bg-slate-100 dark:bg-slate-800 border-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </form>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="p-2">
                  <Link to={isAdmin ? '/admin/students' : '/dashboard/quizzes'} className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <p className="text-sm font-medium">{isAdmin ? 'Review student progress' : 'Quizzes are ready'}</p>
                    <p className="text-xs text-slate-500">{isAdmin ? 'Open live student records and approvals' : 'Open your class checkpoints'}</p>
                  </Link>
                  <Link to={isAdmin ? '/admin/reports' : '/dashboard/progress'} className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <p className="text-sm font-medium">{isAdmin ? 'Platform report available' : 'Progress record updated'}</p>
                    <p className="text-xs text-slate-500">{isAdmin ? 'View live engagement and performance' : 'Review your latest completion and scores'}</p>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    to={`${basePath}/profile`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to={`${basePath}/settings`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
