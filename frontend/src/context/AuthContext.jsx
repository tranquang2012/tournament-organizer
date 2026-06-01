import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabaseClient'
import { getCurrentUserProfile, normalizeRole } from '../services/AuthService'
import { AuthContext } from './authContext'

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfileForSession = useCallback(async (currentSession) => {
    if (!currentSession?.access_token) {
      setProfile(null)
      return null
    }

    setProfileLoading(true)

    try {
      const response = await getCurrentUserProfile(currentSession.access_token)
      const currentProfile = response.data
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
        if (mounted) {
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

      if (!nextSession) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        await loadProfileForSession(nextSession)
      } catch (error) {
        console.error('Failed to refresh user profile:', error.message)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfileForSession, refreshProfile])

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
      refreshProfile,
    }),
    [session, profile, role, loading, profileLoading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
