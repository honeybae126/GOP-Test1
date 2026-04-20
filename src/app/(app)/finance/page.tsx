import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GOPStatusChart } from '@/components/dashboard/gop-status-chart'
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart'
import { MOCK_DASHBOARD_STATS, MOCK_GOP_REQUESTS } from '@/lib/mock-data'
import { FileText, CheckCircle, Timer, BarChart3 } from 'lucide-react'

export default async function FinancePage() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (session.user?.role === 'DOCTOR') redirect('/dashboard/doctor')

  const stats = { totalRequests: 9, pending: 3, approved: 2, avgTurnaroundHours: 28, statusDistribution: [], monthlyTrend: [] } as any
  const requests = [] as any[]

  const pending = requests.filter((r) => r.status === 'SUBMITTED').length
  const draft   = requests.filter((r) => r.status === 'DRAFT').length
  const approvedThisMonth = requests.filter((r) => {
    if (r.status !== 'APPROVED') return false
    if (!r.resolvedAt) return false
    const d = new Date(r.resolvedAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const statCards = [
    {
      label: 'Total GOP Requests',
      value: stats.totalRequests || 9,
      sub: 'All time',
      iconBg: 'var(--blue-50)',
      iconColor: 'var(--blue-600)',
      Icon: FileText,
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Pending Decision',
      value: pending,
      sub: 'Submitted to insurer',
      iconBg: '#FFF8ED',
      iconColor: '#C47B10',
      Icon: Timer,
      trend: null,
      trendUp: false,
    },
    {
      label: 'Approved This Month',
      value: approvedThisMonth || stats.approved,
      sub: 'Month-to-date',
      iconBg: '#EDFAF3',
      iconColor: '#1A9E4A',
      Icon: CheckCircle,
      trend: null,
      trendUp: true,
    },
    {
      label: 'Avg Processing Time',
      value: `${stats.avgTurnaroundHours}h`,
      sub: 'Submission to decision',
      iconBg: '#EDE9FF',
      iconColor: '#7C3AED',
      Icon: BarChart3,
      trend: null,
      trendUp: false,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>Finance Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          GOP request statistics and financial trends.
        </p>
      </div>

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
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  fontSize: 11, fontWeight: 500,
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

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          <MonthlyTrendChart data={stats.monthlyTrend} />
        </div>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          <GOPStatusChart data={stats.statusDistribution} />
        </div>
      </div>
    </div>
  )
}
