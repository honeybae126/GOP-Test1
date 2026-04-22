'use client'

import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'

export default function FinancePage() {
  const { status } = useSession()
  const role = useActiveRole()
  const router = useRouter()
  const allRequests = useGopStore(s => s.requests)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/auth/signin'); return }
    if (status === 'authenticated' && role === 'DOCTOR') router.replace('/dashboard/doctor')
  }, [status, role, router])

  if (status === 'loading') return null

  // Pending Finance Review: both doctor verifications done, finance not yet done
  const pendingFinance = allRequests.filter(r =>
    (r.surgeonVerified || r.doctorVerified) &&
    (r.anaesthetistVerified || r.doctorVerified) &&
    !r.financeVerified &&
    r.status === 'DRAFT'
  )

  const approved    = allRequests.filter(r => r.status === 'APPROVED').length
  const rejected    = allRequests.filter(r => r.status === 'REJECTED').length
  const submitted   = allRequests.filter(r => r.status === 'SUBMITTED').length

  const metrics = [
    { label: 'Pending Finance Review', value: pendingFinance.length, icon: 'fas fa-file-invoice-dollar', color: 'orange', sub: 'Awaiting your cost sign-off' },
    { label: 'Submitted to Insurer',   value: submitted,             icon: 'fas fa-paper-plane',         color: 'blue',   sub: 'Awaiting insurer decision' },
    { label: 'Approved',               value: approved,              icon: 'fas fa-check-circle',        color: 'green',  sub: 'Insurer approved' },
    { label: 'Rejected',               value: rejected,              icon: 'fas fa-times-circle',        color: 'red',    sub: 'Insurer rejected' },
  ]

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">Finance Overview</h1>
          <p className="header-subtitle">Cost verification queue and GOP financial overview.</p>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>

        {/* Metric grid */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Key Financials</h2>
          </div>
          <div className="metric-grid">
            {metrics.map(m => (
              <div key={m.label} className={`metric-card ${m.color}`}>
                <div className={`metric-icon ${m.color}`}><i className={m.icon} /></div>
                <p className="metric-label">{m.label}</p>
                <p className="metric-value">{m.value}</p>
                <p className="metric-trend">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Finance Review table */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Pending Finance Review</h2>
          </div>

          {pendingFinance.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-xl)', padding: '40px 20px',
              textAlign: 'center', fontSize: 13, color: 'var(--muted-foreground)',
            }}>
              <i className="fas fa-check-circle" style={{ fontSize: 24, marginBottom: 10, display: 'block', color: 'var(--success)' }} />
              No pending finance reviews — all cost sign-offs are complete.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quote No.</th>
                    <th>Patient</th>
                    <th>Insurer</th>
                    <th>Estimated Cost</th>
                    <th>Surgeon</th>
                    <th>Waiting Since</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFinance.map(req => (
                    <tr key={req.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {req.quoteNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>{req.patientName}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>#{req.id}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--primary-foreground)', color: 'var(--primary)', border: '1px solid var(--blue-200)' }}>
                          {req.insurer}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                          ${req.estimatedAmount.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                        {req.assignedSurgeon ?? <em>Unassigned</em>}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td>
                        <Link href={`/gop/${req.id}/verify/finance`} className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: '4px 10px' }}>
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trend + Distribution row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          <div className="card">
            <div className="section-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h3 className="section-title" style={{ fontSize: 'var(--font-size-base)' }}>Monthly Trend</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { month: 'January', count: 4, pct: 44 },
                { month: 'February', count: 3, pct: 33 },
                { month: 'March', count: 2, pct: 22 },
              ].map(row => (
                <div key={row.month}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--foreground)' }}>{row.month}</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{row.count}</span>
                  </div>
                  <div style={{ height: '0.375rem', background: 'var(--secondary)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-header" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h3 className="section-title" style={{ fontSize: 'var(--font-size-base)' }}>Status Distribution</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'Pending',  pct: 33, cls: 'badge-submitted' },
                { label: 'Approved', pct: 22, cls: 'badge-approved' },
                { label: 'Rejected', pct: 11, cls: 'badge-rejected' },
                { label: 'Other',    pct: 34, cls: 'badge-routine' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${row.cls}`} style={{ width: '5.5rem', justifyContent: 'center' }}>{row.label}</span>
                  <div style={{ flex: 1, height: '0.375rem', background: 'var(--secondary)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: 'var(--primary)', borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', width: '2rem', textAlign: 'right' }}>{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
