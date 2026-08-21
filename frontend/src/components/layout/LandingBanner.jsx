import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import banner1 from '../../assets/bannerImages/banner1.jpg'
import banner2 from '../../assets/bannerImages/banner2.jpg'
import banner3 from '../../assets/bannerImages/banner3.jpg'
import banner4 from '../../assets/bannerImages/banner4.jpg'
import { getPublicTournaments } from '../../services/TournamentService'

const PLACEHOLDER_SLIDES = [
    { src: banner1 },
    { src: banner2 },
    { src: banner3 },
    { src: banner4 },
]

const getStatus = (t) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = t.tour_startdate ? new Date(t.tour_startdate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = t.tour_enddate ? new Date(t.tour_enddate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    if (t.tour_status === 'completed') return 'Ended';
    if (start && start > now) return 'Upcoming';
    if (end && end < now) return 'Ended';
    if (start && (!end || end >= now)) return 'Ongoing';
    return 'Upcoming';
}

const toSlides = (tournaments) =>
    tournaments
        .map((t) => ({
            id: t.tour_id,
            src: t.tour_banner || t.sport_banner,
            name: t.tour_name,
        }))
        .filter((s) => s.src)

const pickSlides = (tournaments) => {
    const current = tournaments
        .filter((t) => {
            const status = getStatus(t)
            return status === 'Upcoming' || status === 'Ongoing'
        })
        .sort((a, b) => new Date(a.tour_startdate) - new Date(b.tour_startdate))
        .slice(0, 5)

    const currentSlides = toSlides(current)
    if (currentSlides.length) return currentSlides

    const ended = tournaments
        .filter((t) => getStatus(t) === 'Ended')
        .sort((a, b) => new Date(b.tour_enddate || 0) - new Date(a.tour_enddate || 0))
        .slice(0, 1)

    return toSlides(ended)
}

const LandingBanner = () => {
    const navigate = useNavigate()
    const [slides, setSlides] = useState(PLACEHOLDER_SLIDES)
    const [currentBanner, setCurrentBanner] = useState(0)

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await getPublicTournaments()
                const tournaments = res.data || res || []
                const picked = pickSlides(tournaments)
                if (picked.length) setSlides(picked)
            } catch (err) {
                console.error('Failed to fetch carousel tournaments:', err)
            }
        }
        fetchBanners()
    }, [])

    useEffect(() => {
        setCurrentBanner(0)
        if (slides.length <= 1) return
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [slides])

    const handlePrev = () => {
        setCurrentBanner(prev => (prev - 1 + slides.length) % slides.length)
    }

    const handleNext = () => {
        setCurrentBanner(prev => (prev + 1) % slides.length)
    }

    const showControls = slides.length > 1

    return (
        <div className='relative w-full overflow-hidden h-[400px] md:h-[50vh] bg-[#123836]'>
            {showControls && (
                <button
                    onClick={handlePrev}
                    className='absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 cursor-pointer bg-white/30 hover:bg-white/60 rounded-full flex items-center justify-center transition-all'
                >
                    <FontAwesomeIcon icon={faChevronLeft} className='text-white text-[18px]' />
                </button>
            )}
            <div className='flex transition-transform duration-700 ease-in-out h-full w-full'
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <img
                        key={slide.id || index}
                        src={slide.src}
                        alt={slide.name || `banner ${index + 1}`}
                        className={`w-full h-full shrink-0 object-contain ${slide.id ? 'cursor-pointer' : ''}`}
                        onClick={() => slide.id && navigate(`/tournaments/${slide.id}`)}
                    />
                ))}
            </div>
            {showControls && (
                <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id || index}
                            onClick={() => setCurrentBanner(index)}
                            className={`h-[7px] rounded-[5px] transition-all duration-300 cursor-pointer ${currentBanner === index ? 'bg-[#123836] w-30' : 'bg-white/50 w-25'}`}
                        />
                    ))}
                </div>
            )}
            {showControls && (
                <button
                    onClick={handleNext}
                    className='absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 cursor-pointer bg-white/30 hover:bg-white/60 rounded-full flex items-center justify-center transition-all'
                >
                    <FontAwesomeIcon icon={faChevronRight} className='text-white text-[18px]' />
                </button>
            )}
        </div>
    )
}

export default LandingBanner
