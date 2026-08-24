import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { getScheduledMatches } from '../../services/CalendarService'

const localizer = dayjsLocalizer(dayjs)

const TOURNAMENT_PALETTE = [
    '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#22c55e',
    '#f97316', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e',
]

const EventComponent = ({ event }) => (
    <div>
        <div style={{ fontSize: '11px', opacity: 0.8 }}>
            {dayjs(event.start).format('h:mm A')} – {dayjs(event.end).format('h:mm A')}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
            {event.title}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '1px' }}>
            {event.tournamentName}
        </div>
    </div>
)

const CalendarPage = () => {
    const [currentView, setCurrentView] = useState('day')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [tournamentColorMap, setTournamentColorMap] = useState({})

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getScheduledMatches()

                // Build a color map per tournament
                const uniqueTournaments = [...new Set(data.map(m => m.tour_name))]
                const colorMap = {}
                uniqueTournaments.forEach((name, i) => {
                    colorMap[name] = TOURNAMENT_PALETTE[i % TOURNAMENT_PALETTE.length]
                })
                setTournamentColorMap(colorMap)

                // Transform into react-big-calendar events
                const calendarEvents = data.map(m => ({
                    id: m.match_id,
                    title: m.title,
                    start: new Date(m.scheduled_start),
                    end: new Date(m.scheduled_end),
                    tournamentName: m.tour_name,
                    tourId: m.tour_id,
                    status: m.status,
                    matchLabel: m.matchLabel,
                }))

                setEvents(calendarEvents)

                // Navigate to the nearest upcoming event, or most recent past event
                if (calendarEvents.length > 0) {
                    const now = new Date()
                    const upcoming = calendarEvents.filter(e => e.start >= now)
                    if (upcoming.length > 0) {
                        setCurrentDate(upcoming[0].start)
                    } else {
                        setCurrentDate(calendarEvents[calendarEvents.length - 1].start)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch calendar data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const getColor = (event) => {
        return tournamentColorMap[event.tournamentName] || '#123836'
    }

    return (
        <div className='flex flex-col'>
            <div className='bg-[#123836] text-white px-8 py-5'>
                <span className='text-[22px] font-semibold'>Tournament Calendar</span>
            </div>

            <div className='p-8' style={{ height: '90vh' }}>
                <style>{`
                    .rbc-toolbar { margin-bottom: 20px; }
                    .rbc-toolbar button {
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        padding: 5px 14px;
                        font-size: 14px;
                        color: #374151;
                        background: white;
                        cursor: pointer;
                    }
                    .rbc-toolbar button:hover { background: #f3f4f6; }
                    .rbc-toolbar button.rbc-active {
                        background: #123836 !important;
                        color: white !important;
                        border-color: #123836 !important;
                    }
                    .rbc-toolbar-label {
                        font-size: 18px;
                        font-weight: 600;
                        color: #111827;
                    }
                    .rbc-time-header { display: none; }
                    .rbc-time-gutter .rbc-timeslot-group { border: none; }
                    .rbc-time-slot .rbc-label { font-size: 12px; color: #9ca3af; }
                    .rbc-time-content { border-top: 1px solid #e5e7eb; }
                    .rbc-timeslot-group { border-bottom: 1px solid #f3f4f6; min-height: 50px; }
                    .rbc-day-slot .rbc-time-slot { border-top: none; }
                    .rbc-day-slot .rbc-events-container { margin-right: 10px; }
                    .rbc-event {
                        border-radius: 6px !important;
                        border: none !important;
                        padding: 3px 8px !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                    }
                    .rbc-event-label { display: none; }
                    .rbc-today { background: #f0fdf4 !important; }

                    /* Hover on day cells in month view */
                    .rbc-month-row .rbc-day-bg {
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .rbc-month-row .rbc-day-bg:hover {
                        background: #e6f0ee !important;
                    }
                    .rbc-date-cell {
                        cursor: pointer;
                    }
                `}</style>

                {loading ? (
                    <div className="flex items-center justify-center" style={{ height: '70vh' }}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
                            <p className="text-sm font-medium text-slate-400">Loading calendar…</p>
                        </div>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        view={currentView}
                        date={currentDate}
                        views={['month', 'day']}
                        onView={(view) => setCurrentView(view)}
                        onNavigate={(date) => setCurrentDate(date)}
                        onDrillDown={(date) => {
                            setCurrentDate(date)
                            setCurrentView('day')
                        }}
                        selectable={true}
                        onSelectSlot={(slot) => {
                            setCurrentDate(slot.start)
                            setCurrentView('day')
                        }}
                        dayLayoutAlgorithm='no-overlap'
                        eventPropGetter={(event) => ({
                            style: {
                                backgroundColor: getColor(event),
                                opacity: 0.9,
                            }
                        })}
                        components={{
                            event: EventComponent
                        }}
                        onSelectEvent={(event) => console.log('Clicked:', event.title)}
                        formats={{
                            timeGutterFormat: (date, culture, loc) =>
                                loc.format(date, 'h A', culture),
                            dayHeaderFormat: (date, culture, loc) =>
                                loc.format(date, 'dddd, MMMM D YYYY', culture),
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default CalendarPage