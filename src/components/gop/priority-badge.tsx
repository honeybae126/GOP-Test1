interface PriorityBadgeProps {
  priority: string
  size?: 'sm' | 'md' | 'default'
}

const PRIORITY_CONFIG: Record<string, { icon: string; label: string; cls: string }> = {
  EMERGENCY: { icon: 'fas fa-exclamation-triangle', label: 'Emergency', cls: 'badge badge-emergency' },
  URGENT:    { icon: 'fas fa-exclamation-circle',   label: 'Urgent',    cls: 'badge badge-urgent' },
  ROUTINE:   { icon: 'fas fa-minus-circle',         label: 'Routine',   cls: 'badge badge-routine' },
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority] ?? { icon: 'fas fa-circle', label: priority, cls: 'badge badge-routine' }
  return (
    <span className={cfg.cls}>
      <i className={cfg.icon} style={{ fontSize: '0.5625rem' }} />
      {cfg.label}
    </span>
  )
}
