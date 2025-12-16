import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'
import { z } from 'zod'
import { ok, err } from '@/server/responses'

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
    return ok(courses)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    return err('Internal Server Error', 500, 'server_error')
  }
}

// POST -> drop in a new course (and default the color if they skip it)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = CourseCreateSchema.safeParse(body)
    if (!parsed.success) {
      return err('Invalid payload', 400, 'validation_error', parsed.error.flatten())
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
    return ok(newCourse, 201)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    return err('Internal Server Error', 500, 'server_error')
  }
}

// PUT -> rename or recolor a course after checking ownership
export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = CourseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return err('Invalid payload', 400, 'validation_error', parsed.error.flatten())
    }
    // make sure the course belongs to this user first
    const existingCourse = await prisma.course.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    })
    if (!existingCourse) {
      return err('Course not found', 404, 'not_found')
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
    return ok(updatedCourse)
    // done
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    return err('Internal Server Error', 500, 'server_error')
  }
}

// DELETE -> kill the course if it doesn't have assignments tied to it
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = CourseDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return err('Invalid payload', 400, 'validation_error', parsed.error.flatten())
    }
    // include assignments so we can block deletes when they're still linked
    const course = await prisma.course.findUnique({
      where: { id: parsed.data.id },
      include: { assignments: true }
    })
    // if it isn't the user's course or still has assignments, bail out
    if (!course || course.userId !== user.id) {
      return err('Course not found', 404, 'not_found')
    }
    if (course.assignments.length > 0) {
      return err('Cannot delete course with existing assignments', 400, 'blocked')
    }
    // finally delete
    await prisma.course.delete({ where: { id: parsed.data.id } })
    return ok({ id: parsed.data.id })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    return err('Internal Server Error', 500, 'server_error')
  }
}
