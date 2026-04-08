import { Badge } from '@/components/ui/badge'
import type { GOPStatus } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface GOPStatusBadgeProps {
  status: GOPStatus
  className?: string
}

const STATUS_CONFIG: Record<GOPStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
}

export function GOPStatusBadge({ status, className }: GOPStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
