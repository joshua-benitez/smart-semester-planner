'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  CheckSquare,
  ChevronDown,
  Plus,
  Search,
  Square,
} from 'lucide-react'
import { useAssignments } from '@/hooks/useAssignments'
import { useLadder } from '@/hooks/useLadder'
import type { Assignment } from '@/types/assignment'

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function isCompleted(status: string) {
  return status === 'completed' || status === 'submitted' || status === 'graded'
}

function getGroupKey(a: Assignment): string {
  if (isCompleted(a.status)) return 'COMPLETED'
  const d = daysUntil(a.dueDate)
  if (d < 0) return 'OVERDUE'
  if (d === 0) return 'DUE TODAY'
  if (d <= 7) return 'THIS WEEK'
  if (d <= 14) return 'NEXT WEEK'
  return 'LATER'
}

const GROUP_ORDER: Record<string, number> = {
  OVERDUE: 1,
  'DUE TODAY': 2,
  'THIS WEEK': 3,
  'NEXT WEEK': 4,
  LATER: 5,
  COMPLETED: 6,
}

function courseColor(name: string): string {
  const colors = [
    'bg-[#16a34a] text-white',
    'bg-[#0ea5e9] text-white',
    'bg-[#9333ea] text-white',
    'bg-[#dc2626] text-white',
    'bg-[#ea580c] text-white',
  ]
  const hash = Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  return colors[hash % colors.length]
}

function StatusCell({ status, onClick, updating }: { status: string; onClick: () => void; updating: boolean }) {
  const done = isCompleted(status)

  if (updating) {
    return <div className="text-xs font-bold uppercase tracking-widest text-gray-400">...</div>
  }

  if (done) {
    return (
      <button onClick={onClick} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-green-700 hover:opacity-80">
        <CheckSquare size={16} className="text-green-600" />
        Done
      </button>
    )
  }

  return (
    <button onClick={onClick} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-black">
      <Square size={16} className="text-gray-400" />
      Not Started
    </button>
  )
}

