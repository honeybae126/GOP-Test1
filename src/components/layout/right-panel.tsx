'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'

interface RightPanelProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleLabel(role?: string) {
  switch (role) {
    case 'INSURANCE_STAFF': return 'Insurance Staff'
    case 'DOCTOR': return 'Doctor'
    case 'FINANCE': return 'Finance'
    case 'IT_ADMIN': return 'IT Admin'
    default: return role ?? '—'
  }
}

function CalendarWidget() {
  const [today] = useState(new Date())
  const [selected, setSelected] = useState(today.getDate())

  const year  = today.getFullYear()
  const month = today.getMonth()

  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--foreground)' }}>{monthName}</span>
        <i className="fas fa-calendar-alt" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
      </div>
      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 600, color: 'var(--muted-foreground)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={day}
              onClick={() => setSelected(day)}
              className={`calendar-day${day === selected ? ' active' : day === today.getDate() ? ' today' : ''}`}
            >
              {day}
            </button>
          )
        )}
      </div>
    </div>
  )
}

export function RightPanel({ user }: RightPanelProps) {
  const requests = useGopStore(s => s.requests)

  const pendingCount   = requests.filter(r => r.status === 'DRAFT').length
  const submittedCount = requests.filter(r => r.status === 'SUBMITTED').length
  const approvedCount  = requests.filter(r => r.status === 'APPROVED').length

  const role = user.role ?? ''

  return (
    <aside className="right-panel">
      {/* User card */}
      <div className="right-panel-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '9999px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
          }}>
            {getInitials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name ?? 'User'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
              {getRoleLabel(role)}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            { label: 'Draft', value: pendingCount,   color: 'var(--warning)',     icon: 'fas fa-clock' },
            { label: 'Submitted', value: submittedCount, color: 'var(--info)',    icon: 'fas fa-paper-plane' },
            { label: 'Approved', value: approvedCount,  color: 'var(--success)', icon: 'fas fa-check-circle' },
            { label: 'Total', value: requests.length,   color: 'var(--primary)', icon: 'fas fa-file-medical' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.625rem',
              textAlign: 'center',
            }}>
              <i className={stat.icon} style={{ color: stat.color, fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }} />
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="right-panel-section">
        <div className="right-panel-header">
          <span className="right-panel-title">Calendar</span>
        </div>
        <CalendarWidget />
      </div>

      {/* Quick links */}
      <div className="right-panel-section">
        <div className="right-panel-header">
          <span className="right-panel-title">Quick Actions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(role === 'INSURANCE_STAFF' || role === 'IT_ADMIN') && (
            <Link href="/gop/new" style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.625rem 0.875rem', borderRadius: 'var(--radius)',
              background: 'var(--primary)', color: 'white',
              fontSize: 'var(--font-size-sm)', fontWeight: 600,
              textDecoration: 'none', transition: 'background var(--transition-base)',
            }}>
              <i className="fas fa-plus-circle" />
              New GOP Request
            </Link>
          )}
          <Link href="/gop" style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 0.875rem', borderRadius: 'var(--radius)',
            background: 'var(--secondary)', color: 'var(--foreground)',
            fontSize: 'var(--font-size-sm)', fontWeight: 500,
            textDecoration: 'none', transition: 'background var(--transition-base)',
          }}>
            <i className="fas fa-list" style={{ color: 'var(--muted-foreground)' }} />
            View All Requests
          </Link>
          <Link href="/settings" style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 0.875rem', borderRadius: 'var(--radius)',
            background: 'var(--secondary)', color: 'var(--foreground)',
            fontSize: 'var(--font-size-sm)', fontWeight: 500,
            textDecoration: 'none', transition: 'background var(--transition-base)',
          }}>
            <i className="fas fa-cog" style={{ color: 'var(--muted-foreground)' }} />
            Settings
          </Link>
        </div>
      </div>

      {/* System info */}
      <div style={{ padding: 'var(--spacing-lg)', marginTop: 'auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          borderRadius: 'var(--radius)',
          padding: 'var(--spacing-md)',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: '0.375rem' }}>
            <i className="fas fa-shield-alt" />
            Intercare Hospital
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85, lineHeight: 1.5 }}>
            GOP Automation System · Phase 1
          </div>
        </div>
      </div>
    </aside>
  )
}
