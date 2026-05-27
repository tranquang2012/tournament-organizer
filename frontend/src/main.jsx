import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

//import components
import Login from './pages/auth/Login.jsx'
import LandingPage from './pages/public/LandingPage.jsx'
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage.jsx'
import UserProfileManagement from './pages/user/UserProfileManagement.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/account-management" element={<UserProfileManagement />} />
      </Routes>
    </BrowserRouter>
  // </StrictMode>,
)
