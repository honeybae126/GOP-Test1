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
        padding: '0 24px',
      }}
    >
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-800)', lineHeight: 1 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-[12px]">
          {children}
        </div>
      )}
    </div>
  )
}
