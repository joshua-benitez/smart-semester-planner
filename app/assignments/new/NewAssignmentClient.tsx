'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { parseSyllabus } from '@/lib/parser'

type Course = { id: string; name: string }
type ParsedItem = { title: string; dueDate: string; type: 'homework' | 'quiz' | 'project' | 'exam'; difficulty: 'easy' | 'moderate' | 'crushing' | 'brutal'; confidence?: number }

const LABEL = 'block text-[0.75rem] font-medium mb-1.5'
const HINT  = 'text-[0.72rem] mt-1'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL} style={{ color: 'rgba(230,234,246,0.5)' }}>{label}</label>
      {children}
      {hint && <p className={HINT} style={{ color: 'rgba(230,234,246,0.25)' }}>{hint}</p>}
    </div>
  )
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
      .then(r => r.json())
      .then(p => { if (p.ok) setCourses(p.data ?? []) })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const setToday = () => {
    const d = new Date(); d.setHours(23, 59, 0, 0)
    setForm(prev => ({ ...prev, dueDate: d.toISOString().slice(0, 16) }))
  }
  const setTomorrow = () => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(23, 59, 0, 0)
    setForm(prev => ({ ...prev, dueDate: d.toISOString().slice(0, 16) }))
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
      const mapped: ParsedItem[] = parsed.map(item => ({
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
    setParsedItems(prev => {
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
    if (parsedItems.some(item => !item.title.trim() || !item.dueDate)) {
      alert('Fill in missing titles or due dates.')
      return
    }
    setSaving(true)
    try {
      const payloads = parsedItems.map(item => ({
        title: item.title.trim(),
        courseName: form.courseName.trim(),
        description: '',
        submissionNote: '',
        dueDate: item.dueDate,
        type: item.type,
        difficulty: item.difficulty,
        weight: 1,
      }))
      const results = await Promise.all(payloads.map(p =>
        fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        })
      ))
      if (results.some(r => !r.ok)) throw new Error('Failed')
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

  const inputCls = 'w-full text-[0.82rem] px-3 py-2 rounded-md outline-none transition-colors'
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(230,234,246,0.85)',
  } as React.CSSProperties

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <Link href="/assignments" className="text-[0.78rem] transition-colors" style={{ color: 'rgba(230,234,246,0.3)' }}>
            ← Back
          </Link>
          <h1 className="text-[1.1rem] font-semibold tracking-tight text-white/90">New Assignment</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowParser(true)}
            className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md"
            style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(230,234,246,0.5)' }}
          >
            Parse syllabus
          </button>
          <button
            form="new-assignment-form"
            type="submit"
            disabled={saving || !form.title.trim() || !form.dueDate || !form.courseName.trim()}
            className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md disabled:opacity-40 transition-opacity"
            style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
          >
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <form id="new-assignment-form" onSubmit={handleSubmit} className="max-w-xl space-y-5">
          <Field label="Title *">
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g., Calc II Homework 9.1"
              className={inputCls}
              style={inputStyle}
              required
              autoFocus
            />
          </Field>

          <Field label="Course *">
            <select value={form.courseName} onChange={set('courseName')} className={inputCls} style={inputStyle} required>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Due date *">
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={set('dueDate')}
              className={inputCls}
              style={inputStyle}
              required
            />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={setToday} className="text-[0.72rem] px-2.5 py-1 rounded transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(230,234,246,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Today 11:59
              </button>
              <button type="button" onClick={setTomorrow} className="text-[0.72rem] px-2.5 py-1 rounded transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(230,234,246,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Tomorrow 11:59
              </button>
            </div>
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
            <Field label="Grade weight (%)" hint="What % of your final grade">
              <input type="number" value={form.weight} onChange={set('weight')} min="0" max="100" className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Est. hours" hint="Optional">
              <input type="number" value={form.estimatedHours} onChange={set('estimatedHours')} placeholder="e.g. 2.5" min="0" step="0.5" className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <Field label="Description" hint="Optional — any context about what's needed">
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Any notes about this assignment…"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </Field>

          <Field label="Submission note" hint="Where to submit, portal link, etc.">
            <textarea
              value={form.submissionNote}
              onChange={set('submissionNote')}
              rows={2}
              placeholder="e.g. Submit via Brightspace dropbox"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </Field>
        </form>
      </div>
      {showParser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ background: 'rgba(11,13,18,0.7)' }} onClick={() => setShowParser(false)} />
          <div className="relative w-full max-w-3xl rounded-xl border p-5" style={{ background: '#0f1116', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[0.85rem] font-semibold text-white/90">Syllabus Parser</div>
                <div className="text-[0.72rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Paste your syllabus text to auto-create assignments.</div>
              </div>
              <button className="text-[0.75rem]" style={{ color: 'rgba(230,234,246,0.4)' }} onClick={() => setShowParser(false)}>
                Close
              </button>
            </div>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              rows={6}
              className="w-full text-[0.82rem] px-3 py-2 rounded-md outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(230,234,246,0.85)' }}
              placeholder="Paste syllabus text here..."
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleParse}
                className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md"
                style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
              >
                {parsing ? 'Parsing…' : 'Parse'}
              </button>
              <div className="text-[0.72rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>
                {parsedItems.length ? `${parsedItems.length} items` : 'No items yet'}
              </div>
            </div>

            {parsedItems.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {parsedItems.map((item, idx) => (
                  <div key={`${item.title}-${idx}`} className="grid gap-2 p-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <input
                      value={item.title}
                      onChange={(e) => updateParsed(idx, 'title', e.target.value)}
                      className="w-full text-[0.78rem] px-2 py-1 rounded-md outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(230,234,246,0.85)' }}
                    />
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={item.dueDate}
                        onChange={(e) => updateParsed(idx, 'dueDate', e.target.value)}
                        className="text-[0.75rem] px-2 py-1 rounded-md outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(230,234,246,0.85)' }}
                      />
                      <select
                        value={item.type}
                        onChange={(e) => updateParsed(idx, 'type', e.target.value)}
                        className="text-[0.75rem] px-2 py-1 rounded-md outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(230,234,246,0.85)' }}
                      >
                        <option value="homework">Homework</option>
                        <option value="quiz">Quiz</option>
                        <option value="project">Project</option>
                        <option value="exam">Exam</option>
                      </select>
                      <select
                        value={item.difficulty}
                        onChange={(e) => updateParsed(idx, 'difficulty', e.target.value)}
                        className="text-[0.75rem] px-2 py-1 rounded-md outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(230,234,246,0.85)' }}
                      >
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
              <div className="flex items-center justify-between mt-4">
                <div className="text-[0.72rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>
                  Creates assignments under the selected course.
                </div>
                <button
                  type="button"
                  onClick={handleBatchCreate}
                  className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md"
                  style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
                >
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
