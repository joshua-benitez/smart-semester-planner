import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.info('Seeding Smart Semester Planner data...')

  // ----------------------------------------------------------
  // Core demo user 
  // ----------------------------------------------------------
  const user = await prisma.user.upsert({
    where: { email: 'demo@student.edu' },
    update: {},
    create: {
      email: 'demo@student.edu',
      name: 'Demo Student',
      password: null,
    },
  })

  // ----------------------------------------------------------
  // Courses + assignments
  // ----------------------------------------------------------
  const [calculus, cs] = await Promise.all([
    prisma.course.upsert({
      where: { userId_name: { userId: user.id, name: 'Calculus I' } },
      update: {},
      create: {
        name: 'Calculus I',
        color: '#F97316',
        userId: user.id,
      },
    }),
    prisma.course.upsert({
      where: { userId_name: { userId: user.id, name: 'CS 201' } },
      update: {},
      create: {
        name: 'CS 201',
        color: '#2563EB',
        userId: user.id,
      },
    }),
  ])

  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        title: 'Homework 2: Derivatives',
        description: 'Problem set covering implicit differentiation.',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        type: 'homework',
        difficulty: 'moderate',
        weight: 10,
        userId: user.id,
        courseId: calculus.id,
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Lecture Quiz: Recursion',
        description: 'Short quiz on recursion patterns.',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        type: 'quiz',
        difficulty: 'easy',
        weight: 5,
        userId: user.id,
        courseId: cs.id,
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Project 1 Proposal',
        description: 'Submit initial proposal for semester project.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'project',
        difficulty: 'crushing',
        weight: 20,
        userId: user.id,
        courseId: cs.id,
      },
    }),
  ])

  console.info(`Seeded ${assignments.length} assignments across ${[calculus, cs].length} courses.`)

  // ----------------------------------------------------------
  // Ladder baseline (demo values — tweak thresholds in API)
  // ----------------------------------------------------------
  const ladderStanding = await prisma.ladderStanding.upsert({
    where: { userId: user.id },
    update: {
      points: 1325,
      stepLabel: 'Scholar',
      level: 3,
    },
    create: {
      userId: user.id,
      points: 1325,
      stepLabel: 'Scholar',
      level: 3,
    },
  })

  await prisma.ladderEvent.deleteMany({ where: { userId: user.id } })
  await prisma.ladderEvent.createMany({
    data: [
      {
        userId: user.id,
        assignmentId: assignments[0].id,
        pointsChange: 50,
        reason: 'task_completed',
        description: 'Completed Homework 2 early',
      },
      {
        userId: user.id,
        assignmentId: assignments[1].id,
        pointsChange: 25,
        reason: 'task_early_bonus',
        description: 'Aced the recursion quiz',
      },
      {
        userId: user.id,
        assignmentId: assignments[2].id,
        pointsChange: -10,
        reason: 'task_late_penalty',
        description: 'Project proposal submitted late',
      },
    ],
  })

  console.info(`Seeded ladder (${ladderStanding.stepLabel} ${ladderStanding.level ?? ''}) with sample point events.`)

  console.info('Seeded demo data (assignments + ladder).')
}

main()
  .catch((error) => {
    console.error('Seed error', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
