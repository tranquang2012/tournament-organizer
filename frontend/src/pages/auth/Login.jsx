import './Login.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient'


const Login = (props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginError = searchParams.get('error_description') || searchParams.get('error');

  const handleLogin = async (provider) => {
    const oauthProvider = provider === "Google" ? 'google' : 'facebook';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: oauthProvider,
      options: {
        redirectTo: `${window.location.origin}/oauth/callback`,
        queryParams: oauthProvider === 'google'
          ? { prompt: 'select_account' }
          : undefined,
      },
    })

    if (error) {
      navigate(`/login?error_description=${encodeURIComponent(error.message)}`, { replace: true })
    }
  };

  return (
    <div>
      <div className="login-container">
        <div className="login-background" ></div>
        <div className="login-content flex flex-col">
          <h2 className='title'>Sign In</h2>

          <label className='login-title'>Sign In with Google/Facebook</label>
          <div className='social-login mb-3'>
            <FontAwesomeIcon icon={faGoogle} size="2x" className='social-icon-gg' onClick={(event) => handleLogin("Google")} />
            <FontAwesomeIcon icon={faFacebook} size="2x" className='social-icon-fa' onClick={(event) => handleLogin("Facebook")} />
          </div>
          {loginError && (
            <p className='bg-red-50 border border-red-300 text-red-600 px-5 py-2 rounded-md mb-4'>
              {loginError}
            </p>
          )}
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
