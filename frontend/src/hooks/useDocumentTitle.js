import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { allSports } from '../constants/sports'

const suffix = ' | Netcompany'

const labelFor = (pathname) => {
  if (pathname === '/') return 'Home'
  if (pathname.startsWith('/login')) return 'Sign In'
  if (pathname.startsWith('/calendar')) return 'Calendar'
  if (pathname.startsWith('/account-management')) return 'Account'

  const sport = allSports.find((s) => s.path === pathname)
  if (sport) return sport.name
  if (pathname.startsWith('/sports/')) return 'Sports'
  if (pathname.startsWith('/tournaments/')) return 'Tournament'
  if (pathname.startsWith('/matches/')) return 'Match'

  if (pathname.startsWith('/admin/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/admin/tournaments/create')) return 'Create Tournament'
  if (pathname.startsWith('/admin/tournaments/list')) return 'Tournaments'
  if (pathname.startsWith('/admin/accounts')) return 'Accounts'
  if (/^\/admin\/tournaments\/[^/]+\/stat-templates/.test(pathname)) return 'Stat Templates'
  if (/^\/admin\/tournaments\/[^/]+\/matches/.test(pathname)) return 'Match Config'
  if (/^\/admin\/tournaments\/[^/]+\/edit/.test(pathname)) return 'Edit Tournament'

  return 'Home'
}

export const useDocumentTitle = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = `${labelFor(pathname)}${suffix}`
  }, [pathname])
}
