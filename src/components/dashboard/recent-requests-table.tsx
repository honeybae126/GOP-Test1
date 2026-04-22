import Link from 'next/link'
import { GOPStatusBadge } from '@/components/gop/gop-status-badge'
import { PriorityBadge } from '@/components/gop/priority-badge'
import type { MockGOPRequest } from '@/lib/mock-data'

interface RecentRequestsTableProps {
  requests: MockGOPRequest[]
}

export function RecentRequestsTable({ requests }: RecentRequestsTableProps) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {['Patient', 'Quote No.', 'Insurer', 'Status', 'Priority', 'Amount', 'Doctor', 'Created', ''].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id}>
              <td style={{ fontWeight: 500, color: 'var(--foreground)' }}>{req.patientName}</td>
              <td>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {req.quoteNumber}
                </span>
              </td>
              <td>
                <span className="badge" style={{ background: 'var(--primary-foreground)', color: 'var(--primary)', borderColor: 'var(--blue-200)' }}>
                  {req.insurer}
                </span>
              </td>
              <td><GOPStatusBadge status={req.status} /></td>
              <td><PriorityBadge priority={req.priority} /></td>
              <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)', fontWeight: 500 }}>
                ${req.estimatedAmount.toLocaleString()}
              </td>
              <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>{req.assignedSurgeon ?? '—'}</td>
              <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td>
                <Link href={`/gop/${req.id}`} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
                  <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                </Link>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted-foreground)' }}>
                No recent requests
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
