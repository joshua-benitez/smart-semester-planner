'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Course = { id: string; name: string }

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
      fetch('/api/courses').then((r) => r.json()),
      fetch(`/api/assignments/${id}`).then((r) => r.json()),
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
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

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

  const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brandPrimary'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-gray-700'
  const hintCls = 'mt-1 text-xs text-gray-500'

  function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
      <div>
        <label className={labelCls}>{label}</label>
        {children}
        {hint && <p className={hintCls}>{hint}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-brandBg text-sm font-medium text-gray-500">
        Loading Assignment Data…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-brandBg">
      <div className="z-10 flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/assignments" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">← Back</Link>
          <h1 className="border-l border-gray-300 pl-4 text-xl font-bold tracking-tight text-gray-900">Edit Assignment</h1>
        </div>
        <button
          form="edit-assignment-form"
          type="submit"
          disabled={saving || !form.title.trim() || !form.dueDate || !form.courseName.trim()}
          className="btn-primary px-5 py-2 text-sm"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form id="edit-assignment-form" onSubmit={handleSubmit} className="space-y-6">
            <Field label="Title *">
              <input type="text" value={form.title} onChange={set('title')} className={inputCls} required autoFocus />
            </Field>

            <Field label="Course *">
              <select value={form.courseName} onChange={set('courseName')} className={inputCls} required>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="Due date *">
              <input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} className={inputCls} required />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select value={form.type} onChange={set('type')} className={inputCls}>
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Project</option>
                  <option value="exam">Exam</option>
                </select>
              </Field>
              <Field label="Difficulty">
                <select value={form.difficulty} onChange={set('difficulty')} className={inputCls}>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="crushing">Crushing</option>
                  <option value="brutal">Brutal</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Grade weight (%)" hint="What % of your final grade">
                <input type="number" value={form.weight} onChange={set('weight')} min="0" max="100" className={inputCls} />
              </Field>
              <Field label="Est. hours" hint="Optional">
                <input type="number" value={form.estimatedHours} onChange={set('estimatedHours')} placeholder="e.g. 2.5" min="0" step="0.5" className={inputCls} />
              </Field>
            </div>

            <Field label="Description" hint="Optional — any context about what's needed">
              <textarea value={form.description} onChange={set('description')} rows={4} className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Submission note" hint="Where to submit, portal link, etc.">
              <textarea value={form.submissionNote} onChange={set('submissionNote')} rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </form>
        </div>
      </div>
    </div>
  )
}
