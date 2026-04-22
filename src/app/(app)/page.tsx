import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RecentRequestsTable } from '@/components/dashboard/recent-requests-table'
import { MOCK_GOP_REQUESTS } from '@/lib/mock-data'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user?.role === 'DOCTOR') redirect('/dashboard/doctor')
  if (session?.user?.role === 'FINANCE') redirect('/gop')

  const requests = MOCK_GOP_REQUESTS || []
  const recentRequests = requests.slice(0, 5)

  const pendingVerifications = requests.filter(
    r => r.status === 'DRAFT' && !((r.surgeonVerified ?? r.doctorVerified) && (r.anaesthetistVerified ?? r.doctorVerified))
  ).length

  const awaitingSubmission = requests.filter(r => r.status === 'DRAFT' && r.staffFinalised === true).length
  const awaitingDecision   = requests.filter(r => r.status === 'SUBMITTED').length
  const approvedCount      = requests.filter(r => r.status === 'APPROVED').length

  const firstName = session?.user?.name?.split(' ')[0] ?? 'User'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">{greeting}, {firstName}! 👋</h1>
          <p className="header-subtitle">Here's your operational overview for today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="header-search">
            <i className="fas fa-search header-search-icon" />
            <input type="text" placeholder="Search requests…" className="header-search-input" readOnly />
          </div>
          <Link href="/gop/new" className="btn btn-primary btn-sm">
            <i className="fas fa-plus" />
            New Request
          </Link>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>

        {/* Attention banner */}
        {awaitingDecision > 0 && (
          <Link href="/gop?status=SUBMITTED" style={{ textDecoration: 'none' }}>
            <div className="alert-banner alert-warning" style={{ cursor: 'pointer' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.125rem', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Needs Attention</div>
                <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85, marginTop: '2px' }}>
                  {awaitingDecision} request{awaitingDecision !== 1 ? 's' : ''} awaiting insurer decision — click to review
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Metric grid */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Key Metrics</h2>
          </div>
          <div className="metric-grid">
            <div className="metric-card blue">
              <div className="metric-icon blue"><i className="fas fa-file-medical" /></div>
              <p className="metric-label">Total Requests</p>
              <p className="metric-value">{requests.length}</p>
              <p className="metric-trend">All time</p>
            </div>
            <div className="metric-card orange">
              <div className="metric-icon orange"><i className="fas fa-hourglass-half" /></div>
              <p className="metric-label">Pending Verification</p>
              <p className="metric-value">{pendingVerifications}</p>
              <p className="metric-trend">Awaiting doctor sign-off</p>
            </div>
            <div className="metric-card purple">
              <div className="metric-icon purple"><i className="fas fa-paper-plane" /></div>
              <p className="metric-label">Awaiting Decision</p>
              <p className="metric-value">{awaitingDecision}</p>
              <p className="metric-trend">Submitted to insurer</p>
            </div>
            <div className="metric-card green">
              <div className="metric-icon green"><i className="fas fa-check-circle" /></div>
              <p className="metric-label">Approved</p>
              <p className="metric-value">{approvedCount}</p>
              <p className="metric-trend metric-trend up">
                <i className="fas fa-arrow-up" style={{ fontSize: '0.625rem', marginRight: '2px' }} />
                This period
              </p>
            </div>
          </div>
        </div>

        {/* Status overview row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="status-card">
            <div className="status-card-label">Ready to Submit</div>
            <div className="status-card-value" style={{ color: awaitingSubmission > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {awaitingSubmission}
            </div>
            <div className="status-card-description">Draft requests finalised by staff</div>
          </div>
          <div className="status-card status-card-gradient">
            <div className="status-card-label">Active Workflows</div>
            <div className="status-card-value">{requests.filter(r => r.status === 'DRAFT' || r.status === 'SUBMITTED').length}</div>
            <div className="status-card-description">In-progress across all stages</div>
          </div>
        </div>

        {/* Recent requests */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Recent Requests</h2>
            <Link href="/gop" className="section-action">
              View all <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
            </Link>
          </div>
          <RecentRequestsTable requests={recentRequests} />
        </div>

      </div>
    </div>
  )
}
