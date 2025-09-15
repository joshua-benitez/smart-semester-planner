import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { z } from 'zod'

// Lightweight runtime validation helper
function isNonEmptyString(x: any): x is string {
  return typeof x === 'string' && x.trim().length > 0
}
function parseDateSafe(s: any): Date | null {
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
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

// Zod schemas
const AssignmentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  dueDate: z.union([z.string(), z.date()])
    .transform((v) => (typeof v === 'string' ? new Date(v) : v))
    .refine((d) => d instanceof Date && !isNaN(d.getTime()), { message: 'Invalid dueDate' }),
  type: z.enum(['homework', 'quiz', 'project', 'exam']).optional(),
  difficulty: z.enum(['easy', 'moderate', 'crushing', 'brutal']).optional(),
  weight: z.number().min(0.1).max(5).optional(),
  courseName: z.string().min(1)
})

const AssignmentUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  type: z.enum(['homework', 'quiz', 'project', 'exam']).optional(),
  difficulty: z.enum(['easy', 'moderate', 'crushing', 'brutal']).optional(),
  weight: z.number().min(0.1).max(5).optional(),
  status: z.string().optional(),
  courseName: z.string().optional(),
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
      }
    })

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment
    })
  } catch (error) {
    console.error('Error creating assignment:', error)
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
    const existing = await prisma.assignment.findUnique({
      where: { id: parsed.data.id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Build update payload only with provided fields
    const updateData: any = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.difficulty !== undefined) updateData.difficulty = parsed.data.difficulty
    if (parsed.data.weight !== undefined) updateData.weight = parsed.data.weight
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status
    if (parsed.data.dueDate !== undefined) {
      const d = typeof parsed.data.dueDate === 'string' ? new Date(parsed.data.dueDate) : parsed.data.dueDate
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
      updateData.dueDate = d
    }

    // If courseName was supplied, find or create that course then set courseId
    if (parsed.data.courseName) {
      const course = await findOrCreateCourseForUser(user.id, parsed.data.courseName)
      updateData.courseId = course.id
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: parsed.data.id },
      data: updateData
    })

    return NextResponse.json({ message: 'Assignment updated', assignment: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE: remove an assignment
export async function DELETE(request: Request) {
  try {
    const json = await request.json()
    const id = json?.id
    if (!isNonEmptyString(id)) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 })
    }

    // Check if the assignment exists before trying to delete it
    const existing = await prisma.assignment.findUnique({
      where: { id }
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
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
