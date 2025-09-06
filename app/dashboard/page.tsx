'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Logo from "@/components/ui/Logo"
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useAssignments } from '@/hooks/useAssignments'
import { AssignmentList } from '@/components/features/assignments/AssignmentList'

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
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'difficulty'>('dueDate')
  const searchParams = useSearchParams()

  // Check for course filter from URL
  useEffect(() => {
    const courseParam = searchParams.get('course')
    if (courseParam) {
      setSelectedCourseId(courseParam)
    }
  }, [searchParams])

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }
    fetchCourses()
  }, [])

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments

    // Filter by course if selected
    if (selectedCourseId) {
      // First try filtering by courseId
      filtered = assignments.filter(assignment => assignment.courseId === selectedCourseId)

      // If no matches, try filtering by course name (fallback)
      if (filtered.length === 0) {
        const selectedCourse = courses.find(c => c.id === selectedCourseId)
        if (selectedCourse) {
          filtered = assignments.filter(assignment => assignment.course?.name === selectedCourse.name)
        }
      }
    }

    // Sort assignments
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'difficulty':
          const difficultyOrder = { 'easy': 1, 'moderate': 2, 'crushing': 3, 'brutal': 4 }
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) -
            (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [assignments, selectedCourseId, sortBy])

  // Handle individual status update
  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (!response.ok) {
        throw new Error('Failed to update assignment status')
      }

      // Refresh assignments to get updated data
      await refresh()
    } catch (error) {
      console.error('Status update error:', error)
      throw error
    }
  }

  // Handle bulk status updates
  const handleBulkStatusUpdate = async (ids: string[], status: string) => {
    try {
      const promises = ids.map(id =>
        fetch('/api/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status })
        })
      )

      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok)

      if (failed.length > 0) {
        throw new Error(`Failed to update ${failed.length} assignments`)
      }

      // Refresh assignments to get updated data
      await refresh()
    } catch (error) {
      console.error('Bulk update error:', error)
      throw error
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    try {
      const promises = ids.map(id =>
        fetch('/api/assignments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })
      )

      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok)

      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} assignments`)
      }

      // Refresh assignments to get updated data
      await refresh()
    } catch (error) {
      console.error('Bulk delete error:', error)
      throw error
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div className="flex gap-3">
          <Link
            href="/courses"
            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 text-white font-semibold shadow-md transition"
          >
            Manage Courses
          </Link>
          <Link
            href="/assignments/new"
            className="bg-green-600 hover:bg-green-700 rounded-xl px-5 py-3 text-white font-semibold shadow-md transition"
          >
            + New Assignment
          </Link>
          <button
            onClick={() => signOut()}
            className="bg-red-600 hover:bg-red-700 rounded-xl px-5 py-3 text-white font-semibold shadow-md transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Assignments */}
      <section className="bg-[#0a0f3d] rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Your Assignments</h2>
        <AssignmentList
          assignments={filteredAndSortedAssignments}
          loading={loading}
          onDeleteAssignment={deleteAssignment}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkDelete={handleBulkDelete}
          onStatusUpdate={handleStatusUpdate}
        />
      </section>
    </div>
  )
}