/**
 * Authentication Context
 * Manages user authentication state and operations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

/**
 * Build a human-readable error message from an Axios error.
 *
 * Priority order:
 *  1. First field-level validation message from the backend `errors` array
 *  2. Top-level `message` from the backend JSON body
 *  3. Timeout / network-level error
 *  4. `fallback` string (e.g. "Registration failed")
 */
function getErrorMessage(error: any, fallback: string): string {
  // Server responded with an error status
  if (error.response) {
    const data = error.response.data;
    // Show the first field-level validation error if available
    if (data?.errors?.length) {
      return data.errors[0].message as string;
    }
    return (data?.message as string) || fallback;
  }

  // Request was made but no response received (network / CORS / server down)
  if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return 'The server took too long to respond. It may be starting up — please try again in a moment.';
    }
    return 'Unable to reach the server. Please check your internet connection or try again later.';
  }

  return fallback;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin' | 'superadmin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  assignedClass?: number;
  avatar?: string;
  performanceMetrics?: {
    overallScore: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    completionRate: number;
  };
  aiInsights?: {
    predictedPerformance?: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    learningCluster: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  assignedClass: number;
  dateOfBirth?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem('token');
    if (token) {
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, tokens } = response.data.data;
      
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      setUser(user);
      toast.success('Login successful!');
    } catch (error: any) {
      const message = getErrorMessage(error, 'Login failed');
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      const { user, tokens } = response.data.data;
      
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      setUser(user);
      toast.success('Registration successful! Your account is pending approval.');
    } catch (error: any) {
      const message = getErrorMessage(error, 'Registration failed');
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore error
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      toast.info('You have been logged out');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}