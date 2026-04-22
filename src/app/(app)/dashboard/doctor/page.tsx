'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { getSLAStatus, formatElapsed } from '@/lib/sla-utils'
import type { MockGOPRequest } from '@/lib/mock-data'

function formatCountdown(remainingHours: number): string {
  if (remainingHours <= 0) return 'Overdue'
  const totalMins = Math.round(remainingHours * 60)
  if (totalMins < 60) return `${totalMins}m remaining`
  const h = Math.floor(remainingHours)
  const m = Math.round((remainingHours - h) * 60)
  if (h >= 48) {
    const days = Math.floor(h / 24)
    const hrs  = h % 24
    return hrs > 0 ? `${days}d ${hrs}h remaining` : `${days}d remaining`
  }
  return m > 0 ? `${h}h ${m}m remaining` : `${h}h remaining`
}

function SLABadge({ percentUsed, remainingHours, isOverdue }: { percentUsed: number; remainingHours: number; isOverdue: boolean }) {
  const label = isOverdue ? 'Overdue' : formatCountdown(remainingHours)
  let bg = '#ECFDF5', color = '#065F46', dotBg = '#10B981'
  if (isOverdue) { bg = '#FEF2F2'; color = '#991B1B'; dotBg = '#EF4444' }
  else if (percentUsed >= 80) { bg = '#FEF2F2'; color = '#991B1B'; dotBg = '#EF4444' }
  else if (percentUsed >= 50) { bg = '#FFFBEB'; color = '#92400E'; dotBg = '#F59E0B' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotBg, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function PriorityChip({ priority }: { priority: string }) {
  const cfg: Record<string, { bg: string; color: string; icon: string }> = {
    EMERGENCY: { bg: '#FEF2F2', color: '#991B1B', icon: 'fa-exclamation-triangle' },
    URGENT:    { bg: '#FFFBEB', color: '#92400E', icon: 'fa-exclamation-circle' },
    ROUTINE:   { bg: '#F3F4F6', color: '#6B7280', icon: 'fa-minus-circle' },
  }
  const c = cfg[priority] ?? cfg.ROUTINE
  return (
    <span className="badge" style={{ background: c.bg, color: c.color, border: 'none', fontSize: 10 }}>
      <i className={`fas ${c.icon}`} style={{ fontSize: 8 }} />
      {priority}
    </span>
  )
}

interface VerifyCard {
  req: MockGOPRequest
  step: 'surgeon' | 'anaesthetist'
  label: string
  href: string
}

export default function DoctorDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const requests = useGopStore(s => s.requests)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/'); return }
    if (status === 'authenticated' && session?.user?.role !== 'DOCTOR') router.replace('/')
  }, [status, session, router])

  // Tick every 60s so SLA countdowns update
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const doctorName = session?.user?.name ?? ''
  const firstName  = doctorName.split(' ')[0]?.replace('Dr.', '').trim() ?? 'Doctor'
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  // Build verification queue
  const queue: VerifyCard[] = []
  const completed: MockGOPRequest[] = []

  for (const req of requests) {
    if (req.status !== 'DRAFT') continue
    const isSurgeon     = req.assignedSurgeon === doctorName
    const isAnaesthetist = req.assignedAnaesthetist === doctorName

    if (isSurgeon && !req.surgeonVerified) {
      queue.push({ req, step: 'surgeon', label: 'Surgeon Verification', href: `/gop/${req.id}/verify/surgeon` })
    }
    if (isAnaesthetist && req.surgeonVerified && !req.anaesthetistVerified) {
      queue.push({ req, step: 'anaesthetist', label: 'Anaesthetist Verification', href: `/gop/${req.id}/verify/anaesthetist` })
    }
    if ((isSurgeon && req.surgeonVerified) || (isAnaesthetist && req.anaesthetistVerified)) {
      if (!completed.find(r => r.id === req.id)) completed.push(req)
    }
  }

  // Also include completed from non-DRAFT requests
  for (const req of requests) {
    if (req.status === 'DRAFT') continue
    const isSurgeon      = req.assignedSurgeon === doctorName
    const isAnaesthetist = req.assignedAnaesthetist === doctorName
    if ((isSurgeon && req.surgeonVerified) || (isAnaesthetist && req.anaesthetistVerified)) {
      if (!completed.find(r => r.id === req.id)) completed.push(req)
    }
  }

  const [showCompleted, setShowCompleted] = useState(false)

  if (status === 'loading') return null

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            {greeting}, Dr. {firstName}
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', marginTop: 4 }}>
            Your verification queue and assigned GOP requests.
          </p>
        </div>
        <Link href="/gop" className="btn btn-outline btn-sm">
          <i className="fas fa-list" /> All My Requests
        </Link>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending Verification', value: queue.length, color: queue.length > 0 ? '#F59E0B' : 'var(--success)', bg: queue.length > 0 ? '#FFFBEB' : '#ECFDF5' },
          { label: 'Completed', value: completed.length, color: 'var(--muted-foreground)', bg: 'var(--gray-100)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: s.bg, borderRadius: 'var(--radius-lg)', padding: '10px 18px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</span>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', alignSelf: 'center' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Verification Queue */}
      <div>
        <div className="section-header">
          <h2 className="section-title">
            <i className="fas fa-clock" style={{ color: 'var(--warning)', marginRight: 8, fontSize: '0.875rem' }} />
            My Verification Queue
          </h2>
          {queue.length > 0 && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', fontWeight: 500 }}>
              {queue.length} pending
            </span>
          )}
        </div>

        {queue.length === 0 ? (
          <div style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="fas fa-check-circle" style={{ color: 'var(--success)', fontSize: '1.25rem' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--foreground)', margin: 0 }}>
              No pending verifications
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', marginTop: 4 }}>
              No requests currently assigned to you.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {queue.map(({ req, step, label, href }) => {
              const sla = getSLAStatus(req, now)
              const isSurgeonStep = step === 'surgeon'
              return (
                <div key={`${req.id}-${step}`} style={{
                  background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)', overflow: 'hidden',
                  transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; (e.currentTarget as HTMLElement).style.transform = '' }}
                >
                  {/* Top accent bar */}
                  <div style={{ height: 3, background: sla.isOverdue ? 'var(--gradient-danger)' : sla.isWarning ? 'var(--gradient-warning)' : 'var(--gradient-primary)' }} />

                  <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* Step icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '0.625rem', flexShrink: 0,
                      background: isSurgeonStep ? 'rgba(91,95,255,0.1)' : 'rgba(16,185,129,0.1)',
                      color: isSurgeonStep ? 'var(--primary)' : 'var(--success)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                    }}>
                      <i className={isSurgeonStep ? 'fas fa-user-md' : 'fas fa-procedures'} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>
                          {req.patientName}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-foreground)', background: 'var(--gray-100)', borderRadius: 4, padding: '1px 6px' }}>
                          {req.quoteNumber}
                        </span>
                        <PriorityChip priority={req.priority} />
                        <span className={`badge badge-${req.insurer.toLowerCase()}`} style={{ fontSize: 10, padding: '2px 7px' }}>
                          {req.insurer}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className={`fas ${isSurgeonStep ? 'fa-stethoscope' : 'fa-syringe'}`} style={{ fontSize: 10 }} />
                          {label}
                        </span>
                        {/* SLA bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 80, height: 4, background: 'var(--gray-200)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 999,
                              width: `${Math.min(100, sla.percentUsed)}%`,
                              background: sla.isOverdue || sla.percentUsed >= 80 ? '#EF4444' : sla.percentUsed >= 50 ? '#F59E0B' : '#10B981',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                            SLA: {formatElapsed(sla.thresholdHours)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <SLABadge percentUsed={sla.percentUsed} remainingHours={sla.remainingHours} isOverdue={sla.isOverdue} />
                      <Link href={href} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
                        <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
                        Start Verification
                      </Link>
                    </div>
                  </div>

                  {/* Verification checklist row */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 1.25rem', background: 'var(--gray-50)', display: 'flex', gap: 16 }}>
                    {[
                      { label: 'Surgeon', done: req.surgeonVerified },
                      { label: 'Anaesthetist', done: req.anaesthetistVerified },
                      { label: 'Finance', done: req.financeVerified },
                    ].map(v => (
                      <span key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: v.done ? 'var(--success)' : 'var(--muted-foreground)', fontWeight: v.done ? 600 : 400 }}>
                        <i className={`fas ${v.done ? 'fa-check-circle' : 'fa-circle'}`} style={{ fontSize: 10, color: v.done ? 'var(--success)' : 'var(--muted)' }} />
                        {v.label}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed Verifications */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}
          >
            <h2 className="section-title" style={{ margin: 0 }}>
              <i className="fas fa-check-double" style={{ color: 'var(--success)', marginRight: 8, fontSize: '0.875rem' }} />
              Completed Verifications
            </h2>
            <span style={{ fontSize: 'var(--font-size-xs)', background: '#ECFDF5', color: 'var(--success)', borderRadius: 9999, padding: '1px 8px', fontWeight: 600 }}>
              {completed.length}
            </span>
            <i className={`fas fa-chevron-${showCompleted ? 'up' : 'down'}`} style={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
          </button>

          {showCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {completed.map(req => {
                const isSurgeon      = req.assignedSurgeon === doctorName && req.surgeonVerified
                const isAnaesthetist = req.assignedAnaesthetist === doctorName && req.anaesthetistVerified
                return (
                  <div key={req.id} style={{
                    background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                    padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: 'var(--shadow-xs)',
                  }}>
                    <i className="fas fa-check-circle" style={{ color: 'var(--success)', fontSize: '1rem', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--foreground)' }}>{req.patientName}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--gray-100)', borderRadius: 4, padding: '1px 5px' }}>{req.quoteNumber}</span>
                        <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                          {isSurgeon && isAnaesthetist ? 'Surgeon + Anaesthetist' : isSurgeon ? 'Surgeon Verified' : 'Anaesthetist Verified'}
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>
                        {req.insurer} · Status: <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{req.status.toLowerCase()}</span>
                      </span>
                    </div>
                    <Link href={`/gop/${req.id}`} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                      View <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
