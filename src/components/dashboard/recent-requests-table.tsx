import Link from 'next/link'
import { GOPStatusBadge } from '@/components/gop/gop-status-badge'
import { PriorityBadge } from '@/components/gop/priority-badge'
import type { MockGOPRequest } from '@/lib/mock-data'
import { ArrowRight } from 'lucide-react'

interface RecentRequestsTableProps {
  requests: MockGOPRequest[]
}

export function RecentRequestsTable({ requests }: RecentRequestsTableProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>Recent GOP Requests</div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Latest pre-authorisation requests across all insurers</div>
        </div>
        <Link href="/gop" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)', background: 'var(--bg-card)',
            fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', cursor: 'pointer',
          }}>
            View All <ArrowRight style={{ width: 13, height: 13 }} />
          </button>
        </Link>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F4F6FC', borderBottom: '1px solid var(--border-light)' }}>
            {['Patient', 'Quote No.', 'Insurer', 'Status', 'Priority', 'Amount', 'Doctor', 'Created', ''].map(h => (
              <th key={h} style={{
                padding: '11px 16px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, color: 'var(--gray-500)',
                textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map((req, i) => (
            <tr
              key={req.id}
              style={{
                borderBottom: i < requests.length - 1 ? '1px solid var(--border-light)' : undefined,
                borderLeft: req.priority === 'EMERGENCY' ? '3px solid var(--priority-emergency-dot)' : undefined,
                background: req.priority === 'EMERGENCY' ? 'rgba(239,68,68,0.02)' : undefined,
                transition: 'background 100ms ease',
              }}
              className="hover:bg-[#F8FAFF]"
            >
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>
                {req.patientName}
              </td>
              <td style={{ padding: '14px 16px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue-600)', fontWeight: 600 }}>
                  {req.quoteNumber}
                </span>
              </td>
              <td style={{ padding: '14px 16px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: '3px 8px',
                  borderRadius: 'var(--radius-full)', background: 'var(--blue-50)', color: 'var(--blue-700)',
                }}>
                  {req.insurer}
                </span>
              </td>
              <td style={{ padding: '14px 16px' }}>
                <GOPStatusBadge status={req.status} />
              </td>
              <td style={{ padding: '14px 16px' }}>
                <PriorityBadge priority={req.priority} size="sm" />
              </td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--gray-700)', fontVariantNumeric: 'tabular-nums' }}>
                ${req.estimatedAmount.toLocaleString()}
              </td>
              <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--gray-500)' }}>
                {req.assignedSurgeon ?? '—'}
              </td>
              <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td style={{ padding: '14px 16px' }}>
                <Link href={`/gop/${req.id}`} style={{ textDecoration: 'none' }}>
                  <button style={{
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
