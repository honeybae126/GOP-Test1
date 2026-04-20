import type { MockGOPRequest, GOPPriority } from './mock-data'

// ─── Stage keys ───────────────────────────────────────────────────────────────

export type SLAStage =
  | 'awaiting_surgeon'
  | 'awaiting_anaesthetist'
  | 'awaiting_finance'
  | 'awaiting_finalisation'
  | 'awaiting_submission'
  | 'submitted'
  | 'resolved'

export const STAGE_LABELS: Record<SLAStage, string> = {
  awaiting_surgeon:       'Awaiting surgeon verification',
  awaiting_anaesthetist:  'Awaiting anaesthetist verification',
  awaiting_finance:       'Awaiting finance sign-off',
  awaiting_finalisation:  'Awaiting staff finalisation',
  awaiting_submission:    'Ready to submit',
  submitted:              'Submitted to insurer',
  resolved:               'Resolved',
}

// ─── SLA thresholds (hours) ────────────────────────────────────────────────

const SLA_HOURS: Record<GOPPriority, Record<string, number>> = {
  EMERGENCY: {
    awaiting_surgeon:      2,
    awaiting_anaesthetist: 2,
    awaiting_finance:      1,
    awaiting_finalisation: 1,
    awaiting_submission:   1,
  },
  URGENT: {
    awaiting_surgeon:      8,
    awaiting_anaesthetist: 8,
    awaiting_finance:      4,
    awaiting_finalisation: 4,
    awaiting_submission:   4,
  },
  ROUTINE: {
    awaiting_surgeon:      48,
    awaiting_anaesthetist: 48,
    awaiting_finance:      24,
    awaiting_finalisation: 24,
    awaiting_submission:   24,
  },
}

export function getSLAThreshold(priority: GOPPriority, stage: string): number {
  return SLA_HOURS[priority]?.[stage] ?? 48
}

// ─── Current stage derivation ─────────────────────────────────────────────

export function getCurrentStage(req: MockGOPRequest): SLAStage {
  if (req.status === 'APPROVED' || req.status === 'REJECTED' || req.status === 'EXPIRED') {
    return 'resolved'
  }
  if (req.status === 'SUBMITTED') return 'submitted'

  const surgeonDone      = req.surgeonVerified      ?? req.doctorVerified ?? false
  const anaesthetistDone = req.anaesthetistVerified ?? req.doctorVerified ?? false

  if (!surgeonDone)      return 'awaiting_surgeon'
  if (!anaesthetistDone) return 'awaiting_anaesthetist'
  if (!req.financeVerified) return 'awaiting_finance'
  if (!req.staffFinalised)  return 'awaiting_finalisation'
  return 'awaiting_submission'
}

// ─── SLA status calculation ────────────────────────────────────────────────

export interface SLAStatus {
  stage: SLAStage
  stageLabel: string
  enteredAt: string | null
  thresholdHours: number
  elapsedHours: number
  remainingHours: number
  isOverdue: boolean
  isWarning: boolean
  percentUsed: number
}

export function getSLAStatus(req: MockGOPRequest, now = Date.now()): SLAStatus {
  const stage = getCurrentStage(req)
  const thresholdHours = getSLAThreshold(req.priority, stage)
  const enteredAt = req.stageEnteredAt?.[stage] ?? null

  if (!enteredAt || stage === 'resolved') {
    return {
      stage,
      stageLabel: STAGE_LABELS[stage],
      enteredAt,
      thresholdHours,
      elapsedHours: 0,
      remainingHours: thresholdHours,
      isOverdue: false,
      isWarning: false,
      percentUsed: 0,
    }
  }

  const elapsedMs   = now - new Date(enteredAt).getTime()
  const elapsedHours   = elapsedMs / (1000 * 60 * 60)
  const remainingHours = thresholdHours - elapsedHours
  const percentUsed    = Math.min(100, (elapsedHours / thresholdHours) * 100)
  const isOverdue      = elapsedHours > thresholdHours
  // Warning = within the last 20% of the threshold (80–100% used)
  const isWarning      = !isOverdue && percentUsed >= 60

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    enteredAt,
    thresholdHours,
    elapsedHours,
    remainingHours,
    isOverdue,
    isWarning,
    percentUsed,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export function formatElapsed(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60)
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }
  if (hours <= 48) {
    const h = Math.round(hours)
    return `${h} hour${h !== 1 ? 's' : ''}`
  }
  const days = Math.round(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''}`
}

export function getDaysUntilExpiry(expiresAt: string, now = Date.now()): number {
  return (new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24)
}
