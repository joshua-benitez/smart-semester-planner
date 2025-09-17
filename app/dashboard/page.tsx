'use client'

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAssignments } from "@/hooks/useAssignments"
import { AssignmentList } from "@/components/features/assignments/AssignmentList"
// Logo removed to avoid duplicate branding with Sidebar

type Course = {
  id: string
  name: string
  color?: string
}

const difficultyThemes: Record<string, { border: string; background: string; gradient: string; shadow: string }> = {
  easy: {
    border: 'border-emerald-400/60',
    background: 'bg-emerald-500/10',
    gradient: 'from-emerald-400/40 via-emerald-500/10 to-transparent',
    shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
  moderate: {
    border: 'border-amber-400/60',
    background: 'bg-amber-500/10',
    gradient: 'from-amber-400/40 via-amber-500/10 to-transparent',
    shadow: 'hover:shadow-[0_0_20px_rgba(217,119,6,0.25)]',
  },
  crushing: {
    border: 'border-yellow-400/60',
    background: 'bg-yellow-500/10',
    gradient: 'from-yellow-400/40 via-yellow-500/10 to-transparent',
    shadow: 'hover:shadow-[0_0_20px_rgba(202,138,4,0.25)]',
  },
  brutal: {
    border: 'border-red-400/60',
    background: 'bg-red-500/10',
    gradient: 'from-red-400/40 via-red-500/10 to-transparent',
    shadow: 'hover:shadow-[0_0_20px_rgba(248,113,113,0.25)]',
  },
  default: {
    border: 'border-brandPrimary/60',
    background: 'bg-brandPrimary/10',
    gradient: 'from-brandPrimary/40 via-brandPrimary/10 to-transparent',
    shadow: 'hover:shadow-[0_0_20px_rgba(1,102,254,0.25)]',
  },
}

export default function DashboardPage() {
  // Get user session and assignments
  const { data: session } = useSession()
  const router = useRouter()
  const { assignments, loading, deleteAssignment, refresh } = useAssignments()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [sortBy, setSortBy] = useState<"dueDate" | "title" | "difficulty">("dueDate")
  const searchParams = useSearchParams()
  const firstName = session?.user?.name?.split(" ")?.[0] ?? "there"

  // Check for course filter from URL
  useEffect(() => {
    const courseParam = searchParams.get("course")
    if (courseParam) setSelectedCourseId(courseParam)
  }, [searchParams])

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses")
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      }
    }
    fetchCourses()
  }, [])

  // Build current week (Sunday–Saturday)
  const weekDays = useMemo(() => {
    const start = new Date()
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      d.setHours(0, 0, 0, 0)
      const isToday = d.getTime() === today.getTime()
      const isPast = d.getTime() < today.getTime()
      const isFuture = d.getTime() > today.getTime()
      const count = assignments.filter(a => {
        const due = new Date(a.dueDate)
        due.setHours(0, 0, 0, 0)
        return due.getTime() === d.getTime()
      }).length
      return {
        date: d.toISOString(),
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        hasAssignment: count > 0,
        isToday,
        isPast,
        isFuture,
        count,
      }
    })
  }, [assignments])

  // Pick top 3 urgent assignments
  const priorityAssignments = useMemo(() => {
    return [...assignments]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3)
  }, [assignments])

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments

    if (selectedCourseId) {
      filtered = assignments.filter((a) => a.courseId === selectedCourseId)

      if (filtered.length === 0) {
        const selectedCourse = courses.find((c) => c.id === selectedCourseId)
        if (selectedCourse) {
          filtered = assignments.filter(
            (a) => a.course?.name === selectedCourse.name
          )
        }
      }
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "difficulty": {
          const order = { easy: 1, moderate: 2, crushing: 3, brutal: 4 }
          return (order[a.difficulty as keyof typeof order] || 0) -
            (order[b.difficulty as keyof typeof order] || 0)
        }
        default:
          return 0
      }
    })

    return sorted
  }, [assignments, selectedCourseId, sortBy, courses])

  // Handlers
  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error("Failed to update assignment status")
      await refresh()
    } catch (err) {
      console.error("Status update error:", err)
    }
  }

  const handleBulkStatusUpdate = async (ids: string[], status: string) => {
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch("/api/assignments", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error("Bulk update failed")
      await refresh()
    } catch (err) {
      console.error("Bulk update error:", err)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch("/api/assignments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error("Bulk delete failed")
      await refresh()
    } catch (err) {
      console.error("Bulk delete error:", err)
    }
  }

  return (
    <div className="container py-10 space-y-10">
      {/* Header */}
      <header className="mb-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-white/70">Check your priorities and stay ahead of the week.</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          <div className="relative w-full md:w-64">
            <input
              type="search"
              className="form-input bg-white/5 pr-10 text-sm placeholder:text-white/40"
              placeholder="Search assignments"
            />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="9" r="5" />
              <path d="m15 15-3.5-3.5" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link href="/courses" className="btn-secondary text-white visited:text-white">Manage Courses</Link>
            <Link href="/assignments/new" className="btn-secondary text-white visited:text-white">+ New Assignment</Link>
            <button
              onClick={async () => {
                try {
                  await signOut({ redirect: false })
                } finally {
                  router.replace('/auth/signin')
                }
              }}
              className="btn-secondary text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Mini Calendar Strip */}
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/10">
        <h2 className="text-xl font-bold mb-4">This Week</h2>
        <div className="grid grid-cols-7 gap-3 text-center">
          {weekDays.map((day) => {
            const stateClasses = day.isToday
              ? 'border-white/60 bg-gradient-to-b from-brandPrimary/50 via-brandPrimary/30 to-brandPrimary/10 text-white shadow-[0_6px_18px_rgba(1,102,254,0.25)]'
              : day.isPast
                ? 'border-white/5 bg-white/5 text-white/55'
                : 'border-brandPrimary/40 bg-brandPrimary/10 text-white hover:bg-brandPrimary/20 hover:border-brandPrimary'

            return (
              <div
                key={day.date}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 transition ${stateClasses}`}
              >
                <div className="text-[0.7rem] uppercase tracking-[0.2em]">{day.label}</div>
                <div className="text-xl font-semibold leading-none">{day.dayNum}</div>
                {day.count > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-brandBg">
                    {day.count}
                  </span>
                )}
                {day.isToday && (
                  <span className="absolute -bottom-2 h-1 w-6 rounded-full bg-brandPrimary/80" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Priority Assignments */}
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/10">
        <h2 className="text-xl font-bold mb-4">Priority Assignments</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {priorityAssignments.map((assignment) => {
            const diff = (assignment.difficulty || '').toLowerCase()
            const theme = difficultyThemes[diff] ?? difficultyThemes.default
            const dueDate = new Date(assignment.dueDate).toLocaleDateString()

            return (
              <div
                key={assignment.id}
                className={`relative overflow-hidden rounded-2xl border-2 p-5 transition ${theme.background} ${theme.border} ${theme.shadow}`}
              >
                <div className={`pointer-events-none absolute inset-0 -z-10 opacity-50 bg-gradient-to-br ${theme.gradient}`} aria-hidden="true" />
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                    <p className="text-sm text-white/70">{assignment.course?.name ?? 'General'}</p>
                  </div>
                  <span className={`status-badge status-${assignment.difficulty}`}>{assignment.difficulty}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                  <div className="inline-flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2v2" />
                      <path d="M14 2v2" />
                      <rect x="3" y="4" width="14" height="14" rx="2" />
                      <path d="M3 8h14" />
                    </svg>
                    <span>Due {dueDate}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">{assignment.type}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Full Assignment List */}
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-xl font-bold">Your Assignments</h2>
        </div>

        <AssignmentList
          assignments={filteredAndSortedAssignments}
          loading={loading}
          onDeleteAssignment={deleteAssignment}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkDelete={handleBulkDelete}
          onStatusUpdate={handleStatusUpdate}
        />

        {!loading && filteredAndSortedAssignments.length === 0 && (
          <div className="text-center py-10 text-white">
            No assignments yet.{" "}
            <Link href="/assignments/new" className="text-brandPrimary hover:opacity-90">
              Create your first one
            </Link>.
          </div>
        )}
      </section>
    </div>
  )
}
