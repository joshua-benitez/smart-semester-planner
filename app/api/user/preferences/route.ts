import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { prisma } from '@/lib/db'
import { UserPreferences, DEFAULT_USER_PREFERENCES, UserPreferencesSchema } from '@/types/user'

const PartialPreferencesSchema = UserPreferencesSchema.partial()

function mergeStoredPreferences(raw: string | null | undefined): UserPreferences {
  if (!raw) {
    return { ...DEFAULT_USER_PREFERENCES }
  }

  try {
    const parsed = JSON.parse(raw)
    const result = PartialPreferencesSchema.safeParse(parsed)
    if (!result.success) {
      console.warn('Invalid stored preferences, falling back to defaults', result.error.flatten())
      return { ...DEFAULT_USER_PREFERENCES }
    }
    return { ...DEFAULT_USER_PREFERENCES, ...result.data }
  } catch (err) {
    console.warn('Failed to parse stored preferences, falling back to defaults', err)
    return { ...DEFAULT_USER_PREFERENCES }
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const preferences = mergeStoredPreferences(userData.preferences)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = PartialPreferencesSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid preferences payload', details: parsed.error.flatten() }, { status: 400 })
    }
    const updates = parsed.data
    
    // Get current preferences
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true }
    })

    const currentPreferences = mergeStoredPreferences(userData?.preferences)

    // Merge with updates on top of defaults to keep shape predictable
    const newPreferences: UserPreferences = { ...DEFAULT_USER_PREFERENCES, ...currentPreferences, ...updates }

    // Save to database
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(newPreferences) }
    })

    return NextResponse.json(newPreferences)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
