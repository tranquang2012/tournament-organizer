import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const PrivateRoute = ({ children, redirectAdmins = false, adminRedirectTo = '/admin/dashboard' }) => {
  const { isLogin, isAdmin, loading, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || (redirectAdmins && profileLoading)) {
    return <div className="min-h-screen bg-white" />
  }

  if (!isLogin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (redirectAdmins && isAdmin) {
    return <Navigate to={adminRedirectTo} replace />
  }

  return children || <Outlet />
}

export default PrivateRoute