export default function DashboardPage() {
  const { assignments, updateAssignmentStatus, loading } = useAssignments()
  const { refresh: refreshLadder } = useLadder()
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const groupedData = useMemo(() => {
    const groups: Record<string, Assignment[]> = {}
    const sorted = [...assignments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    sorted.forEach((assignment) => {
      const key = getGroupKey(assignment)
      if (!groups[key]) groups[key] = []
      groups[key].push(assignment)
    })

    return Object.entries(groups).sort((a, b) => GROUP_ORDER[a[0]] - GROUP_ORDER[b[0]])
  }, [assignments])

  const topPriority = useMemo(() => {
    const pending = assignments.filter((assignment) => !isCompleted(assignment.status))
    const sorted = [...pending].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    return sorted[0] || null
  }, [assignments])

  const courseStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number }> = {}
    assignments.forEach((assignment) => {
      const courseName = assignment.course?.name || 'Unknown'
      if (!stats[courseName]) stats[courseName] = { total: 0, done: 0 }
      stats[courseName].total++
      if (isCompleted(assignment.status)) stats[courseName].done++
    })

    return Object.entries(stats).map(([name, data]) => ({
      name,
      percent: Math.round((data.done / data.total) * 100) || 0,
    }))
  }, [assignments])

  const upcoming = useMemo(() => {
    const pending = assignments.filter((assignment) => !isCompleted(assignment.status))
    const sorted = [...pending].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    return sorted.slice(0, 5)
  }, [assignments])

  const handleToggle = async (id: string, currentStatus: string) => {
    if (updatingIds.has(id)) return
    const done = isCompleted(currentStatus)
    const nextStatus = done ? 'not_started' : 'completed'

    setUpdatingIds((prev) => new Set(prev).add(id))
    try {
      await updateAssignmentStatus(id, nextStatus, done ? { submittedAt: null } : { submittedAt: new Date().toISOString() })
      await refreshLadder()
    } catch (err) {
      console.error(err)
      alert('Failed to update status.')
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <div className="text-sm font-bold uppercase tracking-widest text-black">Loading Data...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white font-sans text-gray-900">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-300 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Assignment Tracker</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-none border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-black focus:outline-none"
            />
          </div>
          <Link href="/assignments/new" className="flex items-center gap-2 bg-black px-3 py-1.5 text-sm font-bold text-white hover:bg-gray-800">
            <Plus size={16} /> New Row
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          {topPriority && (
            <div className="mb-6 flex shrink-0 items-start gap-4 border-2 border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="shrink-0 bg-red-600 p-2 text-white">
                <AlertCircle size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 text-xs font-black uppercase tracking-widest text-red-600">Top Priority / Next Due</h2>
                <div className="mb-2 flex min-w-0 items-center gap-3">
                  <span className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-bold ${courseColor(topPriority.course?.name || '')}`}>
                    {topPriority.course?.name || 'Unknown'}
                  </span>
                  <h3 className="truncate pr-4 text-lg font-bold">{topPriority.title}</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Due {new Date(topPriority.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                  {new Date(topPriority.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Link href={`/assignments/${topPriority.id}/edit`} className="bg-black px-4 py-2 text-center text-sm font-bold text-white transition-colors hover:bg-gray-800">
                  Open Task
                </Link>
                <button
                  onClick={() => handleToggle(topPriority.id, topPriority.status)}
                  className="border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {updatingIds.has(topPriority.id) ? 'Updating...' : 'Mark Done'}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col border border-gray-300 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 px-4 py-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <BookOpen size={16} />
                Curriculum View
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 border border-gray-300 bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100">
                  Filter <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-1 border border-gray-300 bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100">
                  Sort <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold uppercase text-gray-600 shadow-sm">
                  <tr>
                    <th className="w-32 border-b border-r border-gray-300 px-3 py-2">Subject</th>
                    <th className="border-b border-r border-gray-300 px-3 py-2">Assignment</th>
                    <th className="w-32 border-b border-r border-gray-300 px-3 py-2">Status</th>
                    <th className="w-32 border-b border-r border-gray-300 px-3 py-2">Due Date</th>
                    <th className="w-24 border-b border-gray-300 px-3 py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-500">
                        No assignments found. Add some to get started.
                      </td>
                    </tr>
                  ) : (
                    groupedData.map(([groupName, items]) => (
                      <React.Fragment key={groupName}>
                        <tr className="bg-gray-200/80">
                          <td colSpan={5} className="border-b border-gray-300 px-3 py-1.5 text-xs font-black tracking-widest text-black">
                            {groupName}
                          </td>
                        </tr>
                        {items.map((item) => {
                          const done = isCompleted(item.status)
                          return (
                            <tr key={item.id} className="group border-b border-gray-200 transition-colors hover:bg-yellow-50">
                              <td className="border-r border-gray-200 px-2 py-1.5">
                                <span className={`block w-full rounded-sm px-1 py-1 text-center text-xs font-bold ${courseColor(item.course?.name || '')}`}>
                                  {item.course?.name || '???'}
                                </span>
                              </td>
                              <td className={`border-r border-gray-200 px-3 py-1.5 font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                <Link href={`/assignments/${item.id}/edit`} className="hover:underline">
                                  {item.title}
                                </Link>
                              </td>
                              <td className="border-r border-gray-200 px-3 py-1.5 hover:bg-gray-100">
                                <StatusCell status={item.status} updating={updatingIds.has(item.id)} onClick={() => handleToggle(item.id, item.status)} />
                              </td>
                              <td className="border-r border-gray-200 px-3 py-1.5 font-medium text-gray-700">
                                {new Date(item.dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="px-3 py-1.5 text-xs font-bold capitalize text-gray-500">{item.type}</td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-6 xl:w-72">
          <div className="border border-gray-300 bg-white p-4">
            <h2 className="mb-3 border-b border-gray-300 pb-2 text-xs font-black uppercase text-gray-500">Course Completion</h2>
            <div className="space-y-4 text-sm font-bold">
              {courseStats.length === 0 ? (
                <div className="text-xs font-bold text-gray-500">No course data yet.</div>
              ) : (
                courseStats.map((stat) => (
                  <div key={stat.name}>
                    <div className="mb-1 flex justify-between">
                      <span>{stat.name}</span>
                      <span>{stat.percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-none border border-gray-300 bg-gray-200">
                      <div className="h-full bg-black" style={{ width: `${stat.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 border border-gray-300 bg-white p-0">
            <h2 className="border-b border-gray-300 p-4 text-xs font-black uppercase text-gray-500">Coming Up</h2>
            <div className="divide-y divide-gray-200">
              {upcoming.length === 0 ? (
                <div className="p-4 text-xs font-bold text-gray-500">No upcoming assignments.</div>
              ) : (
                upcoming.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className={`mb-1 inline-block rounded-sm px-1 text-xs font-bold ${courseColor(item.course?.name || '')}`}>
                      {item.course?.name}
                    </div>
                    <Link href={`/assignments/${item.id}/edit`} className="block truncate text-sm font-bold text-black hover:underline">
                      {item.title}
                    </Link>
                    <div className="mt-1 text-xs font-bold text-gray-500">
                      {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
