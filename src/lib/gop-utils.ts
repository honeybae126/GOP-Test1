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

export const DRAFT_SUB_STATUS_STYLES: Record<DraftSubStatus, { pill: string; dot: string; text: string }> = {
  'Awaiting surgeon':                  { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', text: 'text-amber-700' },
  'Awaiting anaesthetist assignment':  { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', text: 'text-amber-700' },
  'Awaiting anaesthetist':             { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', text: 'text-amber-700' },
  'Ready to finalise':                 { pill: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',  text: 'text-blue-700'  },
  'Ready to submit':                   { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500', text: 'text-green-700' },
}
