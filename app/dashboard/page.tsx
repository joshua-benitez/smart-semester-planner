'use client'

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAssignments } from "@/hooks/useAssignments"
import { useLadder } from "@/hooks/useLadder"
import type { AssignmentStatusUpdateExtras, Assignment } from "@/types/assignment"
import LadderSidebarCard from "@/components/features/ladder/LadderSidebarCard"
import RecommendationPanel from "@/components/features/assignments/RecommendationPanel"

type Course = {
  id: string
  name: string
  color?: string
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function formatDueState(dateStr: string): { label: string; cls: string; date: string } {
  const d = daysUntil(dateStr)
  const dateLabel = new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, cls: "text-red-600 font-semibold", date: dateLabel }
  if (d === 0) return { label: "Due today", cls: "text-red-600 font-semibold", date: "" }
  if (d === 1) return { label: "Tomorrow", cls: "text-amber-600 font-semibold", date: dateLabel }
  if (d <= 7) return { label: `${d}d left`, cls: "text-amber-600 font-semibold", date: dateLabel }
  return { label: dateLabel, cls: "text-gray-500 font-normal", date: "" }
}

function urgencyGroup(a: Assignment): "overdue" | "today" | "week" | "next" | "later" {
  const d = daysUntil(a.dueDate)
  if (d < 0) return "overdue"
  if (d === 0) return "today"
  if (d <= 7) return "week"
  if (d <= 14) return "next"
  return "later"
}

interface RowProps {
  assignment: Assignment
  onComplete: (id: string, status: string, extras?: AssignmentStatusUpdateExtras) => Promise<void>
  updating: boolean
}

