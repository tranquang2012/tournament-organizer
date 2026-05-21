import './Login.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle } from '@fortawesome/free-brands-svg-icons';

const Login = (props) => {
  return (
    <div>
      <div className="login-container">
        <div className="login-background"></div>
        <div className="login-content">
          <h2 className='title'>Sign In</h2>
          <label>Sign In with Google/Facebook</label>
          <div className='social-login'>
            <FontAwesomeIcon icon={faGoogle} size="2x" className='social-icon' />
            <FontAwesomeIcon icon={faFacebook} size="2x" className='social-icon' />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
