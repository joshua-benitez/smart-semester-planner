'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Course = { id: string; name: string }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.75rem] font-medium mb-1.5" style={{ color: 'rgba(230,234,246,0.5)' }}>{label}</label>
      {children}
      {hint && <p className="text-[0.72rem] mt-1" style={{ color: 'rgba(230,234,246,0.25)' }}>{hint}</p>}
    </div>
  )
}

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [courses, setCourses] = useState<Course[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    courseName: '',
    description: '',
    submissionNote: '',
    dueDate: '',
    type: 'homework',
    difficulty: 'moderate',
    weight: '20',
    estimatedHours: '',
  })

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch('/api/courses').then(r => r.json()),
      fetch(`/api/assignments/${id}`).then(r => r.json()),
    ]).then(([cp, ap]) => {
      if (cp.ok) setCourses(cp.data ?? [])
      if (ap.ok && ap.data) {
        const a = ap.data
        setForm({
          title: a.title ?? '',
          courseName: a.course?.name ?? '',
          description: a.description ?? '',
          submissionNote: a.submissionNote ?? '',
          dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '',
          type: a.type ?? 'homework',
          difficulty: a.difficulty ?? 'moderate',
          weight: String(a.weight ?? 20),
          estimatedHours: a.estimatedHours ? String(a.estimatedHours) : '',
        })
      }
    }).finally(() => setLoading(false))
  }, [id])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.dueDate || !form.courseName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: form.title.trim(),
          courseName: form.courseName.trim(),
          description: form.description ?? '',
          submissionNote: form.submissionNote ?? '',
          dueDate: form.dueDate,
          type: form.type,
          difficulty: form.difficulty,
          weight: parseFloat(form.weight) || 0,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/assignments')
    } catch {
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full text-[0.82rem] px-3 py-2 rounded-md outline-none transition-colors'
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(230,234,246,0.85)',
  } as React.CSSProperties

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-[0.85rem]" style={{ background: '#0b0d12', color: 'rgba(230,234,246,0.3)' }}>
      Loading…
    </div>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <Link href="/assignments" className="text-[0.78rem] transition-colors" style={{ color: 'rgba(230,234,246,0.3)' }}>
            ← Back
          </Link>
          <h1 className="text-[1.1rem] font-semibold tracking-tight text-white/90">Edit Assignment</h1>
        </div>
        <button
          form="edit-assignment-form"
          type="submit"
          disabled={saving || !form.title.trim() || !form.dueDate || !form.courseName.trim()}
          className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md disabled:opacity-40 transition-opacity"
          style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <form id="edit-assignment-form" onSubmit={handleSubmit} className="max-w-xl space-y-5">
          <Field label="Title *">
            <input type="text" value={form.title} onChange={set('title')} className={inputCls} style={inputStyle} required autoFocus />
          </Field>

          <Field label="Course *">
            <select value={form.courseName} onChange={set('courseName')} className={inputCls} style={inputStyle} required>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Due date *">
            <input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} className={inputCls} style={inputStyle} required />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.type} onChange={set('type')} className={inputCls} style={inputStyle}>
                <option value="homework">Homework</option>
                <option value="quiz">Quiz</option>
                <option value="project">Project</option>
                <option value="exam">Exam</option>
              </select>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={set('difficulty')} className={inputCls} style={inputStyle}>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="crushing">Crushing</option>
                <option value="brutal">Brutal</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Grade weight (%)">
              <input type="number" value={form.weight} onChange={set('weight')} min="0" max="100" className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Est. hours">
              <input type="number" value={form.estimatedHours} onChange={set('estimatedHours')} placeholder="e.g. 2.5" min="0" step="0.5" className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <Field label="Description">
            <textarea value={form.description} onChange={set('description')} rows={3} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>

          <Field label="Submission note">
            <textarea value={form.submissionNote} onChange={set('submissionNote')} rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>
        </form>
      </div>
    </div>
  )
}
