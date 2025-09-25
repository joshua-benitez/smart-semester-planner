import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { applyLadderDelta } from '@/lib/ladder-service'
import type { LadderReasonCode } from '@/types/ladder'
import { z } from 'zod'
import { UnauthorizedError } from '@/lib/errors'

// Lightweight runtime validation helper
function isNonEmptyString(x: any): x is string {
  return typeof x === 'string' && x.trim().length > 0
}
async function findOrCreateCourseForUser(userId: string, courseName: string) {
  let course = await prisma.course.findFirst({ where: { name: courseName, userId } })
  if (!course) {
    try {
      course = await prisma.course.create({ data: { name: courseName, userId } })
    } catch (error: any) {
      if (error.code === 'P2002') {
        course = await prisma.course.findFirst({ where: { name: courseName, userId } })
      } else {
        throw error
      }
    }
  }
  if (!course) {
    throw new Error('Course not found after creation attempt')
  }
  return course
}

const COMPLETION_REWARD = 40
const EARLY_BONUS = 15
const LATE_PENALTY = 20
const EARLY_THRESHOLD_MS = 12 * 60 * 60 * 1000
const LATE_GRACE_MS = 30 * 60 * 1000
const HOUR_IN_MS = 60 * 60 * 1000

type LadderAdjustment = {
  delta: number
  reason: LadderReasonCode
  description: string
}

function describeOffset(diffMs: number, suffix: 'early' | 'late') {
  const magnitudeMs = Math.abs(diffMs)
  const hours = Math.max(1, Math.round(magnitudeMs / HOUR_IN_MS))
  if (hours >= 24) {
    const days = Math.max(1, Math.round(hours / 24))
    return `${days}d ${suffix}`
  }
  return `${hours}h ${suffix}`
}

// Zod schemas
const AssignmentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  dueDate: z.union([z.string(), z.date()])
    .transform((v) => (typeof v === 'string' ? new Date(v) : v))
    .refine((d) => d instanceof Date && !isNaN(d.getTime()), { message: 'Invalid dueDate' }),
  type: z.enum(['homework', 'quiz', 'project', 'exam']).optional(),
  difficulty: z.enum(['easy', 'moderate', 'crushing', 'brutal']).optional(),
  // Weight as percentage (0-100)
  weight: z.number().min(0).max(100).optional(),
  courseName: z.string().min(1),
  submittedAt: z.union([z.string(), z.date()]).optional(),
  submissionNote: z.string().max(500).optional(),
})

const AssignmentUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  type: z.enum(['homework', 'quiz', 'project', 'exam']).optional(),
  difficulty: z.enum(['easy', 'moderate', 'crushing', 'brutal']).optional(),
  weight: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  courseName: z.string().optional(),
  submittedAt: z.union([z.string(), z.date(), z.null()]).optional(),
  submissionNote: z.string().max(500).nullable().optional(),
})

