'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { GOPStatusBadge } from './gop-status-badge'
import type { MockGOPRequest, GOPStatus, InsurerCode, GOPPriority } from '@/lib/mock-data'
import { getDraftSubStatus, DRAFT_SUB_STATUS_STYLES } from '@/lib/gop-utils'
import { PriorityBadge } from './priority-badge'
import { Search, ArrowRight, CheckCircle, XCircle, Stethoscope } from 'lucide-react'

interface GOPRequestsTableProps {
  requests: MockGOPRequest[]
  userRole: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'appeals_only', label: 'Appeals only' },
]
const INSURER_OPTIONS = [
  { value: 'all', label: 'All Insurers' },
  { value: 'APRIL', label: 'APRIL' },
  { value: 'HSC', label: 'HSC' },
  { value: 'LUMA', label: 'LUMA' },
  { value: 'AIA', label: 'AIA' },
  { value: 'ASSURNET', label: 'ASSURNET' },
]
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'ROUTINE', label: 'Routine' },
]
const PRIORITY_ORDER: Record<GOPPriority, number> = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 }

export function GOPRequestsTable({ requests, userRole }: GOPRequestsTableProps) {
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [insurerFilter, setInsurerFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showAppealChain, setShowAppealChain] = useState(false)

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
        statusFilter === 'all' ? true :
        statusFilter === 'appeals_only' ? r.appealOf !== null :
        r.status === statusFilter
      const matchInsurer  = insurerFilter === 'all' || r.insurer === insurerFilter
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

  const headers = ['Quote No.', 'Patient', 'Priority', 'Insurer', 'Status', 'Estimated', ...(userRole !== 'DOCTOR' ? ['Doctor'] : []), 'Verification', 'Date', '']

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Filters bar */}
      <div style={{
        background: '#F4F6FC',
        borderBottom: '1px solid var(--border-light)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--gray-400)' }} />
          <input
            placeholder="Search patient, doctor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 36, paddingLeft: 34, paddingRight: 12,
              border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', fontSize: 13, color: 'var(--gray-800)',
              outline: 'none',
            }}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-[36px] text-[13px] w-[150px] bg-[var(--bg-card)] border-[var(--border-medium)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={insurerFilter} onValueChange={setInsurerFilter}>
          <SelectTrigger className="h-[36px] text-[13px] w-[140px] bg-[var(--bg-card)] border-[var(--border-medium)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INSURER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-[36px] text-[13px] w-[140px] bg-[var(--bg-card)] border-[var(--border-medium)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch id="appeal-chain" checked={showAppealChain} onCheckedChange={setShowAppealChain} />
          <Label htmlFor="appeal-chain" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)' }}>
            Appeal chain
          </Label>
        </div>

        <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 'auto' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F4F6FC', borderBottom: '1px solid var(--border-light)' }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: '11px 16px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, color: 'var(--gray-500)',
                textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((req, i) => {
            const isAppealChild = showAppealChain && (req as any)._isAppealChild
            const isEmergency   = req.priority === 'EMERGENCY'
            const sub           = getDraftSubStatus(req)
            return (
              <tr
                key={req.id}
                style={{
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--border-light)' : undefined,
                  borderLeft: isEmergency ? '3px solid var(--priority-emergency-dot)' : isAppealChild ? '3px solid var(--blue-300)' : undefined,
                  background: isEmergency ? 'rgba(239,68,68,0.02)' : isAppealChild ? 'rgba(45,107,244,0.02)' : undefined,
                  transition: 'background 100ms ease',
                }}
                className="hover:bg-[#F8FAFF]"
              >
                <td style={{ padding: '13px 16px', paddingLeft: isAppealChild ? 32 : 16 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--blue-600)' }}>
                    {req.quoteNumber}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', paddingLeft: isAppealChild ? 28 : 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>{req.patientName}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>#{req.id}</div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  {req.priority !== 'ROUTINE'
                    ? <PriorityBadge priority={req.priority} size="sm" />
                    : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>—</span>}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    background: 'var(--blue-50)', color: 'var(--blue-700)',
                  }}>{req.insurer}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <GOPStatusBadge status={req.status} />
                      {req.hasAppeal && (
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--gray-100)', color: 'var(--gray-600)' }}>Appealed</span>
                      )}
                      {req.appealOf && (
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--blue-50)', color: 'var(--blue-700)' }}>Appeal v{req.appealVersion}</span>
                      )}
                    </div>
                    {sub && (() => {
                      const s = DRAFT_SUB_STATUS_STYLES[sub]
                      return <span className={`inline-block rounded-full font-medium ${s.pill}`} style={{ fontSize: 10, padding: '2px 6px' }}>{sub}</span>
                    })()}
                  </div>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', fontVariantNumeric: 'tabular-nums' }}>
                    ${req.estimatedAmount.toLocaleString()}
                  </div>
                  {req.approvedAmount && (
                    <div style={{ fontSize: 11, color: '#1A9E4A', marginTop: 2 }}>✓ ${req.approvedAmount.toLocaleString()}</div>
                  )}
                </td>
                {userRole !== 'DOCTOR' && (
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Stethoscope style={{ width: 12, height: 12, flexShrink: 0 }} />
                        <span>{req.assignedSurgeon ?? <em>Unassigned</em>}</span>
                      </div>
                      {req.assignedAnaesthetist && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.7 }}>
                          <Stethoscope style={{ width: 11, height: 11, flexShrink: 0 }} />
                          <span style={{ fontSize: 11 }}>{req.assignedAnaesthetist}</span>
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {req.doctorVerified || req.surgeonVerified ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#1A9E4A' }}>
                        <CheckCircle style={{ width: 12, height: 12 }} />
                        Done
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C47B10' }}>
                        <XCircle style={{ width: 12, height: 12 }} />
                        Pending
                      </div>
                    )}
                    {req.hasAiPrefill && (
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 'var(--radius-full)', background: '#F0EEFF', color: '#7B6EEF', fontWeight: 600 }}>AI</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                  {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <Link href={`/gop/${req.id}`} style={{ textDecoration: 'none' }}>
                    <button
                      style={{
                        width: 30, height: 30,
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--gray-400)',
                      }}
                      className="hover:bg-[var(--bg-card)] hover:shadow-[var(--shadow-card)] hover:text-[var(--gray-700)]"
                    >
                      <ArrowRight style={{ width: 13, height: 13 }} />
                    </button>
                  </Link>
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={headers.length} style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'var(--gray-400)' }}>
                No GOP requests match your filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
