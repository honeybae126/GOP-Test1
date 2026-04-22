import type { MockGOPRequest } from './mock-data'

export type DraftSubStatus =
  | 'Awaiting surgeon'
  | 'Awaiting anaesthetist assignment'
  | 'Awaiting anaesthetist'
  | 'Ready to finalise'
  | 'Ready to submit'

export function getDraftSubStatus(req: MockGOPRequest): DraftSubStatus | null {
  if (req.status !== 'DRAFT') return null

  const surgeonDone = req.surgeonVerified ?? req.doctorVerified ?? false
  const anaesthetistDone = req.anaesthetistVerified ?? req.doctorVerified ?? false

  if (!surgeonDone) return 'Awaiting surgeon'
  if (req.assignedAnaesthetist === null) return 'Awaiting anaesthetist assignment'
  if (!anaesthetistDone) return 'Awaiting anaesthetist'
  if (!req.staffFinalised) return 'Ready to finalise'
  return 'Ready to submit'
}

export const DRAFT_SUB_STATUS_STYLES: Record<DraftSubStatus, { color: string; bg: string; border: string }> = {
  'Awaiting surgeon':                  { bg: 'rgba(245,158,11,0.1)', color: '#92400E', border: '#FDE68A' },
  'Awaiting anaesthetist assignment':  { bg: 'rgba(245,158,11,0.1)', color: '#92400E', border: '#FDE68A' },
  'Awaiting anaesthetist':             { bg: 'rgba(245,158,11,0.1)', color: '#92400E', border: '#FDE68A' },
  'Ready to finalise':                 { bg: 'rgba(59,130,246,0.1)', color: '#1D4ED8', border: '#BFDBFE' },
  'Ready to submit':                   { bg: 'rgba(16,185,129,0.1)', color: '#065F46', border: '#A7F3D0' },
}
