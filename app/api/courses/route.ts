import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'
import { z } from 'zod'

// Zod schemas
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

// GET method - fetch all courses for the user
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

// POST method - create new course
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = CourseCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const user = await requireAuth()
    //Create new course with name and color (default color if not provided)
    const newCourse = await prisma.course.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color ?? '#3b82f6',
        userId: user.id
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

// PUT method - update course name/color
export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = CourseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    // Find existing course by ID
    const existingCourse = await prisma.course.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    })
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    // Update course with new name/color
    const updatedCourse = await prisma.course.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name ?? existingCourse.name,
        color: parsed.data.color ?? existingCourse.color
      }
    })
    return NextResponse.json(updatedCourse)
    // Return success response
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE method - remove course (only if no assignments)
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = CourseDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    // Find course by ID and include assignments
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.id },
      include: { assignments: true }
    })
    // Check if course has assignments - if yes, return error
    if (!course || course.userId !== user.id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (course.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing assignments' },
        { status: 400 }
      )
    }
    // Delete the course
    await prisma.course.delete({ where: { id: parsed.data.id } })
    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
