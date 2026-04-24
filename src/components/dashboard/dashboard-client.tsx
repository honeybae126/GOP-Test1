'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { MockGOPRequest } from '@/lib/mock-data'

interface Props { requests: MockGOPRequest[] }

const STATUS_OPTS = ['All','DRAFT','SUBMITTED','VERIFIED','APPROVED','REJECTED','EXPIRED']
const INSURER_OPTS = ['All','AIA','ASSURNET','APRIL','HSC','LUMA']

function HisBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  return (
    <span className={`his-badge his-badge-${s}`}>
      {status}
    </span>
  )
}

export function DashboardClient({ requests }: Props) {
  const [fromDate, setFromDate]     = useState('')
  const [toDate, setToDate]         = useState('')
  const [statusF, setStatusF]       = useState('All')
  const [insurerF, setInsurerF]     = useState('All')
  const [search, setSearch]         = useState('')
  const [pendingFrom, setPendingFrom] = useState('')
  const [pendingTo, setPendingTo]     = useState('')

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const created = new Date(r.createdAt)
      if (pendingFrom) { const f = new Date(pendingFrom); f.setHours(0,0,0,0); if (created < f) return false }
      if (pendingTo)   { const t = new Date(pendingTo);   t.setHours(23,59,59,999); if (created > t) return false }
      if (statusF  !== 'All' && r.status  !== statusF)  return false
      if (insurerF !== 'All' && r.insurer !== insurerF)  return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.patientName.toLowerCase().includes(q) && !r.id.includes(q) && !r.quoteNumber.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [requests, pendingFrom, pendingTo, statusF, insurerF, search])

  const handleFilter = () => {
    setPendingFrom(fromDate)
    setPendingTo(toDate)
  }

  const handleClear = () => {
    setFromDate(''); setToDate(''); setPendingFrom(''); setPendingTo('')
    setStatusF('All'); setInsurerF('All'); setSearch('')
  }

  return (
    <div>
      {/* ── HIS filter bar ── */}
      <div className="his-filter-bar">
        <span className="his-filter-label">From</span>
        <input
          type="date"
          className="his-filter-input"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          style={{ width: 130 }}
        />
        <span className="his-filter-label">To</span>
        <input
          type="date"
          className="his-filter-input"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          style={{ width: 130 }}
        />
        <button className="his-btn his-btn-primary" onClick={handleFilter}>
          <i className="fas fa-filter" style={{ fontSize: '0.6875rem' }} />
          Filter
        </button>
        <button className="his-btn his-btn-secondary" onClick={handleClear}>Clear</button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        <select
          className="his-filter-select"
          value={statusF}
          onChange={e => setStatusF(e.target.value)}
          style={{ width: 130 }}
        >
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>

        <select
          className="his-filter-select"
          value={insurerF}
          onChange={e => setInsurerF(e.target.value)}
          style={{ width: 120 }}
        >
          {INSURER_OPTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Insurers' : s}</option>)}
        </select>

        <div style={{ position: 'relative' }}>
          <i className="fas fa-search" style={{
            position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)', fontSize: '0.6875rem', pointerEvents: 'none',
          }} />
          <input
            className="his-filter-input"
            placeholder="Patient name / ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 22, width: 180 }}
          />
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── HIS results table ── */}
      <div className="his-table-wrapper" style={{ borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}>
        <div className="his-table-scroll">
          <table className="his-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Request ID</th>
                <th style={{ width: 80  }}>Quote No.</th>
                <th style={{ width: 170 }}>Patient Name</th>
                <th style={{ width: 80  }}>Insurer</th>
                <th style={{ width: 150 }}>Attending Doctor</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 100 }}>Est. Cost</th>
                <th style={{ width: 100 }}>Created By</th>
                <th style={{ width: 80  }}>Date</th>
                <th style={{ width: 60  }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '20px 8px' }}>
                    No records found matching the current filters.
                  </td>
                </tr>
              )}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {r.id.toUpperCase()}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{r.quoteNumber}</td>
                  <td style={{ fontWeight: 500 }}>{r.patientName}</td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '1px 6px', borderRadius: 2,
                      fontSize: '0.6875rem', fontWeight: 600,
                      background: 'var(--secondary)', border: '1px solid var(--border)',
                    }}>
                      {r.insurer}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                    {r.assignedSurgeon ?? <span style={{ color: 'var(--border)' }}>—</span>}
                  </td>
                  <td><HisBadge status={r.status} /></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                    ${r.estimatedAmount?.toLocaleString() ?? '—'}
                  </td>
                  <td style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                    {r.createdBy ?? '—'}
                  </td>
                  <td style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link
                        href={`/gop/${r.id}`}
                        className="his-btn his-btn-secondary"
                        style={{ height: 22, padding: '0 8px', fontSize: '0.6875rem', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                      {r.status === 'DRAFT' && (
                        <Link
                          href={`/gop/${r.id}/form`}
                          className="his-btn his-btn-secondary"
                          style={{ height: 22, padding: '0 8px', fontSize: '0.6875rem', textDecoration: 'none' }}
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
