import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/header'
import { RecentRequestsTable } from '@/components/dashboard/recent-requests-table'
import { MOCK_GOP_REQUESTS } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Send, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user?.role === 'DOCTOR') redirect('/dashboard/doctor')

  const requests = MOCK_GOP_REQUESTS
  const recentRequests = requests.slice(0, 5)

  // Operational summary counts
  const pendingVerifications = requests.filter(
    (r) =>
      r.status === 'DRAFT' &&
      !((r.surgeonVerified ?? r.doctorVerified) && (r.anaesthetistVerified ?? r.doctorVerified))
  ).length

  const awaitingSubmission = requests.filter(
    (r) => r.status === 'DRAFT' && r.staffFinalised === true
  ).length

  const awaitingDecision = requests.filter((r) => r.status === 'SUBMITTED').length

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${session?.user?.name?.split(' ')[0] ?? 'User'}`}
        description="Operational overview of GOP pre-authorisation requests."
      />

      {/* Operational summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Verifications
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{pendingVerifications}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting doctor sign-off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ready to Submit
            </CardTitle>
            <Send className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{awaitingSubmission}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalised, not yet sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Awaiting Insurer Decision
            </CardTitle>
            <ClipboardList className="size-4 text-violet-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{awaitingDecision}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted to insurer</p>
          </CardContent>
        </Card>
      </div>

      {/* Finance analytics shortcut */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          View approval rates, monthly trends, and processing analytics
        </p>
        <Link href="/finance">
          <Button variant="outline" size="sm">
            Finance Overview →
          </Button>
        </Link>
      </div>

      {/* Recent Requests */}
      <RecentRequestsTable requests={recentRequests} />
    </div>
  )
}
