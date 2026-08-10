import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import { useState } from 'react'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dayjsLocalizer(dayjs)

const tournamentColors = {
    'Ping-pong tournament 1': '#ef4444',
    'Football tournament 1': '#3b82f6',
    'Valorant tournament 1': '#eab308',
    'Badminton tournament 1': '#8b5cf6',
}

const getColor = (title) => {
    const match = Object.keys(tournamentColors).find(k => title.includes(k))
    return match ? tournamentColors[match] : '#123836'
}

const mockEvents = [
    { id: 1, title: 'Match 4 (Ping-pong tournament 1)', start: new Date(2026, 4, 24, 2, 0), end: new Date(2026, 4, 24, 2, 30) },
    { id: 2, title: 'Match 15 (Football tournament 1)', start: new Date(2026, 4, 24, 9, 0), end: new Date(2026, 4, 24, 10, 0) },
    { id: 3, title: 'Match 13 (Valorant tournament 1)', start: new Date(2026, 4, 24, 9, 30), end: new Date(2026, 4, 24, 11, 30) },
    { id: 4, title: 'Match 12 (Badminton tournament 1)', start: new Date(2026, 4, 24, 15, 0), end: new Date(2026, 4, 24, 16, 0) },
    { id: 5, title: 'Match 14 (Valorant tournament 1)', start: new Date(2026, 4, 24, 18, 0), end: new Date(2026, 4, 24, 19, 30) },
]

const EventComponent = ({ event }) => (
    <div>
        <div style={{ fontSize: '11px', opacity: 0.8 }}>
            {dayjs(event.start).format('h:mm A')} – {dayjs(event.end).format('h:mm A')}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
            {event.title}
        </div>
    </div>
)

const CalendarPage = () => {
    const [currentView, setCurrentView] = useState('day')
    const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 24))

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

                    /* Hover ô ngày trong month view */
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

                <Calendar
                    localizer={localizer}
                    events={mockEvents}
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
                            backgroundColor: getColor(event.title),
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
            </div>
        </div>
    )
}

export default CalendarPage