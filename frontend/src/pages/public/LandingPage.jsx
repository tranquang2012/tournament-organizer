import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEffect, useState } from 'react'

//import component
import LandingBanner from '../../components/layout/LandingBanner'

const LandingPage = () => {
  const { isAdmin, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <div>
      <LandingBanner />
    </div>
  )
}

export default LandingPage