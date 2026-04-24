'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { GOPStatusBadge } from './gop-status-badge'
import type { MockGOPRequest, GOPPriority } from '@/lib/mock-data'
import { getDraftSubStatus } from '@/lib/gop-utils'
import { PriorityBadge } from './priority-badge'

interface GOPRequestsTableProps {
  requests: MockGOPRequest[]
  userRole: string
}

const STATUS_OPTIONS = [
  { value: 'all',          label: 'All Statuses' },
  { value: 'DRAFT',        label: 'Draft' },
  { value: 'SUBMITTED',    label: 'Submitted' },
  { value: 'APPROVED',     label: 'Approved' },
  { value: 'REJECTED',     label: 'Rejected' },
  { value: 'EXPIRED',      label: 'Expired' },
  { value: 'appeals_only', label: 'Appeals only' },
]
const INSURER_OPTIONS = [
  { value: 'all',      label: 'All Insurers' },
  { value: 'APRIL',    label: 'APRIL' },
  { value: 'HSC',      label: 'HSC' },
  { value: 'LUMA',     label: 'LUMA' },
  { value: 'AIA',      label: 'AIA' },
  { value: 'ASSURNET', label: 'ASSURNET' },
]
const PRIORITY_OPTIONS = [
  { value: 'all',       label: 'All Priorities' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'URGENT',    label: 'Urgent' },
  { value: 'ROUTINE',   label: 'Routine' },
]
const PRIORITY_ORDER: Record<GOPPriority, number> = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 }

const SUB_STATUS_STYLE: Record<string, React.CSSProperties> = {
  'Awaiting surgeon':                 { background: 'rgba(245,158,11,0.1)', color: '#92400E', borderColor: '#FDE68A' },
  'Awaiting anaesthetist assignment': { background: 'rgba(245,158,11,0.1)', color: '#92400E', borderColor: '#FDE68A' },
  'Awaiting anaesthetist':            { background: 'rgba(245,158,11,0.1)', color: '#92400E', borderColor: '#FDE68A' },
  'Ready to finalise':                { background: 'rgba(59,130,246,0.1)', color: '#1D4ED8', borderColor: '#BFDBFE' },
  'Ready to submit':                  { background: 'rgba(16,185,129,0.1)', color: '#065F46', borderColor: '#A7F3D0' },
}

const controlBase: React.CSSProperties = {
  height: 40,
  padding: '0 0.875rem',
  border: '1.5px solid var(--border)',
  borderRadius: '0.625rem',
  background: 'white',
  fontSize: '0.875rem',
  color: 'var(--foreground)',
  outline: 'none',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-xs)',
  transition: 'border-color var(--transition-base)',
}

function VerifChip({ label, done }: { label: string; done: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: '0.6875rem', fontWeight: 600,
      padding: '3px 8px', borderRadius: 6,
      background: done ? 'var(--success-subtle)' : 'var(--gray-100)',
      color:      done ? 'var(--success-text)'   : 'var(--gray-400)',
      border:     `1px solid ${done ? 'var(--success-border)' : 'var(--border-light)'}`,
    }}>
      <i className={done ? 'fas fa-check' : 'fas fa-clock'} style={{ fontSize: '0.5rem' }} />
      {label}
    </span>
  )
}

