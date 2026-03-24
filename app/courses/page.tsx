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
    <div className="flex h-full flex-col overflow-hidden bg-brandBg">
      <div className="z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            ← Dashboard
          </Link>
          <h1 className="border-l border-gray-300 pl-4 text-xl font-bold tracking-tight text-gray-900">Course Directory</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create New Course</h2>
              <p className="text-sm text-gray-500">Group your assignments by creating a dedicated course label.</p>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Data Structures"
                className={`${inputCls} w-full sm:max-w-[240px]`}
                required
              />
              <div className="flex items-center gap-2 px-2">
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
                className="btn-primary whitespace-nowrap text-sm sm:ml-auto"
              >
                {saving ? 'Adding…' : 'Add Course'}
              </button>
            </form>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Active Courses
              </h2>
            </div>

            {loading ? (
              <div className="text-sm text-gray-500">Loading courses…</div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center shadow-sm">
                <p className="text-sm font-semibold text-gray-900">No courses yet</p>
                <p className="mt-1 text-xs text-gray-500">Add your first course above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                  >
                    <div className="h-2 w-full" style={{ backgroundColor: c.color ?? '#3b82f6' }} />

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-1 truncate text-lg font-bold text-gray-900" title={c.name}>
                        {c.name}
                      </h3>
                      <div className="mb-6 text-xs font-medium text-gray-500">
                        {c._count?.assignments || 0} Assignment{c._count?.assignments !== 1 ? 's' : ''}
                      </div>

                      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/dashboard?course=${c.id}`}
                          className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                          View Tasks
                        </Link>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deleting === c.id}
                          className="flex-1 rounded-md border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-40"
                        >
                          {deleting === c.id ? '…' : 'Delete'}
                        </button>
                      </div>
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
