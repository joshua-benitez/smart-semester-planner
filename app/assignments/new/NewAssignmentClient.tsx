'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { parseSyllabus } from '@/lib/parser'

type Course = { id: string; name: string }
type ParsedItem = {
  title: string
  dueDate: string
  type: 'homework' | 'quiz' | 'project' | 'exam'
  difficulty: 'easy' | 'moderate' | 'crushing' | 'brutal'
  confidence?: number
}

export default function NewAssignmentClient() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [saving, setSaving] = useState(false)
  const [showParser, setShowParser] = useState(false)
  const [syllabusText, setSyllabusText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [parsing, setParsing] = useState(false)
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
    fetch('/api/courses')
      .then((r) => r.json())
      .then((p) => { if (p.ok) setCourses(p.data ?? []) })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const setToday = () => {
    const d = new Date()
    d.setHours(23, 59, 0, 0)
    setForm((prev) => ({ ...prev, dueDate: d.toISOString().slice(0, 16) }))
  }

  const setTomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(23, 59, 0, 0)
    setForm((prev) => ({ ...prev, dueDate: d.toISOString().slice(0, 16) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.dueDate || !form.courseName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      alert('Failed to create assignment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleParse = () => {
    if (!syllabusText.trim()) return
    setParsing(true)
    try {
      const parsed = parseSyllabus(syllabusText, {
        referenceDate: new Date(),
        defaultDueTime: '23:59',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
        acceptPastDates: true,
      })
      const mapped: ParsedItem[] = parsed.map((item) => ({
        title: item.title,
        dueDate: item.dueDate === 'TBD' ? '' : item.dueDate,
        type: item.type,
        difficulty: item.difficulty,
        confidence: item.confidence,
      }))
      setParsedItems(mapped)
    } catch {
      alert('Failed to parse syllabus. Check formatting and try again.')
    } finally {
      setParsing(false)
    }
  }

  const updateParsed = (index: number, field: keyof ParsedItem, value: string) => {
    setParsedItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleBatchCreate = async () => {
    if (!form.courseName.trim()) {
      alert('Select a course first.')
      return
    }
    if (parsedItems.some((item) => !item.title.trim() || !item.dueDate)) {
      alert('Fill in missing titles or due dates.')
      return
    }
    setSaving(true)
    try {
      const payloads = parsedItems.map((item) => ({
        title: item.title.trim(),
        courseName: form.courseName.trim(),
        description: '',
        submissionNote: '',
        dueDate: item.dueDate,
        type: item.type,
        difficulty: item.difficulty,
        weight: 1,
      }))
      const results = await Promise.all(payloads.map((p) =>
        fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        })
      ))
      if (results.some((r) => !r.ok)) throw new Error('Failed')
      setShowParser(false)
      setSyllabusText('')
      setParsedItems([])
      router.push('/assignments')
    } catch {
      alert('Failed to create assignments. Please try again.')
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brandBg">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-8 py-5">
        <div className="flex items-center gap-4">
          <Link href="/assignments" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">← Back</Link>
          <h1 className="border-l border-gray-300 pl-4 text-xl font-bold tracking-tight text-gray-900">New Assignment</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowParser(true)} className="btn-secondary text-sm">
            Parse syllabus
          </button>
          <button
            form="new-assignment-form"
            type="submit"
            disabled={saving || !form.title.trim() || !form.dueDate || !form.courseName.trim()}
            className="btn-primary text-sm"
          >
            {saving ? 'Saving…' : 'Create Task'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form id="new-assignment-form" onSubmit={handleSubmit} className="space-y-6">
            <Field label="Title *">
              <input type="text" value={form.title} onChange={set('title')} placeholder="e.g., Calc II Homework 9.1" className={inputCls} required autoFocus />
            </Field>

            <Field label="Course *">
              <select value={form.courseName} onChange={set('courseName')} className={inputCls} required>
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="Due date *">
              <input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} className={inputCls} required />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={setToday} className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200">Today 11:59</button>
                <button type="button" onClick={setTomorrow} className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200">Tomorrow 11:59</button>
              </div>
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
              <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Any notes about this assignment…" className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Submission note" hint="Where to submit, portal link, etc.">
              <textarea value={form.submissionNote} onChange={set('submissionNote')} rows={2} placeholder="e.g. Submit via Brightspace dropbox" className={`${inputCls} resize-none`} />
            </Field>
          </form>
        </div>
      </div>

      {showParser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Syllabus Parser</h2>
                <p className="text-sm text-gray-500">Paste your syllabus text to auto-create assignments.</p>
              </div>
              <button className="text-sm font-medium text-gray-500 hover:text-gray-900" onClick={() => setShowParser(false)}>Close</button>
            </div>

            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              rows={6}
              className={`${inputCls} font-mono text-sm`}
              placeholder="Paste syllabus text here..."
            />

            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={handleParse} className="btn-primary text-sm">
                {parsing ? 'Parsing…' : 'Extract Assignments'}
              </button>
              <div className="text-sm font-medium text-gray-500">
                {parsedItems.length ? `${parsedItems.length} items found` : ''}
              </div>
            </div>

            {parsedItems.length > 0 && (
              <div className="mt-6 max-h-72 space-y-3 overflow-y-auto">
                {parsedItems.map((item, idx) => (
                  <div key={`${item.title}-${idx}`} className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <input value={item.title} onChange={(e) => updateParsed(idx, 'title', e.target.value)} className={inputCls} />
                    <div className="grid gap-2 md:grid-cols-3">
                      <input type="datetime-local" value={item.dueDate} onChange={(e) => updateParsed(idx, 'dueDate', e.target.value)} className={inputCls} />
                      <select value={item.type} onChange={(e) => updateParsed(idx, 'type', e.target.value)} className={inputCls}>
                        <option value="homework">Homework</option>
                        <option value="quiz">Quiz</option>
                        <option value="project">Project</option>
                        <option value="exam">Exam</option>
                      </select>
                      <select value={item.difficulty} onChange={(e) => updateParsed(idx, 'difficulty', e.target.value)} className={inputCls}>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="crushing">Crushing</option>
                        <option value="brutal">Brutal</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {parsedItems.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">Creates assignments under the selected course.</div>
                <button type="button" onClick={handleBatchCreate} className="btn-primary text-sm">
                  Create {parsedItems.length}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
