'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useMemo } from 'react'
import { useGopStore } from '@/lib/gop-store'
import { GOPRequestsTable } from '@/components/gop/gop-requests-table'
import { PlusCircle } from 'lucide-react'

export default function GOPRequestsPage() {
  const { data: session } = useSession()
  const allRequests = useGopStore((s) => s.requests) ?? []

  const role          = session?.user?.role ?? ''
  const userName      = session?.user?.name ?? ''
  const isInsuranceStaff = role === 'INSURANCE_STAFF'
  const isITAdmin     = role === 'IT_ADMIN'
  const isStaff       = isInsuranceStaff || isITAdmin
  const isDoctor      = role === 'DOCTOR'

  const requests = useMemo(() => {
    if (!allRequests) return []
    return isDoctor
      ? allRequests.filter(r => r.assignedSurgeon === userName || r.assignedAnaesthetist === userName)
      : allRequests
  }, [allRequests, isDoctor, userName])

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1 }}>GOP Requests</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
            {isDoctor
              ? `Showing pre-authorisation requests assigned to you (${userName}).`
              : 'All Guarantee of Payment pre-authorisation requests.'}
          </p>
        </div>
        {isStaff && (
          <Link href="/gop/new" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px',
              background: 'var(--blue-600)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(45,107,244,0.3)',
            }}
              className="hover:bg-[var(--blue-700)] transition-colors"
            >
              <PlusCircle style={{ width: 15, height: 15 }} />
              New GOP Request
            </button>
          </Link>
        )}
      </div>

      {isDoctor && requests.length === 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          padding: '60px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 8 }}>
            No GOP requests assigned
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', maxWidth: 400, margin: '0 auto' }}>
            Requests will appear here once Insurance Staff creates and assigns them to you.
          </p>
        </div>
      )}

      {requests.length > 0 && (
        <GOPRequestsTable requests={requests} userRole={role} />
      )}
    </div>
  )
}
