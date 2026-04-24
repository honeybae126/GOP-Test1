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
      router.replace('/gop') // redirect non-billing roles
    }
  }, [status, role, router])

  if (status === 'loading' || !role) return null
  if (!ALLOWED_ROLES.includes(role)) return null

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">Billing / Quotation</h1>
          <p className="header-subtitle">
            Create and manage quotations — data loaded from the Hospital Information System
          </p>
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-lg)' }}>
        <BillingForm />
      </div>
    </div>
  )
}
