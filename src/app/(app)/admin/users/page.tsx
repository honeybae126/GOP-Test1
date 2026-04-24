import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

const MOCK_USERS = [
  { id: '1', name: 'Dr. Sok Phearith',       email: 'sok.phearith@intercare.kh',     role: 'DOCTOR',          status: 'Active' },
  { id: '2', name: 'Chan Reaksmey',           email: 'chan.reaksmey@intercare.kh',    role: 'INSURANCE_STAFF', status: 'Active' },
  { id: '3', name: 'Dr. Roeun Chanveasna',    email: 'roeun.chanveasna@intercare.kh', role: 'DOCTOR',          status: 'Active' },
  { id: '4', name: 'Lim Pagna',               email: 'lim.pagna@intercare.kh',        role: 'FINANCE',         status: 'Active' },
  { id: '5', name: 'Admin User',              email: 'admin@intercare.kh',            role: 'IT_ADMIN',        status: 'Active' },
]

const ROLE_BADGE: Record<string, { cls: string; icon: string; label: string }> = {
  DOCTOR:          { cls: 'badge badge-approved',  icon: 'fas fa-user-md',    label: 'Doctor' },
  INSURANCE_STAFF: { cls: 'badge badge-submitted', icon: 'fas fa-briefcase',  label: 'Insurance Staff' },
  FINANCE:         { cls: 'badge badge-expired',   icon: 'fas fa-chart-bar',  label: 'Finance' },
  IT_ADMIN:        { cls: 'badge badge-emergency', icon: 'fas fa-user-shield', label: 'IT Admin' },
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'IT_ADMIN') redirect('/')

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">User Management</h1>
          <p className="header-subtitle">Manage system users and role assignments.</p>
        </div>
        <span className="badge badge-routine">
          <i className="fas fa-user-plus" />
          Provisioning — Phase 2
        </span>
      </div>

      <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

        {/* Invite info */}
        <div className="table-wrapper">
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-envelope" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
              <span className="card-header-title">Invite User</span>
            </div>
            <span className="badge badge-routine" style={{ fontSize: '0.625rem' }}>Phase 2</span>
          </div>
          <div style={{ padding: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            User provisioning is handled via Microsoft Entra ID SSO. New users are automatically created on first
            sign-in based on their assigned Entra group. Manual invitation will be available in Phase 2.
          </div>
        </div>

        {/* Users table */}
        <div className="table-wrapper">
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-users" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }} />
              <span className="card-header-title">System Users</span>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted-foreground)' }}>{MOCK_USERS.length} users</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(user => {
                const rb = ROLE_BADGE[user.role] ?? { cls: 'badge badge-draft', icon: 'fas fa-user', label: user.role }
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div className="sidebar-avatar" style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.625rem' }}>
                          {user.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                      {user.email}
                    </td>
                    <td>
                      <span className={rb.cls}>
                        <i className={rb.icon} style={{ fontSize: '0.5625rem' }} />
                        {rb.label}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-approved">
                        <i className="fas fa-circle" style={{ fontSize: '0.4rem' }} />
                        {user.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
