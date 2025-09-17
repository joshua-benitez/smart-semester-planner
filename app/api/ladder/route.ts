import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import type { LadderThreshold } from '@/types/ladder'

// Draft ladder steps (adjust labels + point thresholds to match your design)
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

export async function GET() {
  const user = await requireAuth()

  const fetchedStanding = await prisma.ladderStanding.findUnique({
    where: { userId: user.id },
  })

  const fetchedEvents = await prisma.ladderEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const summary = buildLadderSummary({
    pointTotal: fetchedStanding?.points ?? 0,
    events: fetchedEvents.map((event) => ({
      id: event.id,
      pointsChange: event.pointsChange,
      reason: event.reason,
      description: event.description,
      createdAt: event.createdAt,
    })),
  })

  return NextResponse.json(summary)
}

export async function POST(req: NextRequest) {
  const user = await requireAuth()
  const payload = await req.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { delta, reason, description, assignmentId } = payload

  if (
    typeof delta !== 'number' ||
    !Number.isInteger(delta) ||
    delta === 0 ||
    typeof reason !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
  }

  const allowedReasons = new Set([
    'task_completed',
    'task_early_bonus',
    'task_late_penalty',
    'manual_adjustment',
  ])

  if (!allowedReasons.has(reason)) {
    return NextResponse.json({ error: 'Unsupported reason code' }, { status: 400 })
  }

  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
  }

  const currentStanding = await prisma.ladderStanding.findUnique({
    where: { userId: user.id },
  })

  const standing =
    currentStanding ??
    (await prisma.ladderStanding.create({
      data: {
        userId: user.id,
        points: 0,
        stepLabel: 'Initiate',
        level: 5,
      },
    }))

  const newPointsTotal = Math.max(0, standing.points + delta)
  const step = resolveLadderStep(newPointsTotal)
  const level = computeLevel(newPointsTotal, step)

  await prisma.ladderStanding.update({
    where: { userId: user.id },
    data: {
      points: newPointsTotal,
      stepLabel: step.label,
      level,
    },
  })

  await prisma.ladderEvent.create({
    data: {
      userId: user.id,
      pointsChange: delta,
      reason,
      description: description ?? null,
      ...(typeof assignmentId === 'string' ? { assignmentId } : {}),
    },
  })

  const refreshedEvents = await prisma.ladderEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const summary = buildLadderSummary({
    pointTotal: newPointsTotal,
    events: refreshedEvents.map((event) => ({
      id: event.id,
      pointsChange: event.pointsChange,
      reason: event.reason,
      description: event.description,
      createdAt: event.createdAt,
    })),
  })

  return NextResponse.json(summary)
}

// Helper: find ladder step for a given point total
export function resolveLadderStep(pointTotal: number): LadderThreshold {
  // Jump through thresholds from highest to lowest so we pick the deepest step that the points qualify for
  const ordered = [...LADDER_STEPS].sort((a, b) => b.minPoints - a.minPoints)
  for (const threshold of ordered) {
    if (pointTotal >= threshold.minPoints) {
      return threshold
    }
  }

  // Fallback to the very first step (should only hit if points are negative prior to clamping)
  return LADDER_STEPS[0]
}

// Helper: compute level within a step (if you keep levels)
export function computeLevel(pointTotal: number, threshold: LadderThreshold): number | null {
  if (!threshold.hasLevels || threshold.maxPoints === undefined) {
    return null
  }

  // Each step spans a fixed point window. With five levels we can map 0-99 → Level 5, …, 400-499 → Level 1.
  const span = threshold.maxPoints - threshold.minPoints + 1
  const levelCount = 5 // adjust this if the ladder uses a different number of levels per step
  const bucketSize = Math.max(1, Math.floor(span / levelCount))

  const pointsIntoStep = pointTotal - threshold.minPoints
  const bucketIndex = Math.min(levelCount - 1, Math.floor(pointsIntoStep / bucketSize))

  // Convert bucket index (0 == lowest bucket) into Level numbers (5=lowest, …, 1=top)
  return levelCount - bucketIndex
}

// Helper: convert Prisma rows into the API response structure
export function buildLadderSummary(params: {
  pointTotal: number
  events: { id: string; pointsChange: number; reason: string; description: string | null; createdAt: Date }[]
}) {
  const { pointTotal, events } = params

  const clampedPoints = Math.max(0, Math.floor(pointTotal))
  const step = resolveLadderStep(clampedPoints)
  const level = computeLevel(clampedPoints, step)

  // Progress toward the next step
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
      label: event.reason,
      description: event.description ?? undefined,
      createdAt: event.createdAt.toISOString(),
    })),
  }
}
