'use client'

import { useSession } from 'next-auth/react'
import { useActiveRole } from '@/hooks/useActiveRole'
import { useMemo, useState, useEffect } from 'react'
import { useGopStore } from '@/lib/gop-store'
import type { MockGOPRequest } from '@/lib/mock-data'
import { GOPRequestsTable } from '@/components/gop/gop-requests-table'
import Link from 'next/link'

const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED === 'true'

/** Best-effort adapter from Prisma /api/gop response to MockGOPRequest shape.
 *  Falls back to safe defaults for fields not yet stored in the DB model. */
function mapApiToMock(raw: unknown[]): MockGOPRequest[] {
  return raw.map((r: any) => ({
    id:                    r.id,
    resourceType:          'Task' as const,
    status:                r.status ?? 'DRAFT',
    priority:              'ROUTINE',
    patientId:             r.patientId ?? '',
    patientName:           r.patientName ?? r.patientId ?? 'Unknown',
    encounterId:           r.encounterId ?? '',
    coverageId:            r.coverageId ?? '',
    insurer:               r.insurer?.name ?? 'UNKNOWN',
    questionnaireId:       r.questionnaireId ?? '',
    assignedSurgeon:       r.assignedSurgeonId ?? null,
    assignedAnaesthetist:  r.assignedAnaesthetistId ?? null,
    doctorVerified:        false,
    surgeonVerified:       false,
    anaesthetistVerified:  false,
    financeVerified:       false,
    staffFinalised:        false,
    hasAiPrefill:          false,
    estimatedAmount:       0,
    cpi:                   1,
    pricingType:           'NORMAL' as const,
    appealOf:              null,
    appealVersion:         1,
    hasAppeal:             false,
    appealNotes:           '',
    appealStatus:          null,
    stageEnteredAt:        {},
    createdAt:             r.createdAt ?? new Date().toISOString(),
    updatedAt:             r.updatedAt ?? new Date().toISOString(),
    createdBy:             r.createdBy ?? '',
    quoteNumber:           r.quoteNumber ?? '',
    quoteDate:             r.quoteDate ?? new Date().toISOString().slice(0, 10),
    lineItems:             [],
    auditLog:              [],
  }))
}

export default function GOPRequestsPage() {
  const { data: session } = useSession()
  const role     = useActiveRole()
  const userName = session?.user?.name ?? ''
  const isDoctor = role === 'DOCTOR'
  const isStaff  = role === 'INSURANCE_STAFF' || role === 'IT_ADMIN'

  const mockRequests = useGopStore((s) => s.requests) ?? []

  const [apiRequests, setApiRequests] = useState<MockGOPRequest[]>([])
  const [apiLoading, setApiLoading]   = useState(false)

  useEffect(() => {
    if (isDemoEnabled) return
    setApiLoading(true)
    fetch('/api/gop')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setApiRequests(mapApiToMock(Array.isArray(json) ? json : []))
      })
      .catch(() => setApiRequests([]))
      .finally(() => setApiLoading(false))
  }, [])

  const allRequests = isDemoEnabled ? mockRequests : apiRequests

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
