import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

//import component
import LandingBanner from '../../components/layout/LandingBanner'

//import sport data from shared constants
import { commonSports, eSports } from '../../constants/sports'


const LandingPage = () => {
  const { loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <div>
      <LandingBanner />
      <div className='min-h-[200px] md:min-h-[30vh] py-6 px-[5%] md:px-[10%] flex flex-col justify-center text-[#123836] text-lg md:text-2xl font-semibold'>
        <span>Common Sports</span>
        <div className='mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4 w-full'>
          {commonSports.map((sport, index) => (
            <div key={index} className='flex flex-col items-center hover:scale-105 p-2 md:p-4 transition-transform cursor-pointer'
              onClick={() => navigate(sport.path)}>
              <img src={sport.icon} alt={sport.name} className='w-12 h-12 md:w-16 md:h-16 object-contain' />
              <span className='mt-2 text-xs md:text-base text-center'>{sport.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='min-h-[200px] md:min-h-[30vh] py-6 px-[5%] md:px-[10%] bg-[#f6f6f6] flex flex-col justify-center text-[#123836] text-lg md:text-2xl font-semibold'>
        <span>E-Sports</span>
        <div className='mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4 w-full'>
          {eSports.map((sport, index) => (
            <div key={index} className='flex flex-col items-center hover:scale-105 p-2 md:p-4 transition-transform cursor-pointer'
              onClick={() => navigate(sport.path)}>
              <img src={sport.icon} alt={sport.name} className='w-12 h-12 md:w-16 md:h-16 object-contain' />
              <span className='mt-2 text-xs md:text-base text-center'>{sport.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingPage
