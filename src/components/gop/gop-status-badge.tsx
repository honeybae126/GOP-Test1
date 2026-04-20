import { Badge } from '@/components/ui/badge'
import type { GOPStatus } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface GOPStatusBadgeProps {
  status: GOPStatus
  className?: string
}

const statusStyles = {
  DRAFT: {
    backgroundColor: '#F0F2F8',
    color: '#6B7494'
  },
  SUBMITTED: {
    backgroundColor: '#EFF4FF',
    color: '#2D6BF4'
  },
  APPROVED: {
    backgroundColor: '#EDFAF3',
    color: '#1A9E4A'
  },
  REJECTED: {
    backgroundColor: '#FFF0F0',
    color: '#DC2626'
  },
  EXPIRED: {
    backgroundColor: '#FFF8ED',
    color: '#C47B10'
  }
};

const STATUS_CONFIG: Record<GOPStatus, { label: string }> = {
  DRAFT: { label: 'Draft' },
  SUBMITTED: { label: 'Submitted' },
  APPROVED: { label: 'Approved' },
  REJECTED: { label: 'Rejected' },
  EXPIRED: { label: 'Expired' }
};

export function GOPStatusBadge({ status, className }: GOPStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const styles = statusStyles[status]
  return (
    <span 
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: '500',
        borderRadius: '9999px',
        padding: '3px 10px',
        whiteSpace: 'nowrap',
        ...styles
      }}
    >
      {config.label}
    </span>
  )
}
