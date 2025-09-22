import { prisma } from '@/lib/db'
import type { LadderReasonCode, LadderSummary, LadderThreshold } from '@/types/ladder'

export const LADDER_STEPS: LadderThreshold[] = [
  { step: 'initiate', label: 'Initiate', minPoints: 0, maxPoints: 499, hasLevels: true },
  { step: 'trailblazer', label: 'Trailblazer', minPoints: 500, maxPoints: 999, hasLevels: true },
  { step: 'scholar', label: 'Scholar', minPoints: 1000, maxPoints: 1499, hasLevels: true },
  { step: 'strategist', label: 'Strategist', minPoints: 1500, maxPoints: 1999, hasLevels: true },
  { step: 'luminary', label: 'Luminary', minPoints: 2000, maxPoints: 2499, hasLevels: true },
  { step: 'oracle', label: 'Oracle', minPoints: 2500, maxPoints: 2999, hasLevels: true },
  { step: 'legend', label: 'Legend', minPoints: 3000, maxPoints: 3499, hasLevels: true },
  { step: 'icon', label: 'Icon', minPoints: 3500, hasLevels: false },
]

export const LADDER_REASON_CODES: LadderReasonCode[] = [
  'task_completed',
  'task_early_bonus',
  'task_late_penalty',
  'manual_adjustment',
] as const

export function isSupportedLadderReason(reason: unknown): reason is LadderReasonCode {
  return typeof reason === 'string' && LADDER_REASON_CODES.includes(reason as LadderReasonCode)
}

const LADDER_REASON_LABELS: Record<LadderReasonCode, string> = {
  task_completed: 'Assignment completed',
  task_early_bonus: 'Early bonus',
  task_late_penalty: 'Late penalty',
  manual_adjustment: 'Manual adjustment',
}

function computeRelativeTime(from: Date, to: Date = new Date()): string {
  const diffSeconds = Math.round((from.getTime() - to.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'seconds'],
    [60, 'minutes'],
    [24, 'hours'],
    [7, 'days'],
    [4.34524, 'weeks'],
    [12, 'months'],
    [Number.POSITIVE_INFINITY, 'years'],
  ]

  let duration = diffSeconds
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) {
      return rtf.format(duration, unit)
    }
    duration = Math.round(duration / amount)
  }

  return rtf.format(duration, 'years')
}

export function resolveLadderStep(pointTotal: number): LadderThreshold {
  const ordered = [...LADDER_STEPS].sort((a, b) => b.minPoints - a.minPoints)
  for (const threshold of ordered) {
    if (pointTotal >= threshold.minPoints) {
      return threshold
    }
  }
  return LADDER_STEPS[0]
}

export function computeLevel(pointTotal: number, threshold: LadderThreshold): number | null {
  if (!threshold.hasLevels || threshold.maxPoints === undefined) {
    return null
  }

  const span = threshold.maxPoints - threshold.minPoints + 1
  const levelCount = 5
  const bucketSize = Math.max(1, Math.floor(span / levelCount))

  const pointsIntoStep = pointTotal - threshold.minPoints
  const bucketIndex = Math.min(levelCount - 1, Math.floor(pointsIntoStep / bucketSize))

  return levelCount - bucketIndex
}

type LadderSummaryInput = {
  pointTotal: number
  events: {
    id: string
    pointsChange: number
    reason: LadderReasonCode
    description: string | null
    createdAt: Date
  }[]
}

export function buildLadderSummary({ pointTotal, events }: LadderSummaryInput): LadderSummary {
  const clampedPoints = Math.max(0, Math.floor(pointTotal))
  const step = resolveLadderStep(clampedPoints)
  const level = computeLevel(clampedPoints, step)

  const nextStepIndex = LADDER_STEPS.findIndex((t) => t.step === step.step) + 1
  const nextStep = LADDER_STEPS[nextStepIndex] ?? null

  const currentFloor = step.minPoints
  const nextStepPoints = nextStep?.minPoints ?? null
  const progressPercent = (() => {
    if (!step.maxPoints) return nextStep ? 0 : 100
    const span = step.maxPoints - step.minPoints
    if (span <= 0) return 100
    return ((clampedPoints - step.minPoints) / span) * 100
  })()

  return {
    step: step.step,
    stepLabel: step.label,
    level,
    currentPoints: clampedPoints,
    currentFloor,
    nextStepLabel: nextStep?.label ?? null,
    nextStepPoints,
    progressPercent,
    recentEvents: events.map((event) => ({
      id: event.id,
      pointsChange: event.pointsChange,
      label: LADDER_REASON_LABELS[event.reason] ?? event.reason,
      description: event.description ?? undefined,
      createdAt: event.createdAt.toISOString(),
      relativeTime: computeRelativeTime(event.createdAt),
      reason: event.reason,
    })),
  }
}

type LadderDeltaInput = {
  userId: string
  delta: number
  reason: LadderReasonCode
  description?: string
  assignmentId?: string
}

export async function applyLadderDelta(input: LadderDeltaInput): Promise<LadderSummary> {
  const { userId, delta, reason, description, assignmentId } = input

  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error('Invalid ladder delta')
  }

  return prisma.$transaction(async (tx) => {
    let standing = await tx.ladderStanding.findUnique({ where: { userId } })

    if (!standing) {
      standing = await tx.ladderStanding.create({
        data: {
          userId,
          points: 0,
          stepLabel: 'Initiate',
          level: 5,
        },
      })
    }

    const newPointsTotal = Math.max(0, standing.points + delta)
    const step = resolveLadderStep(newPointsTotal)
    const level = computeLevel(newPointsTotal, step)

    await tx.ladderStanding.update({
      where: { userId },
      data: {
        points: newPointsTotal,
        stepLabel: step.label,
        level,
      },
    })

    await tx.ladderEvent.create({
      data: {
        userId,
        assignmentId: assignmentId ?? null,
        pointsChange: delta,
        reason,
        description: description ?? null,
      },
    })

    const refreshedEvents = await tx.ladderEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return buildLadderSummary({
      pointTotal: newPointsTotal,
      events: refreshedEvents.map((event) => ({
        id: event.id,
        pointsChange: event.pointsChange,
        reason: event.reason as LadderReasonCode,
        description: event.description,
        createdAt: event.createdAt,
      })),
    })
  })
}
