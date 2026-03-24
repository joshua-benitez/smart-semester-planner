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
    <div className="flex h-full flex-col overflow-hidden bg-brandBg">
      <div className="z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">← Dashboard</Link>
          <h1 className="border-l border-gray-300 pl-4 text-xl font-bold tracking-tight text-gray-900">Calendar</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button onClick={prevMonth} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:shadow-sm">
            ←
          </button>
          <button onClick={goToday} className="rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:shadow-sm">
            Today
          </button>
          <div className="min-w-[140px] px-4 py-1.5 text-center text-sm font-bold text-gray-900">
            {MONTHS[month]} {year}
          </div>
          <button onClick={nextMonth} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:shadow-sm">
            →
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 xl:flex-row">
          <div className="w-full flex-1">
            <div className="mb-2 grid grid-cols-7">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-300 bg-gray-300 shadow-sm">
              {cells.map((cell, i) => {
                if (!cell.date) return <div key={i} className="min-h-[120px] bg-gray-100" />
                const key = cell.date.toLocaleDateString('en-CA')
                const isToday = cell.date.getTime() === today.getTime()
                const isSelected = key === selectedKey
                const dayAssignments = assignmentsByDate[key] ?? []

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                    className={`flex min-h-[120px] cursor-pointer flex-col p-2 transition-colors ${
                      isSelected ? 'z-10 bg-blue-50 ring-2 ring-inset ring-brandPrimary' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isToday ? 'bg-brandPrimary text-white' : isSelected ? 'text-brandPrimary' : 'text-gray-700'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayAssignments.length > 0 && (
                        <span className="text-[0.65rem] font-bold text-gray-400">{dayAssignments.length}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayAssignments.slice(0, 3).map((a) => {
                        const cColor = courseColor(a.course?.name ?? '')
                        return (
                          <div
                            key={a.id}
                            className="truncate rounded px-1.5 py-0.5 text-[0.68rem] font-semibold leading-tight"
                            style={{ background: `${cColor}15`, color: cColor, borderLeft: `2px solid ${cColor}` }}
                          >
                            {a.title}
                          </div>
                        )
                      })}
                      {dayAssignments.length > 3 && (
                        <div className="mt-0.5 pl-1 text-[0.65rem] font-semibold text-gray-400">
                          +{dayAssignments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {loading && (
              <div className="mt-4 text-center text-sm text-gray-500">Loading…</div>
            )}
          </div>

          {selectedLabel && selectedAssignments.length > 0 && (
            <div className="w-full flex-shrink-0 xl:w-96">
              <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3.5">
                  <h3 className="text-sm font-bold text-gray-900">
                    {selectedLabel}
                  </h3>
                  <span className="rounded-full bg-gray-200/60 px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {selectedAssignments.length}
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-gray-100">
                  {selectedAssignments.map((a) => {
                    const color = courseColor(a.course?.name ?? '')
                    const time = new Date(a.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

                    return (
                      <Link
                        href={`/assignments/${a.id}/edit`}
                        key={a.id}
                        className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                        style={{ borderLeft: `4px solid ${color}` }}
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="truncate text-[0.9rem] font-semibold text-gray-900 transition-colors group-hover:text-brandPrimary">
                            {a.title}
                          </div>
                          <div className="mt-0.5 text-xs font-medium text-gray-500">
                            {a.course?.name || 'General'}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end">
                          <div className="text-xs font-bold text-gray-700">{time}</div>
                          <div className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400">
                            {a.type}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
