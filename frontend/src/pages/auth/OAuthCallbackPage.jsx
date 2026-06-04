import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabaseClient'
import {
  getAuthErrorMessage,
  getCurrentUserProfile,
  isDisabledAccountError,
  normalizeRole,
} from '../../services/AuthService'

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

      try {
        const profileResponse = await getCurrentUserProfile(data.session.access_token)
        const role = normalizeRole(profileResponse.data?.role)

        navigate(role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/', {
          replace: true,
        })
      } catch (profileError) {
        if (isDisabledAccountError(profileError)) {
          console.log(getAuthErrorMessage(profileError))
          await supabase.auth.signOut()
          navigate('/login', { replace: true })
          return
        }

        console.error('Failed to load profile after login:', profileError.message)
        navigate('/', { replace: true })
      }
    }

    finishLogin()
  }, [navigate])

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Signing you in...</p>
    </div>
  )
}

export default OAuthCallbackPage
