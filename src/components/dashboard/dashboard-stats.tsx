'use client'

import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, Timer } from 'lucide-react'
import { useGopStore } from '@/lib/gop-store'
import type { MockGOPRequest } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { getSLAStatus, getDaysUntilExpiry } from '@/lib/sla-utils'
import type { MOCK_DASHBOARD_STATS } from '@/lib/mock-data'

interface DashboardStatsProps {
  stats: typeof MOCK_DASHBOARD_STATS
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const { requests } = useGopStore()

  const overdueCount = requests.filter((r: MockGOPRequest) => r.status === 'DRAFT').filter((r: MockGOPRequest) => getSLAStatus(r).isOverdue).length

  const expiringCount = requests.filter((r: MockGOPRequest) => r.status === 'SUBMITTED' && r.expiresAt && getDaysUntilExpiry(r.expiresAt) < 7).length

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
    overdueCount > 0 ? {
      title: 'Overdue Requests',
      value: overdueCount,
      sub: 'Immediate action needed',
      icon: AlertTriangle,
      iconClass: 'text-red-500',
      cardClass: 'ring-2 ring-red-200 bg-red-50 border-red-200 hover:bg-red-50/80',
      href: '/gop?status=DRAFT',
    } : null,
    expiringCount > 0 ? {
      title: 'Expiring Soon',
      value: expiringCount,
      sub: 'Within 7 days',
      icon: Timer,
      iconClass: 'text-amber-600',
      cardClass: 'ring-2 ring-amber-200 bg-amber-50 border-amber-200 hover:bg-amber-50/80',
      href: '/gop?status=SUBMITTED',
    } : null,
  ].filter(Boolean) as Array<{ title: string; value: string | number; sub: string; icon: React.ElementType; iconClass: string; cardClass: string; href?: string }>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.title} href={card.href || '#'} className="block">
            <Card className={cn("relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow", card.cardClass)}>
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
          </Link>
        )
      })}
    </div>
  )
}
