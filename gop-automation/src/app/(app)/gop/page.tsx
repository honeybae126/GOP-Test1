'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useGopStore } from '@/lib/gop-store'
import { PageHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { GOPRequestsTable } from '@/components/gop/gop-requests-table'
import { PlusCircle } from 'lucide-react'

export default function GOPRequestsPage() {
  const { data: session } = useSession()
  const allRequests = useGopStore((s) => s.requests)

  const role = session?.user?.role ?? ''
  const userName = session?.user?.name ?? ''
  const isStaff = role === 'INSURANCE_STAFF' || role === 'ADMIN'
  const isDoctor = role === 'DOCTOR'

  // Doctors only see requests assigned to them by name
  const requests = isDoctor
    ? allRequests.filter((r) => r.assignedDoctor === userName)
    : allRequests

  return (
    <div className="space-y-4">
      <PageHeader
        title="GOP Requests"
        description={
          isDoctor
            ? `Showing pre-authorisation requests assigned to you (${userName}).`
            : 'All Guarantee of Payment pre-authorisation requests.'
        }
      >
        {isStaff && (
          <Link href="/gop/new">
            <Button size="sm">
              <PlusCircle className="size-3 mr-1" />
              New GOP Request
            </Button>
          </Link>
        )}
      </PageHeader>

      {isDoctor && requests.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No GOP requests are currently assigned to <strong>{userName}</strong>.
          <br />
          Requests will appear here once Insurance Staff creates and assigns them
          to you.
        </div>
      )}

      {requests.length > 0 && (
        <GOPRequestsTable requests={requests} userRole={role} />
      )}
    </div>
  )
}
