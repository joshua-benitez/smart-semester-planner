import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createOrFindUserAndCourse(courseName: string) {
  // Hardcode user for now since no auth yet
  let user = await prisma.user.findFirst()
  if (!user) {
    user = await prisma.user.create({
      data: { 
        email: 'student@example.com', 
        name: 'Student' 
      }
    })
  }

  // Find or create the course
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

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const { user, course } = await createOrFindUserAndCourse(data.courseName)
    
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