'use client'

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAssignments } from "@/hooks/useAssignments"
import { useLadder } from "@/hooks/useLadder"
import type { AssignmentStatusUpdateExtras, Assignment } from "@/types/assignment"
import LadderSidebarCard from "@/components/features/ladder/LadderSidebarCard"

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
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, cls: "text-red-400 font-semibold", date: dateLabel }
  if (d === 0) return { label: "Due today", cls: "text-red-400 font-semibold", date: "" }
  if (d === 1) return { label: "Tomorrow", cls: "text-amber-400 font-semibold", date: dateLabel }
  if (d <= 7) return { label: `${d}d left`, cls: "text-amber-400 font-semibold", date: dateLabel }
  return { label: dateLabel, cls: "text-white/30 font-normal", date: "" }
}

function urgencyGroup(a: Assignment): "overdue" | "today" | "week" | "next" | "later" {
  const d = daysUntil(a.dueDate)
  if (d < 0) return "overdue"
  if (d === 0) return "today"
  if (d <= 7) return "week"
  if (d <= 14) return "next"
  return "later"
}

function SectionLabel({
  name,
  count,
  urgent,
  warn,
}: {
  name: string
  count: number
  urgent?: boolean
  warn?: boolean
}) {
  return (
    <div className="flex items-center gap-2 mb-1 px-1">
      <span
        className={`text-[0.67rem] font-semibold tracking-[0.09em] uppercase ${
          urgent ? "text-red-400" : warn ? "text-amber-400" : "text-white/30"
        }`}
      >
        {name}
      </span>
      <span className="font-mono text-[0.63rem] text-white/25">{count}</span>
    </div>
  )
}

interface RowProps {
  assignment: Assignment
  onComplete: (id: string, status: string, extras?: AssignmentStatusUpdateExtras) => Promise<void>
  updating: boolean
}

