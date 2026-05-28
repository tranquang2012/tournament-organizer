import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { faBars, faHeadset, faUser, faRightFromBracket, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
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
            <span>{isLogin ? userData?.fullName : 'Guest'}</span>
          </div>
          <div className='log-out'>
            {isLogin ?
              <FontAwesomeIcon icon={faRightFromBracket} className='log-out-icon' onClick={handleLogout} /> :
              <FontAwesomeIcon icon={faRightToBracket} className='log-out-icon' onClick={handleLogin} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;
