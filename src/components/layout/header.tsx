import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between flex-shrink-0', className)}
      style={{
        height: 60,
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-light)',
        padding: 0,
      }}
    >
      <div>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 4 }}>{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
