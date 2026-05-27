import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

//import components
import Login from './pages/auth/Login.jsx'

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
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />

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

