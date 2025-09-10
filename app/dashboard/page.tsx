'use client'

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useAssignments } from "@/hooks/useAssignments"
import { AssignmentList } from "@/components/features/assignments/AssignmentList"

type Course = {
  id: string
  name: string
  color?: string
}

export default function DashboardPage() {
  // Get user session and assignments
  const { data: session } = useSession()
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
  }, [assignments, selectedCourseId, sortBy])

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
      {/* Top actions */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Welcome back{session?.user?.name}</h1>
        <div className="flex gap-3">
          <Link href="/courses" className="btn-secondary">Manage Courses</Link>
          <Link href="/assignments/new" className="btn-primary">+ New Assignment</Link>
          <button
            onClick={() => signOut()}
            className="px-6 py-3 rounded-full font-semibold border border-white/15 text-white/80 hover:text-white hover:bg-white/5 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Assignments card */}
      <section className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-xl font-bold">Your Assignments</h2>
          {/* filters here */}
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
          <div className="text-center py-10 text-white/70">
            No assignments yet.{" "}
            <Link href="/assignments/new" className="text-[#0166FE] hover:opacity-90">
              Create your first one
            </Link>.
          </div>
        )}
      </section>
    </div>

  )
}
