'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

type Course = { id: string; name: string; color?: string; _count?: { assignments: number } }

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f97316', '#06b6d4', '#eab308']

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const fetchCourses = () =>
    fetch('/api/courses')
      .then((r) => r.json())
      .then((p) => { if (p.ok) setCourses(p.data ?? []) })
      .finally(() => setLoading(false))

  useEffect(() => { fetchCourses() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      })
      if (!res.ok) throw new Error('Failed')
      setName('')
      await fetchCourses()
    } catch {
      alert('Failed to create course.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (course: Course) => {
    if (course._count?.assignments && course._count.assignments > 0) {
      alert('Cannot delete course with existing assignments.')
      return
    }
    if (!confirm('Delete this course? Assignments will be unlinked.')) return
    setDeleting(course.id)
    try {
      const res = await fetch('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: course.id }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchCourses()
    } catch {
      alert('Failed to delete course.')
    } finally {
      setDeleting(null)
    }
  }

  const inputCls = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brandPrimary'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brandBg">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-8 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            ← Dashboard
          </Link>
          <h1 className="border-l border-gray-300 pl-4 text-2xl font-bold tracking-tight text-gray-900">Courses</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl space-y-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Add course
            </div>
            <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Course name"
                className={`${inputCls} min-w-[220px] flex-1`}
                required
              />
              <div className="flex items-center gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full border-2 transition-transform"
                    style={{
                      background: c,
                      borderColor: color === c ? '#111827' : 'transparent',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="btn-primary text-sm"
              >
                {saving ? 'Adding…' : 'Add Course'}
              </button>
            </form>
          </div>

          <div>
            <div className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
              Your courses
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : courses.length === 0 ? (
              <div className="text-sm text-gray-500">No courses yet.</div>
            ) : (
              <div className="space-y-2">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-gray-300"
                    style={{ borderLeft: `4px solid ${c.color ?? '#3b82f6'}` }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900">{c.name}</div>
                      {c._count && (
                        <div className="text-xs text-gray-500">
                          {c._count.assignments} assignment{c._count.assignments !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/dashboard?course=${c.id}`}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deleting === c.id}
                        className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-40"
                      >
                        {deleting === c.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
