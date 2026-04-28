'use client'

import { useState } from 'react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface Appointment {
  title: string
  doctor: string
  time: string
  onJoin?: () => void
}

interface AppointmentsWidgetProps {
  appointments?: Appointment[]
  onViewAll?: () => void
}

const DEFAULT_APPOINTMENTS: Appointment[] = [
  { title: 'MRI-Right thing',      doctor: 'Dr. Damian Lewis',    time: '08:00 PM' },
  { title: 'Surgery preparation',  doctor: 'Dr. Dianne Russell',  time: '08:00 PM' },
]

function CalendarStrip() {
  const today = new Date()
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(today.getDate())

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + offset + i)
    return d
  })

  return (
    <div>
      <div className="calendar-nav">
        <button
          className="calendar-nav-button"
          onClick={() => setOffset(o => o - 7)}
          aria-label="Previous week"
        >
          <i className="fas fa-chevron-left" />
        </button>

        <div className="calendar-grid" style={{ flex: 1 }}>
          {days.map((d, i) => {
            const isToday   = d.toDateString() === today.toDateString()
            const isSelected = d.getDate() === selected && d.getMonth() === today.getMonth() + (offset < 0 ? -1 : 0)
            return (
              <button
                key={i}
                className={`calendar-day${isSelected ? ' active' : isToday ? ' today' : ''}`}
                onClick={() => setSelected(d.getDate())}
              >
                <span style={{ fontWeight: 700, fontSize: '0.75rem', display: 'block' }}>
                  {String(d.getDate()).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '0.5625rem', opacity: 0.75, display: 'block' }}>
                  {DAY_NAMES[d.getDay()]}
                </span>
              </button>
            )
          })}
        </div>

        <button
          className="calendar-nav-button"
          onClick={() => setOffset(o => o + 7)}
          aria-label="Next week"
        >
          <i className="fas fa-chevron-right" />
        </button>
      </div>
    </div>
  )
}

export function AppointmentsWidget({
  appointments = DEFAULT_APPOINTMENTS,
  onViewAll,
}: AppointmentsWidgetProps) {
  return (
    <div className="right-panel-section">
      <div className="right-panel-header">
        <h3 className="right-panel-title">Upcoming Appointments</h3>
        <button className="right-panel-action" onClick={onViewAll} aria-label="View all">
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      <CalendarStrip />

      <div className="appointments-list">
        {appointments.map((appt, i) => (
          <div key={i} className="appointment-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--foreground)' }}>
                {appt.title}
              </h4>
              <button className="appointment-btn" onClick={appt.onJoin}>
                Join Now
              </button>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
              {appt.doctor}
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <i className="fas fa-clock" style={{ fontSize: '0.625rem' }} />
              {appt.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
