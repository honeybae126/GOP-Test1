import { Circle, Triangle, AlertCircle } from 'lucide-react'
import type { GOPPriority } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: GOPPriority
  size?: 'sm' | 'md'
  className?: string
}

const priorityStyles = {
  URGENT: {
    backgroundColor: '#FFF8ED',
    color: '#C47B10'
  },
  EMERGENCY: {
    backgroundColor: '#FFF0F0',
    color: '#DC2626'
  }
};

const PRIORITY_CONFIG: Record<GOPPriority, {
  label: string
  icon: React.ElementType
}> = {
  EMERGENCY: {
    label: 'Emergency',
    icon: AlertCircle
  },
  URGENT: {
    label: 'Urgent',
    icon: Triangle
  },
  ROUTINE: {
    label: 'Routine',
    icon: Circle
  },
}

export function PriorityBadge({ priority, size = 'sm', className }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority]
  const Icon = cfg.icon
  const iconSize = size === 'sm' ? 'size-2.5' : 'size-3'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  const styles = priorityStyles[priority as 'URGENT' | 'EMERGENCY'] || { backgroundColor: '#F0F2F8', color: '#6B7494' };
  const iconSizePx = size === 'sm' ? 6 : 8;
  const fontSizePx = size === 'sm' ? 12 : 13;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        className
      )}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '3px 8px' : '4px 10px',
        fontSize: `${fontSizePx}px`,
        fontWeight: '500',
        borderRadius: '9999px',
        whiteSpace: 'nowrap',
        ...styles
      }}
    >
      {priority !== 'ROUTINE' && (
        <div style={{
          width: iconSizePx,
          height: iconSizePx,
          borderRadius: '50%',
          backgroundColor: priority === 'EMERGENCY' ? '#EF4444' : '#F59E0B',
          flexShrink: 0
        }} />
      )}
      {cfg.label}
    </span>
  )
}

export { PRIORITY_CONFIG }
