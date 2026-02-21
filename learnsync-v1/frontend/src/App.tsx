import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/Toaster'

// Layouts
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// Dashboard Pages
import StudentDashboard from './pages/dashboard/StudentDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import Profile from './pages/dashboard/Profile'
import Progress from './pages/dashboard/Progress'
import Quizzes from './pages/dashboard/Quizzes'
import Analytics from './pages/dashboard/Analytics'

// Admin Pages
import Students from './pages/admin/Students'
import Subjects from './pages/admin/Subjects'
import AuditLogs from './pages/admin/AuditLogs'
import Reports from './pages/admin/Reports'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Student Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/quizzes" element={<Quizzes />} />
                
                {/* Admin Routes */}
                <Route element={<RoleRoute allowedRoles={['admin', 'superadmin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/students" element={<Students />} />
                  <Route path="/admin/subjects" element={<Subjects />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="/admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/admin/reports" element={<Reports />} />
                </Route>
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App