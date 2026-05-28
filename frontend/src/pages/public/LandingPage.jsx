import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// #import components
import TopNavBar from '../../components/layout/TopNavbar.jsx'

const LandingPage = () => {
  const { isAdmin, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-white" />
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }
  
  return (
    <>
        <TopNavBar/>
    </>
  );
};

export default LandingPage;
