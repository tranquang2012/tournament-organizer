import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, Link } from 'react-router-dom';
import { faBars, faHeadset, faUser, faRightFromBracket, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { faSpinner, faUsersGear } from '@fortawesome/free-solid-svg-icons'
import './TopNavBar.scss'
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';


const TopNavBar = () => {

  const navigate = useNavigate()
  const { isLogin, profile: userData } = useAuth()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = `${window.location.origin}/login`;
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  const handleLogin = () => {
    navigate(`/login`)
  }

  return (
    <div className='home-header-container'>
      <div className='home-header-content'>
        <div className='home-header-left'>
          <FontAwesomeIcon icon={faBars} className='menu' />
          <div className='header-logo' onClick={() => navigate('/')}></div>
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
          <div className='support hover:bg-gray-300 rounded-[5px] p-1'>
            <FontAwesomeIcon icon={faHeadset} className='support-icon' />
            <span>Support</span>
          </div>
          <div className='user-profile cursor-pointer hover:bg-gray-300 rounded-[5px] p-1' onClick={() => navigate('/account-management')}>
            <FontAwesomeIcon icon={faUser} className='user-icon' />
            <span>{isLogin ? userData?.fullName : 'Guest'}</span>
          </div>
          <div className='log-out hover:bg-gray-300 rounded-[5px] p-1'>
            {isLogin ?
              <FontAwesomeIcon icon={faRightFromBracket} className='log-out-icon' onClick={handleLogout} /> :
              <FontAwesomeIcon icon={faRightToBracket} className='log-out-icon' onClick={handleLogin} />
            }
            {/* <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;
