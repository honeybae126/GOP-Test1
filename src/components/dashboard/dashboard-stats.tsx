import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, Timer } from 'lucide-react'
import type { MOCK_DASHBOARD_STATS } from '@/lib/mock-data'

interface DashboardStatsProps {
  stats: typeof MOCK_DASHBOARD_STATS
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      sub: 'All time',
      icon: FileText,
      iconClass: 'text-blue-500',
      cardClass: '',
    },
    {
      title: 'Draft',
      value: stats.draft,
      sub: 'Awaiting completion',
      icon: Clock,
      iconClass: 'text-slate-500',
      cardClass: '',
    },
    {
      title: 'Submitted',
      value: stats.submitted,
      sub: 'Pending insurer decision',
      icon: Timer,
      iconClass: 'text-blue-500',
      cardClass: '',
    },
    {
      title: 'Approved',
      value: stats.approved,
      sub: 'This month',
      icon: CheckCircle,
      iconClass: 'text-green-500',
      cardClass: '',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      sub: 'Requires review',
      icon: XCircle,
      iconClass: 'text-red-500',
      cardClass: '',
    },
    {
      title: 'Avg. Turnaround',
      value: `${stats.avgTurnaroundHours}h`,
      sub: 'Submission to decision',
      icon: AlertTriangle,
      iconClass: 'text-amber-500',
      cardClass: '',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="relative overflow-hidden">
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
  )
}
