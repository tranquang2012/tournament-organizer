import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AdminRoute = ({ allowedRoles = ['ADMIN', 'SUPER_ADMIN'], redirectTo = '/', children }) => {
  const { isLogin, loading, profileLoading, role, loginRedirectPath } = useAuth()
  const location = useLocation()

  if (loading || (profileLoading && !role)) {
    return <div className="min-h-screen bg-[#f5f7fa]" />
  }

  if (!isLogin) {
    return <Navigate to={loginRedirectPath || '/login'} replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return children || <Outlet />
}

export default AdminRoute
