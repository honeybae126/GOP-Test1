import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MOCK_GOP_REQUESTS } from '@/lib/mock-data'

const ACTION_CONFIG: Record<string, { icon: string; label: string }> = {
  REQUEST_CREATED:        { icon: 'fas fa-file-plus',       label: 'Request created' },
  SURGEON_VERIFIED:       { icon: 'fas fa-check-circle',    label: 'Surgeon verification submitted' },
  ANAESTHETIST_VERIFIED:  { icon: 'fas fa-check-circle',    label: 'Anaesthetist verification submitted' },
  STAFF_FINALISED:        { icon: 'fas fa-check-double',    label: 'Request finalised by staff' },
  SUBMITTED_TO_INSURER:   { icon: 'fas fa-paper-plane',     label: 'Submitted to insurer' },
  FIELD_CORRECTED:        { icon: 'fas fa-edit',            label: 'Field corrected' },
  REQUEST_REJECTED:       { icon: 'fas fa-times-circle',    label: 'Request rejected' },
  REQUEST_EXPIRED:        { icon: 'fas fa-clock',           label: 'Request expired' },
  DOCTOR_REASSIGNED:      { icon: 'fas fa-user-edit',       label: 'Doctor reassigned' },
  ANAESTHETIST_ASSIGNED:  { icon: 'fas fa-user-edit',       label: 'Anaesthetist assigned' },
  VERIFICATION_RESET:     { icon: 'fas fa-redo',            label: 'Verification reset' },
  APPEAL_INITIATED:       { icon: 'fas fa-flag',            label: 'Appeal initiated' },
  PRIORITY_CHANGED:       { icon: 'fas fa-exclamation',     label: 'Priority changed' },
}

const ROLE_BADGE: Record<string, { cls: string }> = {
  IT_ADMIN:        { cls: 'badge badge-expired' },
  INSURANCE_STAFF: { cls: 'badge badge-submitted' },
  DOCTOR:          { cls: 'badge badge-approved' },
  SYSTEM:          { cls: 'badge badge-draft' },
}

export default async function AdminAuditPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'IT_ADMIN') redirect('/')

  const allEvents = MOCK_GOP_REQUESTS.flatMap((req) =>
    (req.auditLog ?? []).map((entry) => ({ ...entry, gopId: req.id, patientName: req.patientName }))
  ).sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">Audit Log</h1>
          <p className="header-subtitle">Full system event log · {allEvents.length} events recorded.</p>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)' }}>
        <div className="table-wrapper">
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-history" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
              <span className="card-header-title">All Events</span>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>{allEvents.length} total</span>
          </div>

          {allEvents.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 'var(--font-size-sm)' }}>
              No audit events recorded yet.
            </div>
          ) : (
            <div style={{ position: 'relative', padding: 'var(--spacing-lg)', paddingLeft: '2.5rem' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: '2.125rem', top: '2rem', bottom: '2rem', width: 1, background: 'var(--border)' }} />

              {allEvents.map(entry => {
                const cfg = ACTION_CONFIG[entry.action] ?? { icon: 'fas fa-circle', label: entry.action }
                const rb  = ROLE_BADGE[entry.performedByRole] ?? ROLE_BADGE.SYSTEM
                return (
                  <div key={entry.id} style={{ position: 'relative', display: 'flex', gap: '1rem', paddingBottom: '1.25rem' }}>
                    {/* Icon dot */}
                    <div style={{
                      width: '1.75rem', height: '1.75rem', borderRadius: '9999px',
                      background: 'white', border: '2px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, zIndex: 1,
                    }}>
                      <i className={cfg.icon} style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: '0.125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--foreground)' }}>
                          {cfg.label}
                        </span>
                        <span className={rb.cls} style={{ fontSize: '0.625rem' }}>{entry.performedBy}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                          #{entry.gopId.split('-')[1]}
                        </span>
                      </div>
                      {entry.detail && (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', marginTop: '0.125rem', fontStyle: 'italic' }}>
                          {entry.detail}
                        </p>
                      )}
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)', marginTop: '0.125rem' }}>
                        {new Date(entry.performedAt).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {' · '}
                        <span style={{ color: 'var(--muted-foreground)' }}>{entry.patientName}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
