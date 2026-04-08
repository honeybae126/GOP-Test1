import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { GOPStatusBadge } from '@/components/gop/gop-status-badge'
import type { MockGOPRequest } from '@/lib/mock-data'
import { ArrowRight } from 'lucide-react'

interface RecentRequestsTableProps {
  requests: MockGOPRequest[]
}

export function RecentRequestsTable({ requests }: RecentRequestsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">Recent GOP Requests</CardTitle>
          <CardDescription>Latest pre-authorisation requests across all insurers</CardDescription>
        </div>
        <Link href="/gop">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Insurer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.patientName}</TableCell>
                <TableCell>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                    {req.insurer}
                  </span>
                </TableCell>
                <TableCell>
                  <GOPStatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-sm">
                  ${req.estimatedAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {req.assignedDoctor}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(req.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <Link href={`/gop/${req.id}`}>
                    <Button variant="ghost" size="icon-sm">
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
