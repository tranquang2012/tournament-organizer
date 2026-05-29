import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

//import components
import Login from './pages/auth/Login.jsx'
import LandingPage from './pages/public/LandingPage.jsx'
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage.jsx'
import UserProfileManagement from './pages/user/UserProfileManagement.jsx'

// Public layout & pages
import PublicLayout from './components/layout/PublicLayout.jsx'
import SportsPage from './pages/public/SportsPage.jsx'
import TournamentListPage from './pages/public/TournamentListPage.jsx'
import MatchesPage from './pages/public/MatchesPage.jsx'

// Admin
import AdminLayout from './components/layout/AdminLayout.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import TournamentCreatePage from './pages/admin/TournamentCreatePage.jsx'
import TournamentManagePage from './pages/admin/TournamentManagePage.jsx'
import UserManagementPage from './pages/admin/UserManagementPage.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes with shared navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/tournaments" element={<TournamentListPage />} />
          <Route path="/matches" element={<MatchesPage />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/account-management" element={<UserProfileManagement />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="tournaments/create" element={<TournamentCreatePage />} />
          <Route path="tournaments/list" element={<TournamentManagePage />} />
          <Route path="accounts" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  // </StrictMode>,
)
