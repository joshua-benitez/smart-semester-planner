import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'
import type { LadderReasonCode } from '@/types/ladder'
import {
  applyLadderDelta,
  buildLadderSummary,
  isSupportedLadderReason,
  LADDER_STEPS,
} from '@/lib/ladder-service'
import { ok, err } from '@/server/responses'

// GET -> return the latest ladder summary + event feed for the signed-in student
export async function GET() {
  try {
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

    return ok(summary)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    console.error('Error fetching ladder summary:', error)
    return err('Failed to fetch ladder', 500, 'server_error')
  }
}

// POST -> apply a point delta (server-validated) and hand back the new summary
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const payload = await req.json().catch(() => null)
    if (!payload) {
      return err('Invalid payload', 400, 'validation_error')
    }

    const { delta, reason, description, assignmentId } = payload

    if (
      typeof delta !== 'number' ||
      !Number.isInteger(delta) ||
      delta === 0 ||
      typeof reason !== 'string'
    ) {
      return err('Invalid payload structure', 400, 'validation_error')
    }

    if (!isSupportedLadderReason(reason)) {
      return err('Unsupported reason code', 400, 'validation_error')
    }

    if (description !== undefined && typeof description !== 'string') {
      return err('Description must be a string', 400, 'validation_error')
    }

    let resolvedAssignmentId: string | undefined
    if (typeof assignmentId === 'string') {
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, userId: user.id },
        select: { id: true },
      })
      if (!assignment) {
        return err('Assignment not found', 404, 'not_found')
      }
      resolvedAssignmentId = assignment.id
    }

    const summary = await applyLadderDelta({
      userId: user.id,
      delta,
      reason,
      description,
      assignmentId: resolvedAssignmentId,
    })

    return ok(summary)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    console.error('Error applying ladder delta:', error)
    return err('Failed to update ladder', 500, 'server_error')
  }
}
