import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEffect, useState } from 'react'

//import component
import LandingBanner from '../../components/layout/LandingBanner'

//import sport data from shared constants
import { commonSports, eSports } from '../../constants/sports'


const LandingPage = () => {
  const { isAdmin, loading, profileLoading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <div>
      <LandingBanner />
      <div className='h-200px md:h-[30vh] px-[10%] flex flex-col justify-center text-[#123836] text-l md:text-2xl font-semibold'>
        <span >Common Sports</span>
        <div className='mt-5 flex justify-between w-full'>
          {commonSports.map((sport, index) => (
            <div key={index} className='flex flex-col items-center hover:scale-120 p-4 transition-colors cursor-pointer w-[15%]'
              onClick={() => navigate(sport.path)}>
              <img src={sport.icon} alt={sport.name} className='w-16 h-16 object-contain' />
              <span className='mt-2 text-sm md:text-normal'>{sport.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='h-200px md:h-[30vh] px-[10%] bg-[#f6f6f6] flex flex-col justify-center text-[#123836] text-l md:text-2xl font-semibold'>
        <span> E-Sports</span>
        <div className='mt-5 flex justify-between w-full'>
          {eSports.map((sport, index) => (
            <div key={index} className='flex flex-col items-center hover:scale-120 p-4 transition-colors cursor-pointer w-[15%]'
              onClick={() => navigate(sport.path)}>
              <img src={sport.icon} alt={sport.name} className='w-16 h-16 object-contain' />
              <span className='mt-2 text-sm md:text-normal'>{sport.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingPage