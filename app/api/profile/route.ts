import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'
import { ok, err } from '@/server/responses'

export async function GET() {
  try {
    const user = await requireAuth()
    const data = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, createdAt: true }
    })
    if (!data) {
      return err('User not found', 404, 'not_found')
    }
    return ok(data)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    console.error('Error fetching profile:', err)
    return err('Failed to load profile', 500, 'server_error')
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
      if (!stored) return err('User not found', 404, 'not_found')
      if (stored.password) {
        if (!currentPassword) {
          return err('Current password required', 400, 'validation_error')
        }
        const ok = await bcrypt.compare(currentPassword, stored.password)
        if (!ok) return err('Current password is incorrect', 400, 'validation_error')
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return err('New password must be at least 6 characters', 400, 'validation_error')
      }
      updates.password = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(updates).length === 0) {
      return err('No changes provided', 400, 'validation_error')
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: { id: true, email: true, name: true }
    })
    return ok(updated)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    console.error('Error updating profile:', err)
    return err('Failed to update profile', 500, 'server_error')
  }
}
