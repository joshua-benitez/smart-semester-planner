import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Set up Prisma client (copy from assignments route.ts)
const prisma = new PrismaClient()
// TODO: Add validation helpers (copy isNonEmptyString from assignments route.ts)
const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}
// Add createOrFindUser function (copy from assignments route.ts)
const createOrFindUser = async () => {
  // Placeholder: In real implementation, get user from auth/session
  const email = ''
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email } })
  }
  return user
}

// GET method - fetch all courses for the user
export async function GET() {
  try {
    // TODO: Get the user
    const user = await createOrFindUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    // Fetch courses from database with assignments count
    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { assignments: true } }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(courses)
    // Order by name ascending
    const sortedCourses = courses.sort((a, b) => a.name.localeCompare(b.name))
    // Return JSON response
    return NextResponse.json(sortedCourses)
  } catch (error) {
    // Handle errors and return 500 status
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST method - create new course
export async function POST(request: Request) {
  try {
    // Get JSON data from request
    const data = await request.json()
    const { name, color } = data
    // Validate course name is provided
    const validName = isNonEmptyString(name) ? name.trim() : null
    if (!validName) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 })
    }

    const user = await createOrFindUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    //Create new course with name and color (default color if not provided)
    const newCourse = await prisma.course.create({
      data: {
        name: validName,
        color: isNonEmptyString(color) ? color.trim() : '#3b82f6', // Default blue color
        userId: user.id
      }
    })
    return NextResponse.json(newCourse)
  } catch (error) {
    // Handle errors and return 500 status
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT method - update course name/color
export async function PUT(request: Request) {
  try {
    // Get JSON data from request
    const data = await request.json()
    const { id, name, color } = data
    // Validate course ID is provided
    if (!isNonEmptyString(id)) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }
    // Find existing course by ID
    const existingCourse = await prisma.course.findUnique({ where: { id } })
    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    // Update course with new name/color
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name: isNonEmptyString(name) ? name.trim() : existingCourse.name,
        color: isNonEmptyString(color) ? color.trim() : existingCourse.color
      }
    })
    return NextResponse.json(updatedCourse)
    // Return success response
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE method - remove course (only if no assignments)
export async function DELETE(request: Request) {
  try {
    // Get JSON data from request
    const data = await request.json()
    const { id } = data
    // Validate course ID is provided
    if (!isNonEmptyString(id)) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }
    // Find course by ID and include assignments
    const course = await prisma.course.findUnique({
      where: { id },
      include: { assignments: true }
    })
    // Check if course has assignments - if yes, return error
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (course.assignments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing assignments' },
        { status: 400 }
      )
    }
    // Delete the course
    await prisma.course.delete({ where: { id } })
    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}