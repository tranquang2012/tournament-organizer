import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import banner1 from '../../assets/bannerImages/banner1.jpg'
import banner2 from '../../assets/bannerImages/banner2.jpg'
import banner3 from '../../assets/bannerImages/banner3.jpg'
import banner4 from '../../assets/bannerImages/banner4.jpg'

const banners = [banner1, banner2, banner3, banner4]

const LandingBanner = () => {

    const [currentBanner, setCurrentBanner] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const handlePrev = () => {
        setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)
    }

    const handleNext = () => {
        setCurrentBanner(prev => (prev + 1) % banners.length)
    }

    return (
        <div className='relative w-full overflow-hidden h-[400px] md:h-[50vh] bg-[#123836]'>
            <button
                onClick={handlePrev}
                className='absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 cursor-pointer bg-white/30 hover:bg-white/60 rounded-full flex items-center justify-center transition-all'
            >
                <FontAwesomeIcon icon={faChevronLeft} className='text-white text-[18px]' />
            </button>
            <div className='flex transition-transform duration-700 ease-in-out h-full w-full'
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
                {banners.map((banner, index) => (
                    <img key={index} src={banner} alt={`banner ${index + 1}`} className='w-full h-full shrink-0 object-contain' />
                ))}
            </div>
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentBanner(index)}
                        className={`h-[7px] rounded-[5px] transition-all duration-300 cursor-pointer ${currentBanner === index ? 'bg-[#123836] w-30' : 'bg-white/50 w-25'}`}
                    />
                ))}
            </div>
            <button
                onClick={handleNext}
                className='absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 cursor-pointer bg-white/30 hover:bg-white/60 rounded-full flex items-center justify-center transition-all'
            >
                <FontAwesomeIcon icon={faChevronRight} className='text-white text-[18px]' />
            </button>
        </div>
    )

}

export default LandingBanner