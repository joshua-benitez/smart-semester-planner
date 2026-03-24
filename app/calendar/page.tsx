'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAssignments } from '@/hooks/useAssignments'
import type { Assignment } from '@/types/assignment'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function courseColor(name: string): string {
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f97316']
  return colors[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length]
}

export default function CalendarPage() {
  const { assignments, loading } = useAssignments()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }
  const goToday = () => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); setSelectedDate(null) }

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startPad = first.getDay()
    const days: { date: Date | null }[] = Array(startPad).fill({ date: null })
    for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d) })
    while (days.length % 7 !== 0) days.push({ date: null })
    return days
  }, [year, month])

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {}
    assignments.forEach((a) => {
      const key = new Date(a.dueDate).toLocaleDateString('en-CA')
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [assignments])

  const selectedKey = selectedDate ?? (
    assignmentsByDate[today.toLocaleDateString('en-CA')]
      ? today.toLocaleDateString('en-CA')
      : null
  )
  const selectedAssignments = selectedKey ? (assignmentsByDate[selectedKey] ?? []) : []
  const selectedLabel = selectedKey
    ? new Date(`${selectedKey}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brandBg">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-8 pb-4 pt-8">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">← Dashboard</Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
            ←
          </button>
          <button onClick={goToday} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
            Today
          </button>
          <div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </div>
          <button onClick={nextMonth} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
            →
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-1 grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[0.68rem] font-bold uppercase tracking-wider text-gray-500">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, i) => {
            if (!cell.date) return <div key={i} className="min-h-[112px] rounded-xl bg-transparent" />
            const key = cell.date.toLocaleDateString('en-CA')
            const isToday = cell.date.getTime() === today.getTime()
            const isSelected = key === selectedKey
            const dayAssignments = assignmentsByDate[key] ?? []

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                className={`min-h-[112px] cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected ? 'border-brandPrimary bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.78rem] font-semibold ${
                      isToday ? 'bg-brandPrimary text-white' : 'text-gray-700'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayAssignments.length > 0 && (
                    <span className="text-[0.62rem] font-mono text-gray-400">{dayAssignments.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayAssignments.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="truncate rounded-md px-2 py-1 text-[0.66rem] font-medium"
                      style={{ background: `${courseColor(a.course?.name ?? '')}18`, color: courseColor(a.course?.name ?? ''), borderLeft: `3px solid ${courseColor(a.course?.name ?? '')}` }}
                    >
                      {a.title}
                    </div>
                  ))}
                  {dayAssignments.length > 3 && (
                    <div className="text-[0.62rem] text-gray-400">+{dayAssignments.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {selectedLabel && selectedAssignments.length > 0 && (
          <div className="mt-8 pb-4">
            <div className="mb-3 text-[0.72rem] font-bold uppercase tracking-wider text-gray-500">
              {selectedLabel}
            </div>
            <div className="space-y-2">
              {selectedAssignments.map((a) => {
                const color = courseColor(a.course?.name ?? '')
                const time = new Date(a.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{a.title}</div>
                      <div className="text-xs text-gray-500">{a.course?.name}</div>
                    </div>
                    <div className="text-xs font-mono text-gray-500">{time}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="pt-8 text-sm text-gray-500">Loading…</div>
        )}
      </div>
    </div>
  )
}
