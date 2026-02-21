/**
 * LearnSync AI - Frontend Application
 * AI-Powered Learning Analytics Platform
 * 
 * @author Janak Raj Joshi
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Dashboard Pages
import StudentDashboard from './pages/dashboard/StudentDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Analytics from './pages/dashboard/Analytics';
import Progress from './pages/dashboard/Progress';
import Quizzes from './pages/dashboard/Quizzes';
import Content from './pages/dashboard/Content';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';

// Admin Pages
import Students from './pages/admin/Students';
import Subjects from './pages/admin/Subjects';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Student Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="progress" element={<Progress />} />
              <Route path="quizzes" element={<Quizzes />} />
              <Route path="content" element={<Content />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin', 'superadmin']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="reports" element={<Reports />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;