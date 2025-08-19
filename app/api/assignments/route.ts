import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// I need one prisma instance for the whole file
const prisma = new PrismaClient()

// This function helps me create or find a user and course
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

// This handles GET requests to fetch all my assignments
export async function GET() {
  try {
    // Get all assignments with course info, sorted by due date
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

// This handles POST requests to create new assignments
export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const data = await request.json()
    
    // Make sure I have a user and course to attach this assignment to
    const { user, course } = await createOrFindUserAndCourse(data.courseName)
    
    // Create the assignment in the database
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        type: data.type,
        difficulty: data.difficulty,
        weight: data.weight,
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
    return NextResponse.json(
      { error: 'Failed to create assignment' }, 
      { status: 500 }
    )
  }
}