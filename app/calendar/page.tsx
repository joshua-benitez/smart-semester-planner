'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAssignments } from '@/hooks/useAssignments'
import type { Assignment } from '@/types/assignment'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function courseColor(name: string): string {
  const colors = ['#2dd4a0','#5ba3f5','#9d7ef0','#22d3ee','#fb923c','#f472b6']
  return colors[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length]
}

export default function CalendarPage() {
  const { assignments, loading } = useAssignments()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  }, [])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }
  const goToday   = () => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); setSelectedDate(null) }

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const last  = new Date(year, month + 1, 0)
    const startPad = first.getDay()
    const days: { date: Date | null }[] = Array(startPad).fill({ date: null })
    for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d) })
    while (days.length % 7 !== 0) days.push({ date: null })
    return days
  }, [year, month])

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {}
    assignments.forEach(a => {
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
    ? new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
    : null

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <Link href="/dashboard" className="text-[0.72rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>← Dashboard</Link>
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-white/90 mt-2">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(230,234,246,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            ←
          </button>
          <button onClick={goToday} className="text-[0.75rem] px-3 py-1.5 rounded-md transition-colors" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(230,234,246,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Today
          </button>
          <div className="text-[0.85rem] font-medium px-3 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(230,234,246,0.8)' }}>
            {MONTHS[month]} {year}
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(230,234,246,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            →
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-5">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[0.67rem] font-medium uppercase tracking-wider py-1" style={{ color: 'rgba(230,234,246,0.25)' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {cells.map((cell, i) => {
            if (!cell.date) return <div key={i} style={{ background: '#0b0d12', minHeight: 80 }} />
            const key = cell.date.toLocaleDateString('en-CA')
            const isToday = cell.date.getTime() === today.getTime()
            const isSelected = key === selectedKey
            const dayAssignments = assignmentsByDate[key] ?? []

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                className="p-2 cursor-pointer transition-colors"
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.06)' : '#0b0d12',
                  minHeight: 80,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[0.78rem] font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'text-white' : ''}`}
                    style={isToday ? { background: 'rgba(230,234,246,0.9)', color: '#0b0d12' } : { color: 'rgba(230,234,246,0.4)' }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayAssignments.length > 0 && (
                    <span className="text-[0.6rem] font-mono" style={{ color: 'rgba(230,234,246,0.3)' }}>{dayAssignments.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayAssignments.slice(0, 3).map(a => (
                    <div
                      key={a.id}
                      className="text-[0.65rem] truncate px-1 py-0.5 rounded"
                      style={{ background: `${courseColor(a.course?.name ?? '')}18`, color: courseColor(a.course?.name ?? ''), borderLeft: `2px solid ${courseColor(a.course?.name ?? '')}` }}
                    >
                      {a.title}
                    </div>
                  ))}
                  {dayAssignments.length > 3 && (
                    <div className="text-[0.62rem]" style={{ color: 'rgba(230,234,246,0.25)' }}>+{dayAssignments.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {selectedLabel && selectedAssignments.length > 0 && (
          <div className="mt-6 pb-4">
            <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
              {selectedLabel}
            </div>
            <div className="space-y-1">
              {selectedAssignments.map(a => {
                const color = courseColor(a.course?.name ?? '')
                const time = new Date(a.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${color}` }}
                  >
                    <div>
                      <div className="text-[0.85rem] font-medium" style={{ color: 'rgba(230,234,246,0.85)' }}>{a.title}</div>
                      <div className="text-[0.7rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>{a.course?.name}</div>
                    </div>
                    <div className="font-mono text-[0.7rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>{time}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="pt-8 text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Loading…</div>
        )}
      </div>
    </div>
  )
}
