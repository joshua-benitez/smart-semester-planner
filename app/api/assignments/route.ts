import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Lightweight runtime validation helper
function isNonEmptyString(x: any): x is string {
  return typeof x === 'string' && x.trim().length > 0
}
function parseDateSafe(s: any): Date | null {
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

async function createOrFindUserAndCourse(courseName: string) {
  // For now I'm hardcoding one user since I don't have auth yet
  let user = await prisma.user.findFirst()
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'student@example.com',
        name: 'Student'
      }
    })
  }

  // Find or create the course for this user
  let course = await prisma.course.findFirst({
    where: { name: courseName, userId: user.id }
  })
  if (!course) {
    course = await prisma.course.create({
      data: {
        name: courseName,
        userId: user.id
      }
    })
  }

  return { user, course }
}

// GET: fetch all assignments (with course)
export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
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
    const data = await request.json()

    // Basic validation
    if (!isNonEmptyString(data?.title) || !isNonEmptyString(data?.courseName)) {
      return NextResponse.json({ error: 'Missing required fields: title or courseName' }, { status: 400 })
    }

    const dueDate = parseDateSafe(data?.dueDate)
    if (!dueDate) {
      return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
    }

    const { user, course } = await createOrFindUserAndCourse(data.courseName)

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description ?? '',
        dueDate,
        type: data.type ?? null,
        difficulty: data.difficulty ?? null,
        weight: typeof data.weight === 'number' ? data.weight : null,
        userId: user.id,
        courseId: course.id
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
    const data = await request.json()

    if (!isNonEmptyString(data?.id)) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 })
    }

    // Find assignment by ID
    const existing = await prisma.assignment.findUnique({
      where: { id: data.id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Build update payload only with provided fields
    const updateData: any = {}
    if (isNonEmptyString(data.title)) updateData.title = data.title
    if (typeof data.description === 'string') updateData.description = data.description
    if (isNonEmptyString(data.type)) updateData.type = data.type
    if (isNonEmptyString(data.difficulty)) updateData.difficulty = data.difficulty
    if (typeof data.weight === 'number') updateData.weight = data.weight
    if (data.dueDate !== undefined) {
      const parsed = parseDateSafe(data.dueDate)
      if (!parsed) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
      updateData.dueDate = parsed
    }

    // If courseName was supplied, find or create that course then set courseId
    if (isNonEmptyString(data.courseName)) {
      const { course } = await createOrFindUserAndCourse(data.courseName)
      updateData.courseId = course.id
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: data.id },
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
    const data = await request.json()

    // I need to validate the assignment ID was provided
    if (!isNonEmptyString(data?.id)) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 })
    }

    // Check if the assignment exists before trying to delete it
    const existing = await prisma.assignment.findUnique({
      where: { id: data.id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete the assignment from the database
    await prisma.assignment.delete({
      where: { id: data.id }
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}

