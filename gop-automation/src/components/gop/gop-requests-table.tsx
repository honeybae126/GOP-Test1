'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GOPStatusBadge } from './gop-status-badge'
import type { MockGOPRequest, GOPStatus, InsurerCode } from '@/lib/mock-data'
import { Search, ArrowRight, CheckCircle, XCircle, Stethoscope } from 'lucide-react'

interface GOPRequestsTableProps {
  requests: MockGOPRequest[]
  userRole: string
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
]

const INSURER_OPTIONS = [
  { value: 'all', label: 'All Insurers' },
  { value: 'APRIL', label: 'APRIL' },
  { value: 'HSC', label: 'HSC' },
  { value: 'LUMA', label: 'LUMA' },
  { value: 'AIA', label: 'AIA' },
  { value: 'ASSURNET', label: 'ASSURNET' },
]

export function GOPRequestsTable({ requests, userRole }: GOPRequestsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [insurerFilter, setInsurerFilter] = useState('all')

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        r.patientName.toLowerCase().includes(q) ||
        r.id.includes(q) ||
        r.assignedDoctor.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      const matchInsurer = insurerFilter === 'all' || r.insurer === insurerFilter
      return matchSearch && matchStatus && matchInsurer
    })
  }, [requests, search, statusFilter, insurerFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search patient, doctor…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={insurerFilter} onValueChange={setInsurerFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INSURER_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Insurer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Estimated Cost</TableHead>
              {userRole !== 'DOCTOR' && <TableHead>Assigned Doctor</TableHead>}
              <TableHead>Verification</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(req => (
              <TableRow key={req.id} className="group">
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{req.patientName}</div>
                    <div className="text-xs text-muted-foreground font-mono">#{req.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                    {req.insurer}
                  </span>
                </TableCell>
                <TableCell>
                  <GOPStatusBadge status={req.status} />
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">${req.estimatedAmount.toLocaleString()}</div>
                  {req.approvedAmount && (
                    <div className="text-xs text-green-600">Approved: ${req.approvedAmount.toLocaleString()}</div>
                  )}
                </TableCell>
                {userRole !== 'DOCTOR' && (
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Stethoscope className="size-3.5" />
                      {req.assignedDoctor}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {req.doctorVerified ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="size-3" />
                        Doctor
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <XCircle className="size-3" />
                        Pending
                      </div>
                    )}
                    {req.hasAiPrefill && (
                      <Badge variant="outline" className="text-[9px] px-1 h-4 bg-violet-50 text-violet-700 border-violet-200">
                        AI
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(req.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short',
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={userRole === 'DOCTOR' ? 7 : 8} className="text-center py-10 text-muted-foreground text-sm">
                  No GOP requests match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
