import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RecentRequestsTable } from '@/components/dashboard/recent-requests-table'
import { MOCK_GOP_REQUESTS } from '@/lib/mock-data'
import { AlertTriangle, Send, ClipboardList, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user?.role === 'DOCTOR') redirect('/dashboard/doctor')
  if (session?.user?.role === 'FINANCE') redirect('/gop')

  const requests = MOCK_GOP_REQUESTS
  const recentRequests = (requests || []).slice(0, 5)

  const pendingVerifications = (requests || []).filter(
    r => r.status === 'DRAFT' && !((r.surgeonVerified ?? r.doctorVerified) && (r.anaesthetistVerified ?? r.doctorVerified))
  ).length

  const awaitingSubmission = (requests || []).filter(
    r => r.status === 'DRAFT' && r.staffFinalised === true
  ).length

  const awaitingDecision = (requests || []).filter(r => r.status === 'SUBMITTED').length
  const approvedCount    = (requests || []).filter(r => r.status === 'APPROVED').length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    {
      label: 'Total Requests',
      value: requests.length,
      sub: 'All time',
      iconBg: 'var(--blue-50)',
      iconColor: 'var(--blue-600)',
      Icon: ClipboardList,
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Pending Verification',
      value: pendingVerifications,
      sub: 'Awaiting doctor sign-off',
      iconBg: '#FFF8ED',
      iconColor: '#C47B10',
      Icon: AlertTriangle,
      trend: null,
      trendUp: false,
    },
    {
      label: 'Ready to Submit',
      value: awaitingSubmission,
      sub: 'Finalised, not yet sent',
      iconBg: 'var(--blue-50)',
      iconColor: 'var(--blue-600)',
      Icon: Send,
      trend: null,
      trendUp: false,
    },
    {
      label: 'Approved',
      value: approvedCount,
      sub: 'Successfully authorised',
      iconBg: '#EDFAF3',
      iconColor: '#1A9E4A',
      Icon: CheckCircle,
      trend: null,
      trendUp: true,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>
          {greeting()}, {session?.user?.name?.split(' ')[0] ?? 'User'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          Operational overview of GOP pre-authorisation requests.
        </p>
      </div>

      {/* Needs Attention strip */}
      {awaitingDecision > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Link href="/gop?status=SUBMITTED" style={{ textDecoration: 'none' }}>
            <div
              className="group transition-all duration-200 hover:-translate-y-[2px]"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderLeft: '4px solid var(--priority-emergency-dot)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-card)',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--priority-emergency-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: 18, height: 18, color: 'var(--priority-emergency-text)' }} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Needs Attention</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)', marginTop: 2 }}>
                  {awaitingDecision} request{awaitingDecision !== 1 ? 's' : ''} awaiting insurer decision
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--blue-600)', fontWeight: 500 }}>View →</div>
            </div>
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(card => (
          <div
            key={card.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
              padding: '20px 24px',
              minHeight: 120,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.Icon style={{ width: 18, height: 18, color: card.iconColor }} />
              </div>
              {card.trend && (
                <div style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 11,
                  fontWeight: 500,
                  background: card.trendUp ? 'var(--status-approved-bg)' : 'var(--status-rejected-bg)',
                  color: card.trendUp ? 'var(--status-approved-text)' : 'var(--status-rejected-text)',
                }}>
                  {card.trend}
                </div>
              )}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-800)', marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginTop: 2 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <RecentRequestsTable requests={recentRequests} />
    </div>
  )
}
