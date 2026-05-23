import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabaseClient'

const getOAuthError = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return (
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error')
  )
}

const OAuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const finishLogin = async () => {
      const oauthError = getOAuthError()

      if (oauthError) {
        navigate(`/login?error_description=${encodeURIComponent(oauthError)}`, { replace: true })
        return
      }

      const code = new URLSearchParams(window.location.search).get('code')
      const { data, error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.getSession()

      if (error || !data.session) {
        navigate('/login?error_description=Unable%20to%20complete%20sign%20in', { replace: true })
        return
      }

      navigate('/', { replace: true })
    }

    finishLogin()
  }, [navigate])

  return <div>Signing you in...</div>
}

export default OAuthCallbackPage
