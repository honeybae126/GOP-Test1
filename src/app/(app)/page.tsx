import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MOCK_GOP_REQUESTS } from '@/lib/mock-data'
import Link from 'next/link'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user?.role === 'DOCTOR') redirect('/dashboard/doctor')
  if (session?.user?.role === 'FINANCE') redirect('/gop')

  const requests = MOCK_GOP_REQUESTS || []

  const todayNew           = requests.filter(r => {
    const d = new Date(r.createdAt)
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }).length
  const pendingVerification = requests.filter(r => r.status === 'DRAFT' && !(r.surgeonVerified && r.anaesthetistVerified)).length
  const awaitingDecision    = requests.filter(r => r.status === 'SUBMITTED').length
  const approvedMonth       = requests.filter(r => r.status === 'APPROVED').length

  return (
    <div className="his-page" style={{ height: '100%' }}>
      {/* ── Page header ── */}
      <div className="his-page-header">
        <div>
          <div className="his-page-title">GOP Requests — Dashboard</div>
          <div className="his-page-sub">Guarantee of Payment pre-authorisation · Intercare Hospital</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/gop/new" className="his-btn his-btn-primary his-btn-lg">
            <i className="fas fa-plus" style={{ fontSize: '0.75rem' }} />
            New Request
          </Link>
        </div>
      </div>

      <div className="his-page-body">

        {/* ── Quick stats — 4 boxes side by side (HIS pattern) ── */}
        <div className="his-stats-row">
          <div className="his-stat-box">
            <div className="his-stat-label">Today&apos;s New</div>
            <div className="his-stat-value">{todayNew}</div>
            <div className="his-stat-sub">New requests today</div>
          </div>
          <div className="his-stat-box accent-blue">
            <div className="his-stat-label">Pending Verification</div>
            <div className="his-stat-value">{pendingVerification}</div>
            <div className="his-stat-sub">Awaiting doctor sign-off</div>
          </div>
          <div className="his-stat-box accent-teal">
            <div className="his-stat-label">Submitted to Insurer</div>
            <div className="his-stat-value">{awaitingDecision}</div>
            <div className="his-stat-sub">Awaiting decision</div>
          </div>
          <div className="his-stat-box accent-green">
            <div className="his-stat-label">Approved</div>
            <div className="his-stat-value">{approvedMonth}</div>
            <div className="his-stat-sub">This period</div>
          </div>
        </div>

        {/* ── Filter bar + table (client component handles filtering) ── */}
        <DashboardClient requests={requests} />

      </div>
    </div>
  )
}
