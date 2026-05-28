import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { faBars, faHeadset, faUser, faRightFromBracket, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import './TopNavBar.scss'
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

//import api
import { getUser } from '../../services/AuthService';


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
      const data = await getUser('2c2996d3-e841-4a21-a5ed-96e73f09f514');
      setUserData(data);
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
          <div className='header-logo'></div>
        </div>
        <div className='home-header-center'>
          <div className='category'>
            <div><b>Sports</b></div>
            <div className='sub-titles'>Opportunities to explore sports world</div>
          </div>
          <div className='category'>
            <div><b>Tournaments</b></div>
            <div className='sub-titles'>Enjoy many exciting tournaments</div>
          </div>
          <div className='category'>
            <div><b>Matches</b></div>
            <div className='sub-titles'>Watching many thrilling matches</div>
          </div>
        </div>
        <div className='home-header-right'>
          <div className='support'>
            <FontAwesomeIcon icon={faHeadset} className='support-icon' />
            <span>Support</span>
          </div>
          <div className='user-profile'>
            <FontAwesomeIcon icon={faUser} className='user-icon' />
            <span>{isLogin ? userData?.data?.fullName : 'Guest'}</span>
          </div>
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
