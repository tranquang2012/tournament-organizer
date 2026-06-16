import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDay, faCalendarCheck, faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'

const TournamentPage = () => {
  const { state } = useLocation()
  const tournament = state?.tournament

  console.log(tournament)

  return (
    <div>
      <div className='h-[100px] md:h-[320px] w-full overflow-hidden bg-[#123836]/50'>
        <img
          src={tournament?.image}
          alt="banner"
          className='h-full w-full object-contain object-center'
        />
      </div>
      <div className='flex flex-col bg-[#d9d9d9]/50 px-[5%] md:px-[10%] py-[1%] w-full gap-4 md:gap-7 '>
        <div className='text-[#123836] text-[25px] md:text-[36px] font-semibold'>{tournament?.name}</div>
        <div className='flex gap-3 md:gap-20'>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faCalendarDay} className='text-[11px] md:text-[18px] text-[#123836]' />
            <span className='text-[11px] md:text-[18px]'>Start Date: {tournament?.startDate}</span>
          </div>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faCalendarCheck} className='text-[11px] md:text-[18px] text-[#123836]' />
            <span className='text-[11px] md:text-[18px]'>End Date: {tournament?.endDate}</span>
          </div>
          <div className='flex gap-1 items-center'>
            <span className='text-[11px] md:text-[18px]'>Status: </span>
            <span className={`text-[13px] md:text-[18px] ${tournament.status === 'Ongoing' ? 'text-red-500' :
              tournament.status === 'Ended' ? 'text-green-500' : 'text-yellow-500'}`}
            >
              {tournament.status}
            </span>
          </div>
          <div className='flex gap-1 items-center'>
            <FontAwesomeIcon icon={faLocationPin} className='text-[13px] md:text-[18px] text-[#123836]' />
            <span className='text-[13px] md:text-[18px]'>Location: Binh Thanh Stadium</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentPage
