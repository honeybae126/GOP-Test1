'use client'

import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BillingForm } from '@/components/billing/billing-form'

const ALLOWED_ROLES = ['INSURANCE_STAFF', 'IT_ADMIN', 'ADMIN', 'BILLING_STAFF']

export default function BillingPage() {
  const { status } = useSession()
  const role   = useActiveRole()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin')
    if (status === 'authenticated' && role && !ALLOWED_ROLES.includes(role)) {
      router.replace('/gop')
    }
  }, [status, role, router])

  if (status === 'loading' || !role) return null
  if (!ALLOWED_ROLES.includes(role)) return null

  // Full-bleed — no GOP header chrome, matches HIS window style
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <BillingForm />
    </div>
  )
}
