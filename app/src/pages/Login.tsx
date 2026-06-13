/**
 * Login Page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Brain, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import { getUserHomePath } from '../lib/navigation';

interface LoginProps {
  portal?: 'student' | 'admin';
}

export default function Login({ portal = 'student' }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await login(email, password, portal);
      navigate(getUserHomePath(user));
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Unable to sign in. Please check the credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LearnSync AI
            </span>
          </Link>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {portal === 'admin' ? 'Administrator portal' : 'Student learning portal'}
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8"
        >
          <div className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${portal === 'admin' ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20' : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'}`}>
            {portal === 'admin' ? <ShieldCheck className="h-6 w-6 text-purple-600" /> : <GraduationCap className="h-6 w-6 text-blue-600" />}
            <div><p className="font-semibold">{portal === 'admin' ? 'Admin sign in' : 'Student sign in'}</p><p className="text-xs text-slate-500">{portal === 'admin' ? 'Manage students, curriculum, and reports.' : 'Access subjects, lessons, quizzes, and progress.'}</p></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  Sign in as {portal === 'admin' ? 'Admin' : 'Student'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            {portal === 'student' && <p className="text-sm text-slate-600 dark:text-slate-400">Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">Sign up</Link></p>}
            <Link to={portal === 'admin' ? '/login' : '/admin/login'} className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700">
              {portal === 'admin' ? <GraduationCap className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              Go to {portal === 'admin' ? 'student' : 'admin'} sign in
            </Link>
          </div>
        </motion.div>

        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">Development accounts</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Configure approved admin and student accounts in <code>backend/.env</code>, then run the development start script.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
