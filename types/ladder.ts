export type LadderStepKey =
  | 'initiate'
  | 'trailblazer'
  | 'scholar'
  | 'strategist'
  | 'luminary'
  | 'oracle'
  | 'legend'
  | 'icon'

export type LadderSummary = {
  step: LadderStepKey
  stepLabel: string
  level: number | null
  currentPoints: number
  currentFloor: number
  nextStepLabel: string | null
  nextStepPoints: number | null
  progressPercent: number
  recentEvents: Array<{
    id: string
    pointsChange: number
    label: string
    createdAt: string
    description?: string
    relativeTime: string
    reason: LadderReasonCode
  }>
}

export type LadderUpdatePayload = {
  delta: number
  reason: string
  description?: string
}

export type LadderThreshold = {
  step: LadderStepKey
  label: string
  minPoints: number
  maxPoints?: number
  hasLevels: boolean
}

export type LadderReasonCode =
  | 'task_completed'
  | 'task_early_bonus'
  | 'task_late_penalty'
  | 'manual_adjustment'
