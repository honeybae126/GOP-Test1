'use client'

import { useEffect, useRef, useState } from 'react'

interface LockEntry {
  lockedBy: string
  lockedByName: string
  lockedAt: string
  tabId: string
}

export interface EditLockUser {
  email: string
  name: string
}

const LOCK_TTL_MS = 5 * 60 * 1000   // 5 minutes — stale threshold
const REFRESH_MS  = 30 * 1000        // 30 seconds — heartbeat interval

function getTabId(): string {
  let id = sessionStorage.getItem('gop-tab-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('gop-tab-id', id)
  }
  return id
}

function lockKey(gopId: string) {
  return `gop-lock-${gopId}`
}

function isStale(entry: LockEntry): boolean {
  return Date.now() - new Date(entry.lockedAt).getTime() > LOCK_TTL_MS
}

/**
 * Writes a localStorage lock for the current user/tab, detects if another
 * tab already holds a fresh lock, and returns the conflicting user's name
 * (or null if no conflict). Cleans up the lock on unmount and tab close.
 */
export function useEditLock(gopId: string, user: EditLockUser | null) {
  const [conflictName, setConflictName] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user?.email || !gopId) return

    const tabId = getTabId()
    const key   = lockKey(gopId)

    // ── 1. Read existing lock before writing ──────────────────────────────
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const existing: LockEntry = JSON.parse(raw)
        if (!isStale(existing) && existing.tabId !== tabId) {
          setConflictName(existing.lockedByName)
        }
      }
    } catch {
      // malformed entry — ignore
    }

    // ── 2. Write / refresh our lock (skip when tab is hidden) ─────────────
    const writeLock = () => {
      if (document.visibilityState === 'hidden') return
      try {
        const entry: LockEntry = {
          lockedBy:     user.email,
          lockedByName: user.name,
          lockedAt:     new Date().toISOString(),
          tabId,
        }
        localStorage.setItem(key, JSON.stringify(entry))
      } catch {
        // storage full or unavailable — silently skip
      }
    }

    writeLock()
    intervalRef.current = setInterval(writeLock, REFRESH_MS)

    // Resume heartbeat when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') writeLock()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ── 3. Release lock: unmount cleanup + browser tab close ──────────────
    const removeLock = () => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return
        const existing: LockEntry = JSON.parse(raw)
        // Only remove if we still own the entry (another user may have taken it)
        if (existing.tabId === tabId) localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }

    window.addEventListener('beforeunload', removeLock)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', removeLock)
      removeLock()
    }
  }, [gopId, user?.email, user?.name])

  return {
    /** Display name of the other user who has the lock, or null if no conflict */
    conflictName,
    /** Whether the user has dismissed the banner for this page session */
    dismissed,
    dismiss: () => setDismissed(true),
  }
}
