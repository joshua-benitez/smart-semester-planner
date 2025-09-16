'use client'

import React from 'react'
import type { StreakDay } from '@/types/streaks'

type Props = {
  days: StreakDay[]
  weeks?: number // default 12
}

// Simple streak heatmap scaffold (Sun–Sat columns by week)
export function StreakHeatmap({ days, weeks = 12 }: Props) {
  // Build a date map for quick lookup
  const map = new Map(days.map(d => [d.date, d.checked]))

  // Compute the start date: last N weeks ending today
  const today = new Date()
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end)
  start.setDate(end.getDate() - (weeks * 7 - 1))

  const cells: { date: Date; key: string; checked: boolean }[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    cells.push({ date: new Date(d), key: iso, checked: !!map.get(iso) })
  }

  // Group into weeks (columns) of 7 days (rows)
  const columns: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7))

  const color = (checked: boolean) => (
    checked ? 'bg-brandPrimary' : 'bg-brandPrimary/10'
  )

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-flow-col auto-cols-min gap-1 p-1 border border-white/10 rounded-md">
        {columns.map((col, ci) => (
          <div key={ci} className="grid grid-rows-7 gap-1">
            {col.map(cell => (
              <div
                key={cell.key}
                className={`w-3 h-3 rounded-sm ${color(cell.checked)}`}
                title={`${cell.key}${cell.checked ? ' • checked' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StreakHeatmap

