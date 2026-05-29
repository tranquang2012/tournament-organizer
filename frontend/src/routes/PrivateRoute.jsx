import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const PrivateRoute = ({ children }) => {
  const { isLogin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-white" />
  }

  if (!isLogin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children || <Outlet />
}

export default PrivateRoute
