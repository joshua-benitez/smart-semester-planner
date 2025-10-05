import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await requireAuth()
    const data = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, createdAt: true }
    })
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching profile:', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, currentPassword, newPassword } = body || {}

    const updates: { name?: string; password?: string } = {}

    if (typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim()
    }

    if (newPassword) {
      // double-check the existing password before letting anyone swap it
      const stored = await prisma.user.findUnique({ where: { id: user.id } })
      if (!stored) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      if (stored.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password required' }, { status: 400 })
        }
        const ok = await bcrypt.compare(currentPassword, stored.password)
        if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }
      updates.password = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: { id: true, email: true, name: true }
    })
    return NextResponse.json({ message: 'Profile updated', user: updated })
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating profile:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
