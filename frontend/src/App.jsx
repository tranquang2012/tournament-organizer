import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'


//import components
import Login from './pages/auth/Login.jsx'

const App = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const oauthError =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error')

    if (oauthError) {
      navigate(`/login?error_description=${encodeURIComponent(oauthError)}`, { replace: true })
    }
  }, [navigate])

  return (
    <div>
    </div>
  )
};

export default App;
