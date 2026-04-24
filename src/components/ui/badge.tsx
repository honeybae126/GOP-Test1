import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantCls: Record<string, string> = {
    default:     'badge badge-submitted',
    secondary:   'badge badge-draft',
    destructive: 'badge badge-rejected',
    outline:     'badge badge-routine',
  }
  return (
    <span className={[variantCls[variant], className].filter(Boolean).join(' ')} {...props} />
  )
}

export { Badge }
export type { BadgeProps }