// GET: fetch all assignments (with course)
export async function GET() {
  try {
    const user = await requireAuth()
    const assignments = await prisma.assignment.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { dueDate: 'asc' }
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST: create new assignment
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const json = await request.json()
    const parsed = AssignmentCreateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const course = await findOrCreateCourseForUser(user.id, parsed.data.courseName)

    let submittedAt: Date | null = null
    if (parsed.data.submittedAt) {
      const value = typeof parsed.data.submittedAt === 'string'
        ? new Date(parsed.data.submittedAt)
        : parsed.data.submittedAt
      if (isNaN(value.getTime())) {
        return NextResponse.json({ error: 'Invalid submittedAt' }, { status: 400 })
      }
      submittedAt = value
    }

    const submissionNote = parsed.data.submissionNote
      ? parsed.data.submissionNote.trim()
      : ''

    const assignment = await prisma.assignment.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? '',
        dueDate: parsed.data.dueDate,
        type: parsed.data.type ?? 'homework',
        difficulty: parsed.data.difficulty ?? 'moderate',
        weight: parsed.data.weight ?? 1.0,
        userId: user.id,
        courseId: course.id,
        submittedAt,
        submissionNote: submissionNote ? submissionNote : null,
      }
    })

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment
    })
  } catch (error) {
    console.error('Error creating assignment:', error)
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

// PUT: update an assignment
export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const json = await request.json()
    const parsed = AssignmentUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Find assignment by ID
    const existing = await prisma.assignment.findFirst({
      where: { id: parsed.data.id, userId: user.id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Build update payload only with provided fields
    const updateData: any = {}
    const nextTitle = parsed.data.title ?? existing.title
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.difficulty !== undefined) updateData.difficulty = parsed.data.difficulty
    if (parsed.data.weight !== undefined) updateData.weight = parsed.data.weight

    const nextStatus = parsed.data.status ?? existing.status
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status

    let nextDueDate = existing.dueDate
    if (parsed.data.dueDate !== undefined) {
      const d = typeof parsed.data.dueDate === 'string' ? new Date(parsed.data.dueDate) : parsed.data.dueDate
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
      updateData.dueDate = d
      nextDueDate = d
    }

    if (parsed.data.courseName) {
      const course = await findOrCreateCourseForUser(user.id, parsed.data.courseName)
      updateData.courseId = course.id
    }

    let nextSubmittedAt: Date | null = existing.submittedAt ? new Date(existing.submittedAt) : null
    const submittedAtPayload = parsed.data.submittedAt
    if (submittedAtPayload !== undefined) {
      if (submittedAtPayload === null) {
        nextSubmittedAt = null
        updateData.submittedAt = null
      } else {
        const submittedDate = typeof submittedAtPayload === 'string' ? new Date(submittedAtPayload) : submittedAtPayload
        if (isNaN(submittedDate.getTime())) {
          return NextResponse.json({ error: 'Invalid submittedAt' }, { status: 400 })
        }
        nextSubmittedAt = submittedDate
        updateData.submittedAt = submittedDate
      }
    }

    if (parsed.data.submissionNote !== undefined) {
      const note = parsed.data.submissionNote
      if (note === null) {
        updateData.submissionNote = null
      } else {
        const trimmed = note.trim()
        updateData.submissionNote = trimmed ? trimmed : null
      }
    }

    const statusChanged = nextStatus !== existing.status

    if (statusChanged) {
      if (nextStatus === 'completed' && submittedAtPayload === undefined && !nextSubmittedAt) {
        nextSubmittedAt = new Date()
        updateData.submittedAt = nextSubmittedAt
      }

      if (nextStatus !== 'completed' && submittedAtPayload === undefined) {
        nextSubmittedAt = null
        updateData.submittedAt = null
      }
    }

    const ladderAdjustments: LadderAdjustment[] = []
    const existingSubmittedAt = existing.submittedAt ? new Date(existing.submittedAt) : null
    const awardDeadline = nextDueDate
    const revertDeadline = existing.dueDate

    if (statusChanged) {
      if (nextStatus === 'completed') {
        const effectiveSubmittedAt = nextSubmittedAt ?? new Date()
        if (!updateData.submittedAt) {
          updateData.submittedAt = effectiveSubmittedAt
        }

        const diffMs = awardDeadline.getTime() - effectiveSubmittedAt.getTime()
        const isLate = diffMs < -LATE_GRACE_MS
        const qualifiesForEarlyBonus = diffMs > EARLY_THRESHOLD_MS

        ladderAdjustments.push({
          delta: COMPLETION_REWARD,
          reason: 'task_completed',
          description: isLate
            ? `Completed "${nextTitle}" after the deadline`
            : `Completed "${nextTitle}"`,
        })

        if (qualifiesForEarlyBonus) {
          ladderAdjustments.push({
            delta: EARLY_BONUS,
            reason: 'task_early_bonus',
            description: `Finished ${describeOffset(diffMs, 'early')}`,
          })
        } else if (isLate) {
          ladderAdjustments.push({
            delta: -LATE_PENALTY,
            reason: 'task_late_penalty',
            description: `Submitted ${describeOffset(diffMs, 'late')}`,
          })
        }
      } else if (existing.status === 'completed') {
        if (updateData.submittedAt === undefined) {
          updateData.submittedAt = null
        }

        ladderAdjustments.push({
          delta: -COMPLETION_REWARD,
          reason: 'manual_adjustment',
          description: `Reopened "${nextTitle}"`,
        })

        if (existingSubmittedAt) {
          const previousDiffMs = revertDeadline.getTime() - existingSubmittedAt.getTime()
          if (previousDiffMs > EARLY_THRESHOLD_MS) {
            ladderAdjustments.push({
              delta: -EARLY_BONUS,
              reason: 'manual_adjustment',
              description: `Removed early bonus for "${nextTitle}"`,
            })
          } else if (previousDiffMs < -LATE_GRACE_MS) {
            ladderAdjustments.push({
              delta: LATE_PENALTY,
              reason: 'manual_adjustment',
              description: `Late penalty cleared for "${nextTitle}"`,
            })
          }
        }
      }
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: parsed.data.id },
      data: updateData
    })

    console.log('Processing ladder adjustments:', ladderAdjustments.length, ladderAdjustments);
    const adjustmentStart = performance.now();

    for (const adjustment of ladderAdjustments) {
      if (!adjustment.delta) continue
      const singleStart = performance.now();
      await applyLadderDelta({
        userId: user.id,
        delta: adjustment.delta,
        reason: adjustment.reason,
        description: adjustment.description,
        assignmentId: updatedAssignment.id,
      })
      const singleEnd = performance.now();
      console.log('Single ladder delta took:', singleEnd - singleStart, 'ms');
    }

    const adjustmentEnd = performance.now();
    console.log('All ladder adjustments took:', adjustmentEnd - adjustmentStart, 'ms');

    return NextResponse.json({ message: 'Assignment updated', assignment: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE: remove an assignment
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()
    const json = await request.json()
    const id = json?.id
    if (!isNonEmptyString(id)) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 })
    }

    // Check if the assignment exists before trying to delete it
    const existing = await prisma.assignment.findFirst({
      where: { id, userId: user.id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete the assignment from the database
    await prisma.assignment.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