function AssignmentRow({ assignment, onComplete, updating }: RowProps) {
  const due = formatDueState(assignment.dueDate)
  const isDone = assignment.status === "completed" || assignment.status === "submitted" || assignment.status === "graded"
  const courseName = assignment.course?.name ?? "General"

  const courseColors = [
    "bg-emerald-100 text-emerald-800",
    "bg-blue-100 text-blue-800",
    "bg-violet-100 text-violet-800",
    "bg-rose-100 text-rose-800",
    "bg-orange-100 text-orange-800",
  ]
  const colorIdx = Math.abs(courseName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % courseColors.length
  const badgeColor = courseColors[colorIdx]

  return (
    <div
      className={`group flex items-start gap-3 bg-white px-4 py-3 transition-colors hover:bg-gray-50 ${
        isDone ? "opacity-50" : ""
      }`}
    >
      <button
        disabled={updating}
        onClick={() =>
          onComplete(assignment.id, isDone ? "not_started" : "completed", {
            submittedAt: isDone ? null : new Date().toISOString(),
          })
        }
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all disabled:opacity-40 ${
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-gray-300 text-transparent hover:border-emerald-500 hover:text-emerald-500"
        }`}
        title={isDone ? "Undo" : "Mark complete"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
        </svg>
      </button>

      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className={`truncate text-[0.95rem] font-semibold leading-snug text-gray-900 ${isDone ? "line-through text-gray-500" : ""}`}>
          {assignment.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[0.75rem] font-medium text-gray-500">
          <span className={`rounded px-2 py-0.5 text-[0.7rem] font-bold ${badgeColor}`}>{courseName}</span>
          <span className="capitalize">{assignment.type}</span>
          {assignment.weight ? <span>· {assignment.weight}%</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-right">
        <div className={`text-[0.8rem] font-medium ${isDone ? "text-gray-400" : due.cls}`}>{due.label}</div>
        {due.date && <div className="font-mono text-[0.7rem] text-gray-400">{due.date}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { assignments, loading, refresh } = useAssignments()
  const { data: ladderData, loading: ladderLoading, error: ladderError, refresh: refreshLadder } = useLadder()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [showCompleted, setShowCompleted] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const courseParam = searchParams.get("course")
    if (courseParam) setSelectedCourseId(courseParam)
  }, [searchParams])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses")
        if (res.ok) {
          const payload = await res.json()
          if (payload.ok) setCourses(payload.data ?? [])
        }
      } catch (err) {
        console.error("Error fetching courses:", err)
      }
    }
    fetchCourses()
  }, [])

  const filtered = useMemo(() => {
    let list = assignments

    if (selectedCourseId) {
      list = list.filter((a) => {
        if (a.courseId === selectedCourseId) return true
        const course = courses.find((c) => c.id === selectedCourseId)
        return Boolean(course && a.course?.name === course.name)
      })
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    list = list.filter((a) => {
      if (a.status !== "completed") return true
      if (!a.submittedAt) return true
      return new Date(a.submittedAt) > cutoff
    })

    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [assignments, selectedCourseId, courses])

  const sections = useMemo(() => {
    const completedStatuses = ["completed", "submitted", "graded"]
    const active = filtered.filter((a) => !completedStatuses.includes(a.status))
    const done = filtered.filter((a) => completedStatuses.includes(a.status))

    const groups: Record<string, Assignment[]> = { overdue: [], today: [], week: [], next: [], later: [] }
    active.forEach((a) => groups[urgencyGroup(a)].push(a))

    return { groups, done }
  }, [filtered])

  const summary = useMemo(() => {
    const overdue = sections.groups.overdue
    const thisWk = [...sections.groups.today, ...sections.groups.week]
    if (overdue.length === 0 && thisWk.length === 0) return "All clear. Nothing due in the next 7 days."

    const parts: string[] = []
    if (overdue.length > 0) {
      const first = overdue[0]
      parts.push(`${overdue.length} overdue. Start with ${first.course?.name ?? ""} ${first.title.split(/[—–]/)[0].trim()}.`)
    }
    if (thisWk.length > 0) {
      const next = thisWk[0]
      const d = daysUntil(next.dueDate)
      const when = d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d}d`
      parts.push(`${thisWk.length} due this week. Next: ${next.course?.name ?? ""} ${next.title.split(/[—–]/)[0].trim()} ${when}.`)
    }
    return parts.join(" ")
  }, [sections])

  const handleStatusUpdate = async (id: string, status: string, extras: AssignmentStatusUpdateExtras = {}) => {
    if (updatingIds.has(id)) return
    setUpdatingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, ...extras }),
      })
      if (!res.ok) throw new Error("Failed to update")
      await Promise.all([refresh(), refreshLadder()])
    } catch (err) {
      console.error("Status update error:", err)
      alert("Failed to update assignment status. Please try again.")
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const SECTION_META: { key: "overdue" | "today" | "week" | "next" | "later"; name: string; urgent?: boolean; warn?: boolean }[] = [
    { key: "overdue", name: "Overdue", urgent: true },
    { key: "today", name: "Today", urgent: true },
    { key: "week", name: "This Week", warn: true },
    { key: "next", name: "Next Week" },
    { key: "later", name: "Upcoming" },
  ]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      <div className="z-20 flex flex-shrink-0 items-start justify-between border-b border-gray-200 bg-white px-8 pb-4 pt-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">{loading ? "Loading…" : summary}</p>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <Link href="/assignments/new" className="btn-primary px-4 py-2 text-sm shadow-sm">
            + New Task
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 pb-20 pt-8 lg:px-10">
          {loading ? (
            <div className="pt-12 text-center text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-10">
              <div>
                <RecommendationPanel assignments={filtered} />
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                  <h2 className="text-lg font-bold tracking-tight text-gray-900">Schedule</h2>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-500">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="rounded border-gray-300 text-brandPrimary focus:ring-brandPrimary"
                    />
                    Show Completed
                  </label>
                </div>

                <div className="flex flex-col gap-6">
                  {SECTION_META.map(({ key, name, urgent, warn }) => {
                    const items = sections.groups[key as keyof typeof sections.groups]
                    if (!items.length) return null

                    return (
                      <div key={key} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                          <h3 className={`text-xs font-bold uppercase tracking-wider ${urgent ? "text-red-600" : warn ? "text-orange-600" : "text-gray-600"}`}>
                            {name}
                          </h3>
                          <span className="rounded-full bg-gray-200/60 px-2 py-0.5 text-xs font-semibold text-gray-500">
                            {items.length}
                          </span>
                        </div>

                        <div className="flex flex-col divide-y divide-gray-100">
                          {items.map((a) => (
                            <AssignmentRow
                              key={a.id}
                              assignment={a}
                              onComplete={handleStatusUpdate}
                              updating={updatingIds.has(a.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {showCompleted && sections.done.length > 0 && (
                  <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Completed</h3>
                      <span className="rounded-full bg-gray-200/60 px-2 py-0.5 text-xs font-semibold text-gray-500">
                        {sections.done.length}
                      </span>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-100">
                      {sections.done.map((a) => (
                        <AssignmentRow
                          key={a.id}
                          assignment={a}
                          onComplete={handleStatusUpdate}
                          updating={updatingIds.has(a.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {Object.values(sections.groups).every((g) => g.length === 0) && !sections.done.length && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                    <p className="mb-1 text-sm font-semibold text-gray-900">Your schedule is clear.</p>
                    <p className="mb-4 text-xs text-gray-500">Import a syllabus or add tasks manually to get started.</p>
                    <Link href="/assignments/new" className="btn-secondary text-sm">
                      Add Assignment
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="z-10 hidden w-80 overflow-y-auto border-l border-gray-200 bg-white px-6 py-6 shadow-sm xl:block">
          <LadderSidebarCard
            data={ladderData}
            loading={ladderLoading}
            error={ladderError}
            onRefresh={refreshLadder}
          />
        </aside>
      </div>
    </div>
  )
}
