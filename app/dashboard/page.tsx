'use client'

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAssignments } from "@/hooks/useAssignments"
import { AssignmentList } from "@/components/features/assignments/AssignmentList"
import Logo from "@/components/ui/Logo"

type Course = {
  id: string
  name: string
  color?: string
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
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return {
        date: d.toISOString(),
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        hasAssignment: assignments.some(a =>
          new Date(a.dueDate).toDateString() === d.toDateString()
        )
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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex items-start gap-3">
          <Logo width={24} />
          <div className="leading-tight text-white/80 text-sm">
            <div>Own your education.</div>
            <div><span className="font-medium">Find your Flow.</span></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/courses" className="btn-secondary">Manage Courses</Link>
          <Link href="/assignments/new" className="btn-primary">+ New Assignment</Link>
          <button
            onClick={async () => {
              try {
                await signOut({ redirect: false })
              } finally {
                router.replace('/auth/signin')
              }
            }}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Mini Calendar Strip */}
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/20">
        <h2 className="text-xl font-bold mb-4">This Week</h2>
        <div className="grid grid-cols-7 gap-3 text-center">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className={`p-3 rounded-lg ${
                day.hasAssignment ? "bg-brandPrimary text-white" : "bg-brandPrimary/10 text-white"
              }`}
            >
              <div className="text-sm">{day.label}</div>
              <div className="text-lg font-bold">{day.dayNum}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Priority Assignments */}
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/20">
        <h2 className="text-xl font-bold mb-4">Priority Assignments</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {priorityAssignments.map((a) => (
            <div key={a.id} className="p-4 rounded-lg border-2 border-brandPrimary bg-brandPrimary/20">
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-white">{a.course?.name}</p>
              <p className="text-sm text-white">Due {new Date(a.dueDate).toLocaleDateString()}</p>
              <span className={`status-badge status-${a.difficulty}`}>{a.difficulty}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Full Assignment List */}
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/20">
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
