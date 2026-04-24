import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminConfigPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'IT_ADMIN') redirect('/')

  const cards = [
    { icon: 'fas fa-id-card', title: 'SSO Group Mapping', body: 'Configure Entra ID / Azure AD group mappings to roles.' },
    { icon: 'fas fa-stamp',   title: 'Hospital Stamp',    body: 'Upload hospital letterhead/stamp PNG for PDF generation.' },
    { icon: 'fas fa-building', title: 'Insurer Configuration', body: 'Configure insurer API endpoints, approval workflows, SLA rules.' },
    { icon: 'fas fa-envelope', title: 'Email (SMTP) Settings', body: 'Configure notification emails for verifications, approvals, expiries.' },
  ]

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">System Configuration</h1>
          <p className="header-subtitle">IT Admin settings and SSO configuration.</p>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)' }}>
        {cards.map(card => (
          <div key={card.title} className="table-wrapper">
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className={card.icon} style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
                <span className="card-header-title">{card.title}</span>
              </div>
              <span className="badge badge-routine" style={{ fontSize: '0.625rem' }}>Phase 2</span>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              {card.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
