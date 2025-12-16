'use client'

import React, { useMemo, useState } from 'react'
import { useAssignments } from '@/hooks/useAssignments'

type DayCell = {
  date: Date
  isCurrentMonth: boolean
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function startOfWeek(d: Date) {
  const x = new Date(d)
  x.setDate(d.getDate() - d.getDay())
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfWeek(d: Date) {
  const x = new Date(d)
  x.setDate(d.getDate() + (6 - d.getDay()))
  x.setHours(23, 59, 59, 999)
  return x
}
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(d.getDate() + n)
  return x
}

export default function CalendarPage() {
  const { assignments, loading } = useAssignments()
  const [cursor, setCursor] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const days: DayCell[] = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor))
    const end = endOfWeek(endOfMonth(cursor))

    const out: DayCell[] = []
    let cur = start
    while (cur <= end) {
      out.push({ date: new Date(cur), isCurrentMonth: cur.getMonth() === cursor.getMonth() })
      cur = addDays(cur, 1)
    }
    return out
  }, [cursor])

  const byDate = useMemo(() => {
    const map = new Map<string, typeof assignments>()
    for (const a of assignments) {
      const key = new Date(a.dueDate).toDateString()
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    }
    return map
  }, [assignments])

  const selectedKey = selectedDate ? selectedDate.toDateString() : ''
  const selectedItems = selectedKey ? byDate.get(selectedKey) ?? [] : []

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            ← Prev
          </button>
          <button className="btn-secondary" onClick={() => setCursor(new Date())}>
            Today
          </button>
          <div className="px-3 py-2 rounded-md bg-brandPrimary text-white border-2 border-brandPrimary">{monthLabel}</div>
          <button className="btn-primary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            Next →
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="card">
        <div className="grid grid-cols-7 gap-2 text-center text-white text-sm mb-2">
          {weekdayShort.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((cell) => {
            const key = cell.date.toDateString()
            const items = byDate.get(key) ?? []
            const isSelected = selectedDate && key === selectedDate.toDateString()
            const isToday = new Date().toDateString() === key
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(new Date(cell.date))}
                className={`text-left rounded-lg border-2 p-2 min-h-[84px] transition-colors ${
                  isSelected
                    ? 'border-white/80 bg-white/10'
                    : isToday
                      ? 'border-white/60 bg-white/5'
                      : 'border-white/10 bg-panelBg hover:bg-white/10'
                } text-white`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{cell.date.getDate()}</span>
                  {items.length > 0 && (
                    <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-white text-brandBg font-semibold">
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 2).map((a) => (
                    <div key={a.id} className="truncate text-xs text-white">
                      {a.title}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-[11px] text-white">+{items.length - 2} more</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day details */}
      <div className="card">
        <div className="-m-6 mb-4 p-4 rounded-t-lg bg-brandPrimary/20 border-b-2 border-brandPrimary">
          <h2 className="text-lg font-semibold">
            {selectedDate ? selectedDate.toLocaleDateString() : 'Pick a day'}
          </h2>
        </div>
        {loading ? (
          <div className="text-white">Loading assignments…</div>
        ) : selectedItems.length === 0 ? (
          <div className="text-white">No assignments on this day.</div>
        ) : (
          <ul className="space-y-2">
            {selectedItems.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between bg-brandPrimary/20 border-2 border-brandPrimary rounded-md p-2"
                style={{ borderLeft: '4px solid #0166FE' }}
              >
                <div className="truncate pr-2">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-xs text-white truncate">{a.course?.name}</div>
                </div>
                <div className="text-xs text-white whitespace-nowrap">
                  {new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
