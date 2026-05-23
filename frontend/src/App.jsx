import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
// import './App.css'


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
    <>
      <div className = "app-container">
        Home Page
      </div>
    </>
  )
}

export default App;