function AssignmentRow({ assignment, onComplete, updating }: RowProps) {
  const due = formatDueState(assignment.dueDate)
  const isDone = assignment.status === "completed" || assignment.status === "submitted" || assignment.status === "graded"
  const courseName = assignment.course?.name ?? ""

  const courseColors = ["text-emerald-400", "text-blue-400", "text-violet-400", "text-cyan-400", "text-rose-400", "text-orange-400"]
  const colorIdx = Math.abs(courseName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % courseColors.length
  const courseColor = courseColors[colorIdx]

  return (
    <div
      className={`grid items-center gap-3 px-2 py-[7px] rounded-md transition-colors hover:bg-white/[0.03] ${
        isDone ? "opacity-30" : ""
      }`}
      style={{ gridTemplateColumns: "1fr 90px 28px" }}
    >
      <div className="min-w-0">
        <div className={`text-[0.875rem] font-medium text-white/90 truncate leading-snug ${isDone ? "line-through" : ""}`}>
          {assignment.title}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[0.7rem] text-white/30">
          <span className={`font-semibold ${courseColor}`}>{courseName}</span>
          <span>·</span>
          <span className="capitalize">{assignment.type}</span>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-[0.75rem] leading-snug ${due.cls}`}>{due.label}</div>
        {due.date && <div className="font-mono text-[0.62rem] text-white/25 mt-0.5">{due.date}</div>}
      </div>

      <button
        disabled={updating}
        onClick={() =>
          onComplete(assignment.id, isDone ? "not_started" : "completed", {
            submittedAt: isDone ? null : new Date().toISOString(),
          })
        }
        className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-all disabled:opacity-40 justify-self-center ${
          isDone
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
            : "border-white/15 text-transparent hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/[0.07]"
        }`}
        title={isDone ? "Undo" : "Mark complete"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-[10px] h-[10px]">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { assignments, loading, refresh } = useAssignments()
  const { data: ladderData, loading: ladderLoading, error: ladderError, refresh: refreshLadder } = useLadder()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
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
        return course && a.course?.name === course.name
      })
    }

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((a) =>
        `${a.title} ${a.course?.name ?? ""} ${a.description ?? ""}`.toLowerCase().includes(q)
      )
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    list = list.filter((a) => {
      if (a.status !== "completed") return true
      if (!a.submittedAt) return true
      return new Date(a.submittedAt) > cutoff
    })

    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [assignments, selectedCourseId, searchQuery, courses])

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
    if (overdue.length === 0 && thisWk.length === 0) return "All clear — nothing urgent right now."
    const parts: string[] = []
    if (overdue.length > 0) {
      const first = overdue[0]
      parts.push(`${overdue.length} overdue — start with ${first.course?.name ?? ""} ${first.title.split(/[—–]/)[0].trim()}.`)
    }
    if (thisWk.length > 0) {
      const next = thisWk[0]
      const d = daysUntil(next.dueDate)
      const when = d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d}d`
      parts.push(`${thisWk.length} due this week — next: ${next.course?.name ?? ""} ${next.title.split(/[—–]/)[0].trim()} ${when}.`)
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

  const SECTION_META = [
    { key: "overdue", name: "Overdue", urgent: true },
    { key: "today", name: "Today", urgent: true },
    { key: "week", name: "This week", warn: true },
    { key: "next", name: "Next week", warn: false },
    { key: "later", name: "Upcoming", warn: false },
  ] as const

  const uniqueCourses = useMemo(() => {
    const seen = new Set<string>()
    const out: { id: string; name: string }[] = []
    assignments.forEach((a) => {
      const key = a.courseId ?? a.course?.name ?? ""
      if (key && !seen.has(key)) {
        seen.add(key)
        out.push({ id: a.courseId ?? key, name: a.course?.name ?? key })
      }
    })
    return out
  }, [assignments])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-start justify-between px-7 pt-6 pb-0 flex-shrink-0" style={{ background: "#0b0d12" }}>
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight leading-none text-white/90">Assignments</h1>
          <p className="text-[0.82rem] mt-1.5 leading-relaxed" style={{ color: "rgba(230,234,246,0.3)" }}>
            {loading
              ? "Loading…"
              : summary.split(/(overdue|this week)/gi).map((part, i) => {
                  const lower = part.toLowerCase()
                  if (lower === "overdue") return <span key={i} className="text-red-400 font-medium">overdue</span>
                  if (lower === "this week") return <span key={i} className="text-amber-400 font-medium">this week</span>
                  return part
                })}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Link
            href="/assignments/new"
            className="text-[0.77rem] font-semibold px-3 py-1.5 rounded-md text-white"
            style={{ background: "rgba(230,234,246,0.9)", color: "#0b0d12" }}
          >
            + New
          </Link>
          <button
            onClick={async () => {
              await signOut({ redirect: false })
              router.replace("/auth/signin")
            }}
            className="text-[0.77rem] font-medium px-3 py-1.5 rounded-md border transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.09)", color: "rgba(230,234,246,0.5)" }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="flex items-center px-7 border-b flex-shrink-0 mt-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0b0d12" }}>
        <button
          onClick={() => setSelectedCourseId("")}
          className={`text-[0.79rem] font-medium px-3 py-2 border-b-2 transition-colors mr-1 ${
            selectedCourseId === ""
              ? "border-white/40 text-white/90"
              : "border-transparent text-white/30 hover:text-white/50"
          }`}
          style={{ marginBottom: -1 }}
        >
          All
        </button>
        <div className="w-px h-3.5 mx-1.5" style={{ background: "rgba(255,255,255,0.09)" }} />
        {uniqueCourses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourseId(c.id === selectedCourseId ? "" : c.id)}
            className={`text-[0.79rem] font-medium px-3 py-2 border-b-2 transition-colors ${
              selectedCourseId === c.id
                ? "border-current text-white/90"
                : "border-transparent text-white/30 hover:text-white/50"
            }`}
            style={{ marginBottom: -1 }}
          >
            {c.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 pb-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="text-[0.75rem] px-3 py-1.5 rounded-md outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(230,234,246,0.7)",
              width: 140,
            }}
          />
          <label className="flex items-center gap-1.5 text-[0.75rem] cursor-pointer" style={{ color: "rgba(230,234,246,0.3)" }}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="cursor-pointer"
              style={{ accentColor: "#4ade80" }}
            />
            Completed
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" style={{ background: "#0b0d12" }}>
        <div className="flex-1 overflow-y-auto px-7 pb-12">
          {loading ? (
            <div className="pt-12 text-center text-[0.85rem]" style={{ color: "rgba(230,234,246,0.3)" }}>
              Loading…
            </div>
          ) : (
            <>
              {SECTION_META.map(({ key, name, urgent, warn }) => {
                const items = sections.groups[key as keyof typeof sections.groups]
                if (!items.length) return null
                return (
                  <div key={key} className="pt-5">
                    <SectionLabel name={name} count={items.length} urgent={urgent} warn={warn} />
                    {items.map((a) => (
                      <AssignmentRow
                        key={a.id}
                        assignment={a}
                        onComplete={handleStatusUpdate}
                        updating={updatingIds.has(a.id)}
                      />
                    ))}
                  </div>
                )
              })}

              {showCompleted && sections.done.length > 0 && (
                <div className="pt-5">
                  <SectionLabel name="Completed" count={sections.done.length} />
                  {sections.done.map((a) => (
                    <AssignmentRow
                      key={a.id}
                      assignment={a}
                      onComplete={handleStatusUpdate}
                      updating={updatingIds.has(a.id)}
                    />
                  ))}
                </div>
              )}

              {Object.values(sections.groups).every((g) => g.length === 0) && !sections.done.length && (
                <div className="pt-16 text-center text-[0.85rem]" style={{ color: "rgba(230,234,246,0.3)" }}>
                  No assignments. <Link href="/assignments/new" className="text-blue-400 hover:text-blue-300">Add one</Link>.
                </div>
              )}
            </>
          )}
        </div>

        <aside
          className="hidden xl:block w-80 border-l px-5 pb-6 overflow-y-auto"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
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
