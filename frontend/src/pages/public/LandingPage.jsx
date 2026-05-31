import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const LandingPage = () => {
  const { isAdmin, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-semibold text-slate-800 mb-2">Landing</h1>
      <p className="text-base text-slate-400">Landing page placeholder</p>
    </div>
  )
}

export default LandingPage