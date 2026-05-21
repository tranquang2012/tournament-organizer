import './Login.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons';

const Login = (props) => {

  const handleLogin = (provider) => {
    // Implement login logic here, e.g., redirect to OAuth provider
    alert(`Logging in with ${provider}`);
  }

  return (
    <div>
      <div className="login-container">
        <div className="login-background"></div>
        <div className="login-content flex flex-col">
          <h2 className='title'>Sign In</h2>
          <label className='login-title'>Sign In with Google/Facebook</label>
          <div className='social-login'>
            <FontAwesomeIcon icon={faGoogle} size="2x" className='social-icon-gg' onClick={(event) => handleLogin("Google")}/>
            <FontAwesomeIcon icon={faFacebook} size="2x" className='social-icon-fa' onClick={(event) => handleLogin("Facebook")}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
