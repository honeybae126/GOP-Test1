'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const DEMO_ROLE_KEY = 'gop-demo-role'

export function useActiveRole(): string {
  const { data: session } = useSession()
  const sessionRole = session?.user?.role ?? ''

  const [activeRole, setActiveRole] = useState<string>(sessionRole)

  useEffect(() => {
    function syncRole() {
      const stored = localStorage.getItem(DEMO_ROLE_KEY)
      setActiveRole(stored ?? sessionRole)
    }
    syncRole()
    window.addEventListener('storage', syncRole)
    return () => window.removeEventListener('storage', syncRole)
  }, [sessionRole])

  return activeRole
}
