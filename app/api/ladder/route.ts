import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import type { LadderReasonCode } from '@/types/ladder'
import {
  applyLadderDelta,
  buildLadderSummary,
  isSupportedLadderReason,
  LADDER_STEPS,
} from '@/lib/ladder-service'

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
      reason: event.reason as LadderReasonCode,
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

  if (!isSupportedLadderReason(reason)) {
    return NextResponse.json({ error: 'Unsupported reason code' }, { status: 400 })
  }

  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
  }

  const summary = await applyLadderDelta({
    userId: user.id,
    delta,
    reason,
    description,
    assignmentId: typeof assignmentId === 'string' ? assignmentId : undefined,
  })

  return NextResponse.json(summary)
}
