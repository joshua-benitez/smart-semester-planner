'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

type Course = { id: string; name: string; color?: string; _count?: { assignments: number } }

const DEFAULT_COLORS = ['#2dd4a0','#5ba3f5','#9d7ef0','#22d3ee','#fb923c','#f472b6','#facc15']

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#5ba3f5')

  const fetchCourses = () =>
    fetch('/api/courses')
      .then(r => r.json())
      .then(p => { if (p.ok) setCourses(p.data ?? []) })
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

  const inputCls = 'text-[0.82rem] px-3 py-2 rounded-md outline-none transition-colors'
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(230,234,246,0.85)',
  } as React.CSSProperties

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[0.78rem] transition-colors" style={{ color: 'rgba(230,234,246,0.3)' }}>
            ← Dashboard
          </Link>
          <h1 className="text-[1.1rem] font-semibold tracking-tight text-white/90">Courses</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6 max-w-2xl">
        <div className="mb-8">
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
            Add course
          </div>
          <form onSubmit={handleCreate} className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Course name"
              className={`${inputCls} flex-1 min-w-0`}
              style={{ ...inputStyle, minWidth: 180 }}
              required
            />
            <div className="flex items-center gap-1.5">
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: color === c ? 'scale(1.25)' : 'scale(1)',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="text-[0.77rem] font-semibold px-3 py-2 rounded-md disabled:opacity-40 transition-opacity"
              style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </form>
        </div>

        <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
          Your courses
        </div>

        {loading ? (
          <div className="text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Loading…</div>
        ) : courses.length === 0 ? (
          <div className="text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>No courses yet.</div>
        ) : (
          <div className="space-y-1">
            {courses.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-md group transition-colors hover:bg-white/[0.03]"
                style={{ borderLeft: `3px solid ${c.color ?? '#5ba3f5'}` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="text-[0.875rem] font-medium truncate" style={{ color: 'rgba(230,234,246,0.85)' }}>{c.name}</div>
                    {c._count && (
                      <div className="text-[0.7rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>
                        {c._count.assignments} assignment{c._count.assignments !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/dashboard?course=${c.id}`}
                    className="text-[0.72rem] px-2 py-1 rounded transition-colors"
                    style={{ color: 'rgba(230,234,246,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deleting === c.id}
                    className="text-[0.72rem] px-2 py-1 rounded transition-colors disabled:opacity-40"
                    style={{ color: 'rgba(248,113,113,0.6)', border: '1px solid rgba(248,113,113,0.2)' }}
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
  )
}
