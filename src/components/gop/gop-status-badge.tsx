import type { GOPStatus } from '@/lib/mock-data'

const STATUS_CONFIG: Record<GOPStatus, { icon: string; label: string; cls: string }> = {
  DRAFT:     { icon: 'fas fa-pencil-alt', label: 'Draft',     cls: 'badge badge-draft' },
  SUBMITTED: { icon: 'fas fa-paper-plane', label: 'Submitted', cls: 'badge badge-submitted' },
  APPROVED:  { icon: 'fas fa-check-circle', label: 'Approved', cls: 'badge badge-approved' },
  REJECTED:  { icon: 'fas fa-times-circle', label: 'Rejected', cls: 'badge badge-rejected' },
  EXPIRED:   { icon: 'fas fa-clock',        label: 'Expired',  cls: 'badge badge-expired' },
}

interface GOPStatusBadgeProps {
  status: GOPStatus
}

export function GOPStatusBadge({ status }: GOPStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { icon: 'fas fa-circle', label: status, cls: 'badge badge-draft' }
  return (
    <span className={cfg.cls}>
      <i className={cfg.icon} style={{ fontSize: '0.5625rem' }} />
      {cfg.label}
    </span>
  )
}
