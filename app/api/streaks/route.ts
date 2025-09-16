import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-current-user'

// NOTE: Scaffold only — replace with Prisma-backed implementation.

function iso(d: Date) { return d.toISOString().slice(0,10) }

export async function GET() {
  try {
    await requireAuth()
    // Mock last 8 weeks, random demo data
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - (8 * 7 - 1))
    const days: { date: string; checked: boolean }[] = []
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = iso(d)
      // Simple pattern: weekends off, weekdays on, with a few misses
      const dow = d.getDay()
      const checked = dow !== 0 && dow !== 6 && Math.random() > 0.08
      days.push({ date: dateStr, checked })
    }

    // Compute current and best streak from mock
    let current = 0, best = 0, run = 0
    for (let i = 0; i < days.length; i++) {
      if (days[i].checked) { run++; best = Math.max(best, run) } else { run = 0 }
    }
    // If today is checked, set current to trailing run; else 0
    run = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].checked) run++; else break
    }
    current = run

    return NextResponse.json({ currentStreak: current, bestStreak: best, days })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST() {
  try {
    await requireAuth()
    // TODO: upsert a streak log for today in DB
    return NextResponse.json({ message: 'Checked in (mock)' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    await requireAuth()
    // TODO: remove/undo today log in DB
    return NextResponse.json({ message: 'Undone (mock)' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

