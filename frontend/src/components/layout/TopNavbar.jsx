import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, Link } from 'react-router-dom';
import { faBars, faHeadset, faUser, faRightFromBracket, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react'
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import PublicSidebar from './PublicSideBar';
import logo from '../../assets/logo.png'


const TopNavBar = () => {
  const navigate = useNavigate()
  const { isLogin, profile: userData } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = `${window.location.origin}/login`;
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  const handleLogin = () => navigate('/login')

  return (
    <div className='sticky top-0 bg-white h-[80px] w-full px-[3%] flex items-center z-50'>
      <div className='w-full h-full flex font-[Poppins,sans-serif]'>
        <div className='flex items-center w-[25%] md:w-[25%]'>
          <FontAwesomeIcon
            icon={faBars}
            className='text-[30px] mr-[7%] cursor-pointer'
            onClick={() => setSidebarOpen(true)}
          />
          <img
            src={logo}
            alt="logo"
            className='md:w-[50%] max-h-[80px] object-contain cursor-pointer'
            onClick={() => navigate('/')}
          />
        </div>
        <div className='hidden md:flex w-[50%] justify-between items-center'>
          <Link to="/" className='text-[18px] text-[#123826] no-underline'>
            <div><b>Sports</b></div>
            <div className='font-medium text-[12px]'>Opportunities to explore sports world</div>
          </Link>
          <Link to="/tournaments" className='text-[18px] text-[#123826] no-underline'>
            <div><b>Tournaments</b></div>
            <div className='font-medium text-[12px]'>Enjoy many exciting tournaments</div>
          </Link>
          <Link to="/matches" className='text-[18px] text-[#123826] no-underline'>
            <div><b>Matches</b></div>
            <div className='font-medium text-[12px]'>Watching many thrilling matches</div>
          </Link>
        </div>
        <div className='hidden md:flex w-[25%] justify-end items-center'>
          <div className='flex items-center justify-center mx-[15%] cursor-pointer hover:bg-gray-300 rounded-[5px] p-1'>
            <FontAwesomeIcon icon={faHeadset} className='text-[28px]' />
            <span className='text-[12px] text-[#123826] ml-1'>Support</span>
          </div>

          <div
            className='flex flex-col items-center w-[26%] cursor-pointer hover:bg-gray-300 rounded-[5px] p-1'
            onClick={() => navigate('/account-management')}
          >
            <FontAwesomeIcon icon={faUser} className='text-[28px]' />
            <span className='text-[12px] text-[#123826]'>{isLogin ? userData?.fullName : 'Guest'}</span>
          </div>

          <div className='hover:bg-gray-300 rounded-[5px] p-1'>
            {isLogin ?
              (
                <div className='flex flex-col items-center w-full cursor-pointer hover:bg-gray-300 rounded-[5px] p-1 cursor-pointer' onClick={handleLogout}>
                  <FontAwesomeIcon icon={faRightFromBracket} className='text-[28px]' />
                  <span className='text-[12px] text-[#123826]'>Sign Out</span>
                </div>
              )
              :
              (
                <div className='flex flex-col items-center w-full cursor-pointer hover:bg-gray-300 rounded-[5px] p-1 cursor-pointer' onClick={handleLogin}>
                  <FontAwesomeIcon icon={faRightToBracket} className='text-[28px]' />
                  <span className='text-[12px] text-[#123826]'>Sign In</span>
                </div>
              )
            }
          </div>
        </div>
      </div>
      <PublicSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};

export default TopNavBar;