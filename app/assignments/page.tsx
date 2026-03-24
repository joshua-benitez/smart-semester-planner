'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAssignments } from '@/hooks/useAssignments'
import { useLadder } from '@/hooks/useLadder'
import type { Assignment, AssignmentStatusUpdateExtras } from '@/types/assignment'

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function formatDue(dateStr: string) {
  const d = daysUntil(dateStr)
  const label = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, cls: 'text-red-600 font-semibold' }
  if (d === 0) return { text: 'Today', cls: 'text-red-600 font-semibold' }
  if (d === 1) return { text: 'Tomorrow', cls: 'text-amber-600 font-semibold' }
  if (d <= 7) return { text: `${d}d left`, cls: 'text-amber-600 font-semibold' }
  return { text: label, cls: 'text-gray-500' }
}

function urgencyOrder(a: Assignment): number {
  const d = daysUntil(a.dueDate)
  if (d < 0) return 0
  if (d === 0) return 1
  if (d <= 7) return 2
  if (d <= 14) return 3
  return 4
}

const COMPLETED = ['completed', 'submitted', 'graded']

function Row({
  assignment,
  onComplete,
  onDelete,
  updating,
}: {
  assignment: Assignment
  onComplete: (id: string, status: string, extras?: AssignmentStatusUpdateExtras) => Promise<void>
  onDelete: (id: string) => void
  updating: boolean
}) {
  const due = formatDue(assignment.dueDate)
  const done = COMPLETED.includes(assignment.status)
  const courseName = assignment.course?.name ?? 'General'

  const courseColors = [
    'bg-emerald-100 text-emerald-800',
    'bg-blue-100 text-blue-800',
    'bg-violet-100 text-violet-800',
    'bg-rose-100 text-rose-800',
    'bg-orange-100 text-orange-800',
  ]
  const ci = Math.abs(courseName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % courseColors.length

  return (
    <div
      className={`group mb-1 grid items-center gap-4 rounded-lg border border-transparent bg-white px-4 py-3 transition-all hover:border-gray-200 hover:shadow-sm ${
        done ? 'bg-gray-50 opacity-50' : ''
      }`}
      style={{ gridTemplateColumns: '1fr 96px auto auto' }}
    >
      <div className="min-w-0 flex flex-col gap-1">
        <div className={`truncate text-[0.9rem] font-semibold text-gray-900 ${done ? 'line-through text-gray-500' : ''}`}>{assignment.title}</div>
        <div className="flex items-center gap-2 text-[0.75rem] font-medium text-gray-500">
          <span className={`rounded-md px-2 py-0.5 ${courseColors[ci]}`}>{courseName}</span>
          <span className="capitalize">{assignment.type}</span>
          {assignment.weight ? <span>· {assignment.weight}%</span> : null}
        </div>
      </div>

      <div className={`whitespace-nowrap text-right text-[0.8rem] ${done ? 'text-gray-400' : due.cls}`}>{due.text}</div>

      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/assignments/${assignment.id}/edit`}
          className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(assignment.id)}
          className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
        >
          Delete
        </button>
      </div>

      <button
        disabled={updating}
        onClick={() =>
          onComplete(assignment.id, done ? 'not_started' : 'completed', {
            submittedAt: done ? null : new Date().toISOString(),
          })
        }
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all disabled:opacity-40 ${
          done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-emerald-500 hover:text-emerald-500'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5"><path d="M20 6 9 17l-5-5" /></svg>
      </button>
    </div>
  )
}

export default function AssignmentsPage() {
  const { assignments, loading, refresh, deleteAssignment } = useAssignments()
  const { refresh: refreshLadder } = useLadder()
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const courses = useMemo(() => {
    const seen = new Set<string>()
    return assignments
      .map((a) => ({ id: a.courseId ?? a.course?.name ?? '', name: a.course?.name ?? '' }))
      .filter((c) => c.name && !seen.has(c.id) && seen.add(c.id))
  }, [assignments])

  const filtered = useMemo(() => {
    let list = assignments
    if (courseFilter) list = list.filter((a) => (a.courseId ?? a.course?.name) === courseFilter)
    if (statusFilter === 'active') list = list.filter((a) => !COMPLETED.includes(a.status))
    if (statusFilter === 'completed') list = list.filter((a) => COMPLETED.includes(a.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) => `${a.title} ${a.course?.name ?? ''}`.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => urgencyOrder(a) - urgencyOrder(b) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [assignments, courseFilter, statusFilter, search])

  const handleStatusUpdate = async (id: string, status: string, extras: AssignmentStatusUpdateExtras = {}) => {
    if (updatingIds.has(id)) return
    setUpdatingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...extras }),
      })
      if (!res.ok) throw new Error('Failed')
      await Promise.all([refresh(), refreshLadder()])
    } catch {
      alert('Failed to update. Please try again.')
    } finally {
      setUpdatingIds((prev) => {
        const n = new Set(prev)
        n.delete(id)
        return n
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return
    try {
      await deleteAssignment(id)
      await Promise.all([refresh(), refreshLadder()])
    } catch {
      alert('Failed to delete. Please try again.')
    }
  }

  const deleteMany = async (ids: string[]) => {
    if (ids.length === 0) return
    if (!confirm(`Delete ${ids.length} assignment${ids.length > 1 ? 's' : ''}?`)) return
    try {
      await Promise.all(ids.map((id) => deleteAssignment(id)))
      await Promise.all([refresh(), refreshLadder()])
    } catch {
      alert('Failed to delete. Please try again.')
    }
  }

  const inputCls = 'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 transition-colors focus:border-brandPrimary focus:outline-none focus:ring-1 focus:ring-brandPrimary'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brandBg">
      <div className="flex flex-shrink-0 items-start justify-between border-b border-border bg-white px-8 pb-4 pt-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assignments</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">{loading ? 'Loading…' : `${filtered.length} assignments`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => deleteMany(assignments.filter((a) => COMPLETED.includes(a.status)).map((a) => a.id))}
            className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            Delete completed
          </button>
          <Link href="/assignments/new" className="btn-primary px-4 py-2 text-sm">+ New Task</Link>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-border bg-white px-8 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className={inputCls}
          style={{ width: 200 }}
        />
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={inputCls}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={inputCls}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        {(search || courseFilter || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearch('')
              setCourseFilter('')
              setStatusFilter('all')
            }}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
        {loading ? (
          <div className="mt-12 text-center text-sm text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-sm text-gray-500">
            No assignments. <Link href="/assignments/new" className="text-brandPrimary hover:underline">Add one</Link>.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((a) => (
              <Row key={a.id} assignment={a} onComplete={handleStatusUpdate} onDelete={handleDelete} updating={updatingIds.has(a.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
