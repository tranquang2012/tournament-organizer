import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { faBars, faHeadset, faUser, faRightFromBracket, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import './TopNavBar.scss'
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

//import api
import { getCurrentUserProfile } from '../../services/AuthService';


const TopNavBar = (props) => {

  const navigate = useNavigate()
  const [data, setData] = useState(null);
  const [userData, setUserData] = useState(null);

  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLogin(!!session)
      setLoading(false)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLogin(true)
      } else if (event === 'SIGNED_OUT') {
        setIsLogin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setUserData(null);
          return;
        }

        const data = await getCurrentUserProfile();
        setUserData(data);
      } catch (error) {
        console.error(
          'Failed to fetch user profile:',
          error.response?.data?.error?.message || error.message
        );
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = `${window.location.origin}/login`;
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };
  if (loading) return null

  const handleLogin = () => {
    navigate(`/login`)
  }

  // console.log('User data:', data);

  return (
    <div className='home-header-container'>
      <div className='home-header-content'>
        <div className='home-header-left'>
          <FontAwesomeIcon icon={faBars} className='menu' />
          <Link to="/" className='header-logo'></Link>
        </div>
        <div className='home-header-center'>
          <Link to="/sports" className='category'>
            <div><b>Sports</b></div>
            <div className='sub-titles'>Opportunities to explore sports world</div>
          </Link>
          <Link to="/tournaments" className='category'>
            <div><b>Tournaments</b></div>
            <div className='sub-titles'>Enjoy many exciting tournaments</div>
          </Link>
          <Link to="/matches" className='category'>
            <div><b>Matches</b></div>
            <div className='sub-titles'>Watching many thrilling matches</div>
          </Link>
        </div>
        <div className='home-header-right'>
          <div className='support'>
            <FontAwesomeIcon icon={faHeadset} className='support-icon' />
            <span>Support</span>
          </div>
          <Link to={isLogin ? '/account-management' : '#'} className='user-profile'>
            <FontAwesomeIcon icon={faUser} className='user-icon' />
            <span>{isLogin ? userData?.data?.fullName : 'Guest'}</span>
          </Link>
          <div className='log-out'>
            {isLogin ?
              <FontAwesomeIcon icon={faRightFromBracket} className='log-out-icon' onClick={(event) => handleLogout()} /> :
              <FontAwesomeIcon icon={faRightToBracket} className='log-out-icon' onClick={(event) => handleLogin()} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;
