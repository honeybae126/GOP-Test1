'use client'

import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditLockBannerProps {
  conflictName: string | null
  dismissed: boolean
  dismiss: () => void
}

/**
 * Amber warning banner shown when another user/tab is actively viewing
 * the same GOP request. Warning only — does not block editing.
 */
export function EditLockBanner({ conflictName, dismissed, dismiss }: EditLockBannerProps) {
  if (!conflictName || dismissed) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
      <span className="flex-1 leading-snug">
        <strong>{conflictName}</strong> is currently viewing this request.{' '}
        Changes made here may conflict with their edits.
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 -mr-1 -mt-0.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
        onClick={dismiss}
        aria-label="Dismiss warning"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
