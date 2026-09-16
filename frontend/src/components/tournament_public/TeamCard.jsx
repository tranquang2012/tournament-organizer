import { useState } from 'react'

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'

const TeamCard = ({ team }) => {
    const [isShowMember, setIsShowMember] = useState(false)

    return (
        <div className='w-full flex flex-col rounded-[5px] border border-[#123836]/20 shadow-sm text-[13px] md:text-[18px]'>
            <div className='text-center py-[1%] font-semibold bg-[#123836] text-white rounded-t-[5px]'>{team.name}</div>
            <div className='flex w-full items-center justify-center py-[5%] border-b border-[#123836]/20'>
                <img src={team.logo || logo1} className='h-20 w-20 md:h-25 md:w-25 object-contain' />
            </div>
            <div className='flex flex-col py-[1%] px-[5%]'>
                <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isShowMember ? 'max-h-[500px]' : 'max-h-0'}`}>
                    {team.members.map((member, index) => {
                        return (
                            <div key={index} className='flex flex-col'>
                                <span className='text-[13px] md:text-[16px]'> {typeof member === 'string' ? member : member.name} ({member.experience})</span>
                            </div>
                        )
                    })}
                </div>
                <span
                    className='text-[13px] md:text-[16px] text-center cursor-pointer text-[#123836] hover:text-[#123836]/50 hover:underline'
                    onClick={() => setIsShowMember(!isShowMember)}
                >
                    {isShowMember ? 'Hide' : 'View'}
                </span>
            </div>
        </div>
    )
}

export default TeamCard;
