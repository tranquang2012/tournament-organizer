import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import loginBackground from "../../assets/loginbackground.png";
import logowhite from "../../assets/logowhite.png";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearLoginRedirectPath } = useAuth();
  const loginError = searchParams.get('error_description') || searchParams.get('error');

  useEffect(() => {
    clearLoginRedirectPath?.();
  }, [clearLoginRedirectPath]);

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
    <div className="p-0 m-0">
      <div className="flex min-h-screen flex-col items-center justify-center md:flex-row bg-gradient-to-b from-[#123836] via-[#123836] to-[#123836] md:bg-none">
        <div
          className="hidden md:block md:w-[65%] h-screen bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${loginBackground}')` }}
        />
        <div className="flex flex-col w-full md:w-[35%] items-center justify-center px-6 py-10 md:p-5">
          <img
            src={logowhite}
            alt="Netcompany"
            className="w-full mb-8 md:hidden"
          />
          <span className="font-sans font-bold text-center mb-4 md:mb-5
                          text-[42px] text-white
                          md:text-[53px] md:text-[#123826]">
            Sign In
          </span>
          <label className="font-sans text-center mb-5
                             text-base text-white/90
                             md:text-xl md:text-[#123826]">
            Sign In with Google/Facebook
          </label>
          <div className="flex items-center gap-6 mt-2 mb-3 md:gap-5 md:mt-5">
            <button
              onClick={() => handleLogin("Google")}
              aria-label="Sign in with Google"
              className="flex items-center justify-center rounded-full bg-white shadow-lg
                         w-14 h-14 transition-transform duration-200
                         hover:scale-110 hover:shadow-red-400/50
                         md:bg-transparent md:shadow-none md:w-auto md:h-auto md:rounded-none md:hover:scale-100"
            >
              <FontAwesomeIcon
                icon={faGoogle}
                className="text-red-500 text-2xl md:text-[50px] md:hover:[text-shadow:0_0_10px_rgba(255,0,0,0.5)]"
              />
            </button>
            <button
              onClick={() => handleLogin("Facebook")}
              aria-label="Sign in with Facebook"
              className="flex items-center justify-center rounded-full bg-white shadow-lg
                         w-14 h-14 transition-transform duration-200
                         hover:scale-110 hover:shadow-blue-400/50
                         md:bg-transparent md:shadow-none md:w-auto md:h-auto md:rounded-none md:hover:scale-100"
            >
              <FontAwesomeIcon
                icon={faFacebook}
                className="text-blue-600 text-2xl md:text-[50px] md:hover:[text-shadow:0_0_10px_rgba(0,0,255,0.5)]"
              />
            </button>
          </div>
          {loginError && (
            <p className="max-w-[320px] px-4 py-3 rounded-md text-sm text-center mb-4
                           bg-white/95 border border-red-300 text-red-600 shadow-md">
              {loginError}
            </p>
          )}
          <div className="mt-8 text-center md:mt-8">
            <a className="font-sans text-sm text-white/80 md:text-xl md:text-[#123826]">
              Don't want to sign in?{' '}
            </a>
            <Link
              to="/"
              className="font-sans text-sm underline underline-offset-2 text-white
                         md:no-underline md:text-xl md:text-[rgb(17,17,202)] md:opacity-70
                         md:hover:underline md:hover:opacity-100 md:hover:text-blue-600"
            >
              Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;