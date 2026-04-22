'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { useGopStore } from '@/lib/gop-store'
import { GOPRequestsTable } from '@/components/gop/gop-requests-table'
import Link from 'next/link'

export default function GOPRequestsPage() {
  const { data: session } = useSession()
  const allRequests = useGopStore((s) => s.requests) ?? []

  const role     = session?.user?.role ?? ''
  const userName = session?.user?.name ?? ''
  const isDoctor = role === 'DOCTOR'
  const isStaff  = role === 'INSURANCE_STAFF' || role === 'IT_ADMIN'

  const requests = useMemo(() => {
    if (!allRequests) return []
    return isDoctor
      ? allRequests.filter(r => r.assignedSurgeon === userName || r.assignedAnaesthetist === userName)
      : allRequests
  }, [allRequests, isDoctor, userName])

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="dashboard-header">
        <div>
          <h1 className="header-title">GOP Requests</h1>
          <p className="header-subtitle">
            {isDoctor
              ? `Requests assigned to you · ${userName}`
              : 'All Guarantee of Payment pre-authorisation requests'}
          </p>
        </div>
        {isStaff && (
          <Link href="/gop/new" className="btn btn-primary" style={{ height: 40, paddingInline: '1.125rem', fontSize: '0.875rem' }}>
            <i className="fas fa-plus" />
            New Request
          </Link>
        )}
      </div>

      <div style={{ padding: 'var(--spacing-lg)' }}>
        {isDoctor && requests.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4rem 2rem', textAlign: 'center',
            background: 'white', border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
          }}>
            <div className="metric-icon blue" style={{ margin: '0 auto 1rem' }}>
              <i className="fas fa-file-medical" />
            </div>
            <p style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.375rem' }}>No GOP requests assigned</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--muted-foreground)', maxWidth: 320 }}>
              Requests will appear here once Insurance Staff creates and assigns them to you.
            </p>
          </div>
        ) : (
          <GOPRequestsTable requests={requests} userRole={role} />
        )}
      </div>
    </div>
  )
}
