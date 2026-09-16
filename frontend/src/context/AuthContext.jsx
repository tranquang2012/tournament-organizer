import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { getCurrentUserProfile, isDisabledAccountError, normalizeRole } from '../services/AuthService'
import { AuthContext } from './authContext'

const disabledAccountLoginPath = '/login?error_description=Your%20account%20has%20been%20disabled'

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [loginRedirectPath, setLoginRedirectPath] = useState(null)

  const clearLoginRedirectPath = useCallback(() => {
    setLoginRedirectPath(null)
  }, [])

  const redirectDisabledAccount = useCallback(() => {
    setLoginRedirectPath(disabledAccountLoginPath)
    navigate(disabledAccountLoginPath, { replace: true })
    setSession(null)
    setProfile(null)
    setLoading(false)
    setProfileLoading(false)

    void supabase.auth.signOut({ scope: 'local' }).catch((signOutError) => {
      console.error('Failed to clear disabled account session:', signOutError.message)
    })
  }, [navigate])

  const loadProfileForSession = useCallback(async (currentSession) => {
    if (!currentSession?.access_token) {
      setProfile(null)
      return null
    }

    setProfileLoading(true)

    try {
      const response = await getCurrentUserProfile(currentSession.access_token)
      const currentProfile = response.data
      setLoginRedirectPath(null)
      setProfile(currentProfile)
      return currentProfile
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: sessionData, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    const currentSession = sessionData.session
    setSession(currentSession)

    return loadProfileForSession(currentSession)
  }, [loadProfileForSession])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        await refreshProfile()
      } catch (error) {
        console.error('Failed to initialize auth:', error.message)
        const isDisabledAccount = isDisabledAccountError(error)

        if (isDisabledAccount) {
          redirectDisabledAccount(error)
        }

        if (mounted) {
          if (isDisabledAccount) {
            setSession(null)
          }

          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (window.location.pathname === '/oauth/callback') {
        setLoading(false)
        return
      }

      if (!nextSession) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        await loadProfileForSession(nextSession)
      } catch (error) {
        console.error('Failed to refresh user profile:', error.message)
        if (isDisabledAccountError(error)) {
          redirectDisabledAccount(error)
          return
        }

        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfileForSession, refreshProfile, redirectDisabledAccount])

  const role = normalizeRole(profile?.role)

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      role,
      loading,
      profileLoading,
      accessToken: session?.access_token,
      isLogin: Boolean(session),
      isUser: role === 'USER',
      isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
      isSuperAdmin: role === 'SUPER_ADMIN',
      loginRedirectPath,
      clearLoginRedirectPath,
      refreshProfile,
    }),
    [session, profile, role, loading, profileLoading, loginRedirectPath, clearLoginRedirectPath, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
