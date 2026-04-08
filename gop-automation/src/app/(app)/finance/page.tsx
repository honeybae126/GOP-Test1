import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/header'
import { GOPStatusChart } from '@/components/dashboard/gop-status-chart'
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart'
import { MOCK_DASHBOARD_STATS, MOCK_GOP_REQUESTS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle, Timer, BarChart3 } from 'lucide-react'

export default async function FinancePage() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (session.user?.role === 'DOCTOR') redirect('/')

  const stats = MOCK_DASHBOARD_STATS
  const requests = MOCK_GOP_REQUESTS

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
      title: 'Total GOP Requests',
      value: stats.totalRequests,
      sub: 'All time',
      icon: FileText,
      iconClass: 'text-blue-500',
    },
    {
      title: 'Pending Decision',
      value: pending,
      sub: 'Submitted to insurer',
      icon: Timer,
      iconClass: 'text-amber-500',
    },
    {
      title: 'Approved This Month',
      value: approvedThisMonth || stats.approved,
      sub: 'Month-to-date',
      icon: CheckCircle,
      iconClass: 'text-green-500',
    },
    {
      title: 'Avg Processing Time',
      value: `${stats.avgTurnaroundHours}h`,
      sub: 'Submission to decision',
      icon: BarChart3,
      iconClass: 'text-violet-500',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Overview"
        description="GOP request volumes, approval rates, and processing analytics."
      />

      {/* 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`size-4 ${card.iconClass}`} />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={stats.monthlyTrend} />
        </div>
        <div>
          <GOPStatusChart data={stats.statusDistribution} />
        </div>
      </div>
    </div>
  )
}