export function GOPRequestsTable({ requests, userRole }: GOPRequestsTableProps) {
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [insurerFilter, setInsurerFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showAppealChain, setShowAppealChain] = useState(false)
  const [hoveredRow, setHoveredRow]       = useState<string | null>(null)

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        r.patientName.toLowerCase().includes(q) ||
        r.id.includes(q) ||
        (r.assignedSurgeon ?? '').toLowerCase().includes(q) ||
        (r.assignedAnaesthetist ?? '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all'          ? true :
        statusFilter === 'appeals_only' ? r.appealOf !== null :
        r.status === statusFilter
      const matchInsurer  = insurerFilter === 'all'  || r.insurer === insurerFilter
      const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter
      return matchSearch && matchStatus && matchInsurer && matchPriority
    })
  }, [requests, search, statusFilter, insurerFilter, priorityFilter])

  const sorted = useMemo(() => {
    if (!showAppealChain) {
      return [...filtered].sort((a, b) => {
        const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        if (pd !== 0) return pd
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
    const parents = filtered.filter(r => r.appealOf === null)
    const result: Array<MockGOPRequest & { _isAppealChild?: boolean }> = []
    for (const parent of parents) {
      result.push(parent)
      filtered.filter(r => r.appealOf === parent.id).forEach(c => result.push({ ...c, _isAppealChild: true }))
    }
    filtered.filter(r => r.appealOf !== null && !parents.some(p => p.id === r.appealOf)).forEach(r => result.push(r))
    return result
  }, [filtered, showAppealChain])

  const showDoctorCol = userRole !== 'DOCTOR'
  const colCount = showDoctorCol ? 10 : 9

  return (
    <div className="table-wrapper">

      {/* ── Filter bar ── */}
      <div style={{
        background: 'var(--gray-50)',
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
      }}>

        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 280 }}>
          <i className="fas fa-search" style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)', fontSize: '0.8125rem', pointerEvents: 'none',
          }} />
          <input
            placeholder="Search patient, doctor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...controlBase, paddingLeft: 40, width: '100%' }}
          />
        </div>

        <select value={statusFilter}   onChange={e => setStatusFilter(e.target.value)}   style={controlBase}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={insurerFilter}  onChange={e => setInsurerFilter(e.target.value)}  style={controlBase}>
          {INSURER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={controlBase}>
          {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.8125rem', color: 'var(--muted-foreground)',
          cursor: 'pointer', userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={showAppealChain}
            onChange={e => setShowAppealChain(e.target.checked)}
            style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
          />
          Appeal chain
        </label>

        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="table-scroll-area">
      <table className="data-table" style={{ minWidth: '56rem' }}>
        <thead>
          <tr>
            <th style={{ width: '11%' }}>Quote No.</th>
            <th style={{ width: '17%' }}>Patient</th>
            <th style={{ width: '9%'  }}>Priority</th>
            <th style={{ width: '8%'  }}>Insurer</th>
            <th style={{ width: '18%' }}>Status</th>
            <th style={{ width: '9%'  }}>Estimated</th>
            {showDoctorCol && <th style={{ width: '13%' }}>Doctor</th>}
            <th style={{ width: '11%' }}>Verification</th>
            <th style={{ width: '6%'  }}>Date</th>
            <th style={{ width: '4%'  }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(req => {
            const isAppealChild = showAppealChain && !!(req as MockGOPRequest & { _isAppealChild?: boolean })._isAppealChild
            const isEmergency   = req.priority === 'EMERGENCY'
            const sub           = getDraftSubStatus(req)
            const subStyle      = sub ? SUB_STATUS_STYLE[sub] : null
            const isHovered     = hoveredRow === req.id

            let rowBg = 'transparent'
            if (isHovered)       rowBg = 'var(--gray-50)'
            else if (isEmergency) rowBg = 'rgba(254,242,242,0.6)'
            else if (isAppealChild) rowBg = 'rgba(91,95,255,0.02)'

            return (
              <tr
                key={req.id}
                onMouseEnter={() => setHoveredRow(req.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  borderLeft: isEmergency
                    ? '3px solid rgba(239,68,68,0.55)'
                    : isAppealChild
                      ? '3px solid rgba(91,95,255,0.4)'
                      : undefined,
                  background: rowBg,
                  transition: 'background var(--transition-fast)',
                }}
              >
                {/* Quote No. */}
                <td style={{ paddingLeft: isAppealChild ? '2rem' : undefined }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {req.quoteNumber}
                  </span>
                  {isAppealChild && (
                    <div style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
                      <i className="fas fa-reply" style={{ marginRight: 3, fontSize: '0.5rem' }} />Appeal
                    </div>
                  )}
                </td>

                {/* Patient */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.3 }}>
                    {req.patientName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    #{req.id}
                  </div>
                </td>

                {/* Priority */}
                <td>
                  {req.priority !== 'ROUTINE'
                    ? <PriorityBadge priority={req.priority} />
                    : <span style={{ color: 'var(--gray-300)', fontSize: '0.875rem' }}>—</span>}
                </td>

                {/* Insurer */}
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: '0.6875rem', fontWeight: 600,
                    padding: '3px 9px', borderRadius: 9999,
                    background: '#EFF6FF', color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.01em',
                  }}>
                    {req.insurer}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <GOPStatusBadge status={req.status} />
                      {req.hasAppeal && (
                        <span className="badge badge-routine" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Appealed</span>
                      )}
                      {req.appealOf && (
                        <span className="badge badge-submitted" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>v{req.appealVersion}</span>
                      )}
                    </div>
                    {sub && subStyle && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: '0.6875rem', fontWeight: 600,
                        padding: '2px 8px', borderRadius: 9999,
                        border: '1px solid', alignSelf: 'flex-start',
                        ...subStyle,
                      }}>
                        {sub}
                      </span>
                    )}
                  </div>
                </td>

                {/* Estimated */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                    ${req.estimatedAmount.toLocaleString()}
                  </div>
                  {req.approvedAmount && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--success)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <i className="fas fa-check" style={{ fontSize: '0.5rem' }} />
                      ${req.approvedAmount.toLocaleString()}
                    </div>
                  )}
                </td>

                {/* Doctor */}
                {showDoctorCol && (
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--foreground)' }}>
                        <i className="fas fa-stethoscope" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.assignedSurgeon
                            ? req.assignedSurgeon
                            : <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Unassigned</span>}
                        </span>
                      </div>
                      {req.assignedAnaesthetist && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          <i className="fas fa-user-nurse" style={{ fontSize: '0.625rem', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.assignedAnaesthetist}</span>
                        </div>
                      )}
                    </div>
                  </td>
                )}

                {/* Verification */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <VerifChip label="Surg" done={!!(req.surgeonVerified   || req.doctorVerified)} />
                      <VerifChip label="Ana"  done={!!(req.anaesthetistVerified || req.doctorVerified)} />
                      <VerifChip label="Fin"  done={!!req.financeVerified} />
                    </div>
                    {req.hasAiPrefill && (
                      <span className="badge badge-ai" style={{ fontSize: '0.6875rem', alignSelf: 'flex-start', gap: 4 }}>
                        <i className="fas fa-robot" style={{ fontSize: '0.5625rem' }} />AI
                      </span>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </td>

                {/* Action */}
                <td style={{ textAlign: 'right' }}>
                  <Link
                    href={`/gop/${req.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 30, borderRadius: '0.5rem',
                      background: isHovered ? 'var(--primary-subtle)' : 'var(--gray-100)',
                      color: isHovered ? 'var(--primary)' : 'var(--muted-foreground)',
                      textDecoration: 'none', transition: 'all var(--transition-fast)',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.625rem' }} />
                  </Link>
                </td>
              </tr>
            )
          })}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={colCount} style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '0.75rem',
                    background: 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-filter" style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>No results found</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)' }}>
                      No GOP requests match your current filters
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}
