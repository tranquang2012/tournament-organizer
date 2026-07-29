import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'

// User
import Login from './pages/auth/Login.jsx'
import LandingPage from './pages/public/LandingPage.jsx'
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage.jsx'
import UserProfileManagement from './pages/user/UserProfileManagement.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import PrivateRoute from './routes/PrivateRoute.jsx'
import AdminRoute from './routes/AdminRoute.jsx'

// Public layout & pages
import PublicLayout from './components/layout/PublicLayout.jsx'
import SportsPage from './pages/public/SportsPage.jsx'
import TournamentPage from './pages/public/TournamentPage.jsx'
import MatchesPage from './pages/public/MatchesPage.jsx'

// Admin
import AdminLayout from './components/layout/AdminLayout.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import TournamentCreatePage from './pages/admin/TournamentCreatePage.jsx'
import TournamentManagePage from './pages/admin/TournamentManagePage.jsx'
import TournamentEditPage from './pages/admin/TournamentEditPage.jsx'
import UserManagementPage from './pages/admin/UserManagementPage.jsx'

const AuthProviderWrapper = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AuthProviderWrapper />}>
      {/* Public routes with shared navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sports/:id" element={<SportsPage />} />
        <Route path="/tournaments/:id" element={<TournamentPage />} />
        <Route path="/matches/:id" element={<MatchesPage />} />
        <Route
          path="account-management"
          element={
            <PrivateRoute>
              <UserProfileManagement />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="tournaments/create" element={<TournamentCreatePage />} />
        <Route path="tournaments/list" element={<TournamentManagePage />} />
        <Route path="tournaments/:id/edit" element={<TournamentEditPage />} />
        <Route
          path="accounts"
          element={
            <AdminRoute allowedRoles={['SUPER_ADMIN']} redirectTo="/admin/dashboard">
              <UserManagementPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
