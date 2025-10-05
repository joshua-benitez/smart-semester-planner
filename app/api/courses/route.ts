import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'
import { z } from 'zod'

// schema guardrails so the course routes stay honest
const CourseCreateSchema = z.object({
  name: z.string().min(1, 'Course name is required').trim(),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/).optional(),
})

const CourseUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().optional(),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/).optional(),
})

const CourseDeleteSchema = z.object({ id: z.string().min(1) })

// GET -> list every course for the logged-in student
export async function GET() {
  try {
    const user = await requireAuth()

    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { assignments: true } }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(courses)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST -> drop in a new course (and default the color if they skip it)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = CourseCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const user = await requireAuth()
    // create the course; default color keeps the UI from breaking
    const newCourse = await prisma.course.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color ?? '#3b82f6',
        userId: user.id
      },
      include: {
        _count: { select: { assignments: true } }
      }
    })
    return NextResponse.json(newCourse)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT -> rename or recolor a course after checking ownership
export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = CourseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    // make sure the course belongs to this user first
    const existingCourse = await prisma.course.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    })
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    // apply the updates, but fall back to the existing data when fields are missing
    const updatedCourse = await prisma.course.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name ?? existingCourse.name,
        color: parsed.data.color ?? existingCourse.color
      },
      include: {
        _count: { select: { assignments: true } }
      }
    })
    return NextResponse.json(updatedCourse)
    // done
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE -> kill the course if it doesn't have assignments tied to it
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = CourseDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    // include assignments so we can block deletes when they're still linked
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.id },
      include: { assignments: true }
    })
    // if it isn't the user's course or still has assignments, bail out
    if (!course || course.userId !== user.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (course.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing assignments' },
        { status: 400 }
      )
    }
    // finally delete
    await prisma.course.delete({ where: { id: parsed.data.id } })
    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
