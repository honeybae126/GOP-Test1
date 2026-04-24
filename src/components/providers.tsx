'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import { useGopStore } from '@/lib/gop-store'

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
const SYSTEM_PERFORMER = { name: 'system', role: 'SYSTEM' }
const SYSTEM_DETAIL = 'Auto-expired after 30 days without insurer response'

/**
 * Checks for overdue SUBMITTED requests on app load and every 24 hours.
 * Visibility-aware: skips the check while the tab is hidden.
 * Updates Zustand store immediately, then fires the API to sync the DB.
 */
function ExpiryChecker() {
  useEffect(() => {
    function check() {
      if (document.hidden) return

      const { requests, setExpired } = useGopStore.getState()
      const now = Date.now()

      const overdue = requests ? requests.filter(
        (r) =>
          r.status === 'SUBMITTED' &&
          r.expiresAt != null &&
          new Date(r.expiresAt).getTime() < now
      ) : [];

      // Update Zustand store immediately (reactive UI update)
      overdue.forEach((r) => setExpired(r.id, SYSTEM_PERFORMER, SYSTEM_DETAIL))

      // Sync Prisma DB (fire-and-forget, non-fatal)
      fetch('/api/gop/check-expiry').catch(() => {})
    }

    // Run once on mount
    check()

    // Re-run every 24 hours
    const interval = setInterval(check, TWENTY_FOUR_HOURS)

    // Re-run when tab becomes visible again
    document.addEventListener('visibilitychange', check)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, []) // stable — uses getState() so no deps needed

  return null
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <ExpiryChecker />
      {children}
    </SessionProvider>
  )
}
