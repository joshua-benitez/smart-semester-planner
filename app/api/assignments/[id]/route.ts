import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireAuth()
    const { id } = params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const assignment = await prisma.assignment.findFirst({
      where: { id, userId: user.id },
      include: { course: true },
    })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(assignment)
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

