'use client'

import { Button } from '@/components/ui/button'
import { Download, FileWarning } from 'lucide-react'
import type { GOPStatus } from '@/lib/mock-data'

interface DownloadPdfButtonProps {
  gopId: string
  status?: GOPStatus
}

export function DownloadPdfButton({ gopId, status }: DownloadPdfButtonProps) {
  const isRejected = status === 'REJECTED'

  return (
    <Button
      size="sm"
      variant={isRejected ? 'outline' : 'outline'}
      className={isRejected ? 'w-full justify-start border-red-200 text-red-700 hover:bg-red-50' : 'w-full justify-start'}
      onClick={() => window.open(`/print/gop/${gopId}`, '_blank')}
    >
      {isRejected
        ? <FileWarning className="size-3.5 mr-1.5" />
        : <Download className="size-3.5 mr-1.5" />}
      {isRejected ? 'Download Rejection Record' : 'Download PDF'}
    </Button>
  )
}
