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
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, cls: 'text-red-400 font-semibold' }
  if (d === 0) return { text: 'Today', cls: 'text-red-400 font-semibold' }
  if (d === 1) return { text: 'Tomorrow', cls: 'text-amber-400 font-semibold' }
  if (d <= 7) return { text: `${d}d left`, cls: 'text-amber-400 font-semibold' }
  return { text: label, cls: 'text-white/30' }
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
  const courseName = assignment.course?.name ?? ''

  const courseColors = ['text-emerald-400', 'text-blue-400', 'text-violet-400', 'text-cyan-400', 'text-rose-400', 'text-orange-400']
  const ci = Math.abs(courseName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % courseColors.length

  return (
    <div
      className={`grid items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-white/[0.03] group ${done ? 'opacity-30' : ''}`}
      style={{ gridTemplateColumns: '1fr 96px auto auto auto' }}
    >
      <div className="min-w-0">
        <div className={`text-[0.875rem] font-medium text-white/90 truncate ${done ? 'line-through' : ''}`}>
          {assignment.title}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[0.7rem] text-white/30">
          <span className={`font-semibold ${courseColors[ci]}`}>{courseName}</span>
          <span>·</span>
          <span className="capitalize">{assignment.type}</span>
          {assignment.weight ? (
            <>
              <span>·</span>
              <span>{assignment.weight}%</span>
            </>
          ) : null}
        </div>
      </div>

      <div className={`text-right text-[0.75rem] whitespace-nowrap ${due.cls}`}>{due.text}</div>

      <button
        disabled={updating}
        onClick={() =>
          onComplete(assignment.id, done ? 'not_started' : 'completed', {
            submittedAt: done ? null : new Date().toISOString(),
          })
        }
        className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-all disabled:opacity-40 ${
          done
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
            : 'border-white/15 text-transparent hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/[0.07]'
        }`}
        title={done ? 'Undo' : 'Mark complete'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-[10px] h-[10px]">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>

      <Link
        href={`/assignments/${assignment.id}/edit`}
        className="text-[0.72rem] px-2 py-1 rounded border opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: 'rgba(255,255,255,0.09)', color: 'rgba(230,234,246,0.4)' }}
      >
        Edit
      </Link>
      <button
        onClick={() => onDelete(assignment.id)}
        className="text-[0.72rem] px-2 py-1 rounded border opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderColor: 'rgba(248,113,113,0.2)', color: 'rgba(248,113,113,0.6)' }}
      >
        Delete
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
      .map(a => ({ id: a.courseId ?? a.course?.name ?? '', name: a.course?.name ?? '' }))
      .filter(c => c.name && !seen.has(c.id) && seen.add(c.id))
  }, [assignments])

  const filtered = useMemo(() => {
    let list = assignments
    if (courseFilter) list = list.filter(a => (a.courseId ?? a.course?.name) === courseFilter)
    if (statusFilter === 'active') list = list.filter(a => !COMPLETED.includes(a.status))
    if (statusFilter === 'completed') list = list.filter(a => COMPLETED.includes(a.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => `${a.title} ${a.course?.name ?? ''}`.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => urgencyOrder(a) - urgencyOrder(b) || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [assignments, courseFilter, statusFilter, search])

  const handleStatusUpdate = async (id: string, status: string, extras: AssignmentStatusUpdateExtras = {}) => {
    if (updatingIds.has(id)) return
    setUpdatingIds(prev => new Set(prev).add(id))
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
      setUpdatingIds(prev => { const n = new Set(prev); n.delete(id); return n })
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
      await Promise.all(ids.map(id => deleteAssignment(id)))
      await Promise.all([refresh(), refreshLadder()])
    } catch {
      alert('Failed to delete. Please try again.')
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(230,234,246,0.7)',
    borderRadius: 6,
    fontSize: '0.78rem',
    padding: '6px 12px',
    outline: 'none',
  } as React.CSSProperties

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="flex items-start justify-between px-7 pt-6 pb-0 flex-shrink-0">
        <div>
          <Link href="/dashboard" className="text-[0.72rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>← Dashboard</Link>
          <h1 className="text-[1.35rem] font-semibold tracking-tight leading-none text-white/90 mt-2">Assignments</h1>
          <p className="text-[0.82rem] mt-1.5" style={{ color: 'rgba(230,234,246,0.3)' }}>
            {loading ? 'Loading…' : `${filtered.length} assignments`}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={() => deleteMany(assignments.filter(a => COMPLETED.includes(a.status)).map(a => a.id))}
            className="text-[0.72rem] px-2.5 py-1.5 rounded transition-colors"
            style={{ color: 'rgba(248,113,113,0.6)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            Delete completed
          </button>
          <button
            onClick={() => deleteMany(assignments.map(a => a.id))}
            className="text-[0.72rem] px-2.5 py-1.5 rounded transition-colors"
            style={{ color: 'rgba(248,113,113,0.6)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            Delete all
          </button>
          <Link
            href="/assignments/new"
            className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md"
            style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
          >
            + New
          </Link>
        </div>
      </div>

      <div
        className="flex items-center gap-3 px-7 py-3 border-b flex-shrink-0 flex-wrap"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ ...inputStyle, width: 160 }}
        />
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={inputStyle}>
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} style={inputStyle}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        {(search || courseFilter || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setCourseFilter(''); setStatusFilter('all') }}
            className="text-[0.75rem] transition-colors"
            style={{ color: 'rgba(230,234,246,0.3)' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-7 pb-12 pt-2">
        {loading ? (
          <div className="pt-12 text-center text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="pt-16 text-center text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>
            No assignments.{' '}
            <Link href="/assignments/new" className="text-blue-400 hover:text-blue-300">Add one</Link>.
          </div>
        ) : (
          <div className="pt-2">
            {filtered.map(a => (
              <Row
                key={a.id}
                assignment={a}
                onComplete={handleStatusUpdate}
                onDelete={handleDelete}
                updating={updatingIds.has(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
