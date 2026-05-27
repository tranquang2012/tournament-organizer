import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { faBars, faHeadset, faUser, faRightFromBracket, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import './TopNavBar.scss'
import { useState, useEffect } from 'react';

import { supabase } from '../../config/supabaseClient';



const TopNavBar = (props) => {

  const navigate = useNavigate()
  const [data, setData] = useState(null);
  const [isLogin, setIsLogin] = useState(true)

  const handleLogout = () => {
    setIsLogin(false)
  }

  const handleLogin = () =>{
    navigate(`/login`)
  }
  

  useEffect(() => {

  }, []);

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
            <span>{isLogin ? 'Admin1' : 'Guest'}</span>
          </div>
          <div className='log-out'>
            {isLogin ?
              <FontAwesomeIcon icon={faRightFromBracket} className='log-out-icon' onClick={(event) => handleLogout()}/> :
              <FontAwesomeIcon icon={faRightToBracket} className='log-out-icon' onClick={(event) => handleLogin()}/>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavBar;
