import './Login.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js'


const Login = (props) => {

  const handleLogin = (provider) => {
    const supabase = createClient('https://fcllhdeiknlthwqpafiy.supabase.co', 'sb_publishable_RXp-v2R5nmE7SCyygiGHHw_XlWXHcKR')
    //---cut---
    if (provider === "Google") {
      supabase.auth.signInWithOAuth({
        provider: 'google',
      })
    } else {
      supabase.auth.signInWithOAuth({
        provider: 'facebook',
      })
    }
  };


  return (
    <div>
      <div className="login-container">
        <div className="login-background"></div>
        <div className="login-content flex flex-col">
          <h2 className='title'>Sign In</h2>
          <label className='login-title'>Sign In with Google/Facebook</label>
          <div className='social-login'>
            <FontAwesomeIcon icon={faGoogle} size="2x" className='social-icon-gg' onClick={(event) => handleLogin("Google")} />
            <FontAwesomeIcon icon={faFacebook} size="2x" className='social-icon-fa' onClick={(event) => handleLogin("Facebook")} />
          </div>
          <div className='back-home'>
            <a>Don't want to sign in? </a>
            <Link to="/" className='back-home-link'>
              Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
