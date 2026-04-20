'use client'

import type { MockGOPRequest } from '@/lib/mock-data'
import { getSLAStatus, formatElapsed, getDaysUntilExpiry } from '@/lib/sla-utils'
import { PriorityBadge } from './priority-badge'
import { cn } from '@/lib/utils'

interface SLAIndicatorProps {
  req: MockGOPRequest
  compact?: boolean
}

// ─── Full SLA card (detail page) ──────────────────────────────────────────

function SLAFull({ req }: { req: MockGOPRequest }) {
  const sla = getSLAStatus(req)

  const barColor =
    sla.isOverdue || sla.percentUsed >= 80
      ? 'bg-red-500'
      : sla.isWarning || sla.percentUsed >= 60
      ? 'bg-amber-500'
      : 'bg-green-500'

  const textColor =
    sla.isOverdue ? 'text-red-700' : sla.isWarning ? 'text-amber-700' : 'text-green-700'

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{sla.stageLabel}</span>
        <PriorityBadge priority={req.priority} size="sm" />
      </div>

      {sla.enteredAt && (
        <>
          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${sla.percentUsed}%` }}
            />
          </div>

          {/* Status text */}
          {sla.isOverdue ? (
            <p className="text-xs font-semibold text-red-700">
              OVERDUE by {formatElapsed(Math.abs(sla.remainingHours))}
            </p>
          ) : (
            <p className={cn('text-xs', textColor)}>
              {formatElapsed(sla.elapsedHours)} elapsed · {formatElapsed(Math.max(0, sla.remainingHours))} remaining
            </p>
          )}

          <p className="text-[10px] text-muted-foreground">
            SLA threshold: {sla.thresholdHours}h for {req.priority.toLowerCase()} priority
          </p>
        </>
      )}
    </div>
  )
}

// ─── Compact SLA pill (list rows / patient cards) ────────────────────────

function SLACompact({ req }: { req: MockGOPRequest }) {
  // Submitted: show expiry countdown instead of stage SLA
  if (req.status === 'SUBMITTED' && req.expiresAt) {
    const daysLeft = getDaysUntilExpiry(req.expiresAt)
    if (daysLeft > 7) return null
    const colorClass = daysLeft < 3
      ? 'text-red-700 bg-red-50 border-red-200'
      : 'text-amber-700 bg-amber-50 border-amber-200'
    const dotClass = daysLeft < 3 ? 'bg-red-500' : 'bg-amber-500'
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-medium', colorClass)}
        style={{ fontSize: 10 }}>
        <span className={cn('size-1.5 rounded-full shrink-0', dotClass)} />
        Expires in {Math.ceil(daysLeft)}d
      </span>
    )
  }

  if (req.status !== 'DRAFT') return null

  const sla = getSLAStatus(req)
  if (sla.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 font-medium text-red-700"
        style={{ fontSize: 10 }}>
        <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
        Overdue {formatElapsed(Math.abs(sla.remainingHours))}
      </span>
    )
  }
  if (sla.isWarning) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700"
        style={{ fontSize: 10 }}>
        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
        {formatElapsed(Math.max(0, sla.remainingHours))} left
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 font-medium text-green-700"
      style={{ fontSize: 10 }}>
      <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
      On track
    </span>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────

export function SLAIndicator({ req, compact = false }: SLAIndicatorProps) {
  if (compact) return <SLACompact req={req} />
  return <SLAFull req={req} />
}
