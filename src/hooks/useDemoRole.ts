'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const DEMO_ROLE_KEY = 'gop-demo-role'

const ROLE_REDIRECTS: Record<string, string> = {
  IT_ADMIN:         '/',
  INSURANCE_STAFF:  '/',
  DOCTOR:           '/dashboard/doctor',
  FINANCE:          '/finance',
}

const ROLE_LABELS: Record<string, string> = {
  IT_ADMIN:         'IT Admin',
  INSURANCE_STAFF:  'Insurance Staff',
  DOCTOR:           'Doctor',
  FINANCE:          'Finance',
}

export function useDemoRole() {
  const { data: session } = useSession()
  const router = useRouter()

  const sessionRole = session?.user?.role ?? 'IT_ADMIN'

  const [activeRole, setActiveRole] = useState<string>(sessionRole)

  useEffect(() => {
    const stored = localStorage.getItem(DEMO_ROLE_KEY)
    if (stored) setActiveRole(stored)
    else setActiveRole(sessionRole)
  }, [sessionRole])

function switchRole(role: string) {
  localStorage.setItem(DEMO_ROLE_KEY, role)
  setActiveRole(role)
  // Hard redirect ensures the new role's layout and sidebar load correctly
  window.location.href = ROLE_REDIRECTS[role] ?? '/'
}

function clearDemoRole() {
  localStorage.removeItem(DEMO_ROLE_KEY)
  setActiveRole(sessionRole)
  window.location.href = ROLE_REDIRECTS[sessionRole] ?? '/'
}

  return {
    activeRole,
    sessionRole,
    switchRole,
    clearDemoRole,
    roleLabel: ROLE_LABELS[activeRole] ?? activeRole,
    isDemoOverride: activeRole !== sessionRole,
  }
}
