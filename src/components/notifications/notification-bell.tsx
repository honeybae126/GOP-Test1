'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, CheckCheck, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const EVENT_LABELS: Record<string, string> = {
  REQUEST_CREATED: 'New GOP request created',
  REQUEST_ASSIGNED: 'GOP request assigned to you',
  REQUEST_REASSIGNED: 'GOP request reassigned',
  REQUEST_VERIFIED: 'Doctor has verified the request',
  REQUEST_CORRECTION_REQUESTED: 'Doctor requested corrections',
  REQUEST_SUBMITTED: 'Request submitted to insurer',
  REQUEST_APPROVED: 'GOP request approved',
  REQUEST_REJECTED: 'GOP request rejected',
  REQUEST_EXPIRED: 'GOP request has expired',
  PDF_DOWNLOADED: 'PDF downloaded',
}

interface NotificationItem {
  id: string
  eventType: string
  requestId: string | null
  readAt: string | null
  createdAt: string
  metadata: Record<string, unknown>
}

export function NotificationBell() {
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setCount(data.count ?? 0)
      }
    } catch {
      // silent — don't crash nav on network error
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll unread count every 60 seconds, only when tab is visible
  useEffect(() => {
    fetchCount()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCount()
    }, 60_000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Fetch notifications when panel opens
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' })
      setCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
    } catch {
      // silent
    }
  }

  const displayCount = count > 99 ? '99+' : count

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" title="Notifications">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
              {displayCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              All caught up!
            </div>
          )}
          {!loading && notifications.map((n, i) => (
            <div key={n.id}>
              {i > 0 && <Separator />}
              <div className={cn(
                'flex gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50',
                !n.readAt && 'bg-blue-50/60'
              )}>
                <div className="mt-0.5 shrink-0">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', !n.readAt && 'font-medium')}>
                    {EVENT_LABELS[n.eventType] ?? n.eventType}
                  </p>
                  {(n.metadata as any)?.patientName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {(n.metadata as any).patientName}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.readAt && (
                  <div className="mt-1.5 size-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
