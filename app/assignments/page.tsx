'use client'

import Link from 'next/link'
import { useAssignments } from '@/hooks/useAssignments'
import { AssignmentList } from '@/components/features/assignments/AssignmentList'
import type { AssignmentStatusUpdateExtras } from '@/types/assignment'
import { useEffect, useMemo, useState } from 'react'

type Course = {
  id: string
  name: string
}

export default function AssignmentsIndexPage() {
  // main assignments hub: wraps the list hook with bulk helpers
  const { assignments, loading, deleteAssignment, refresh } = useAssignments()
  const [courses, setCourses] = useState<Course[]>([])
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch('/api/courses')
        if (!res.ok) throw new Error('Failed to fetch courses')
        const payload = await res.json()
        if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to fetch courses')
        setCourses(Array.isArray(payload.data) ? payload.data : [])
      } catch (err) {
        console.error('Failed to load courses for filter:', err)
      } finally {
        setFiltersLoading(false)
      }
    }
    loadCourses()
  }, [])

  const filteredAssignments = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()
    const completedStatuses = new Set(['completed', 'submitted', 'graded'])

    return assignments.filter((assignment) => {
      if (selectedCourse !== 'all') {
        const matchesCourse = assignment.courseId === selectedCourse || assignment.course?.name === selectedCourse
        if (!matchesCourse) return false
      }

      if (statusFilter === 'active' && completedStatuses.has(assignment.status)) {
        return false
      }
      if (statusFilter === 'completed' && !completedStatuses.has(assignment.status)) {
        return false
      }

      if (!search) return true

      const haystack = `${assignment.title} ${assignment.course?.name ?? ''} ${assignment.description ?? ''}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [assignments, searchQuery, selectedCourse, statusFilter])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCourse('all')
    setStatusFilter('all')
  }

  const handleStatusUpdate = async (
    id: string,
    status: string,
    extras: AssignmentStatusUpdateExtras = {}
  ) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...extras }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await refresh()
    } catch (err) {
      console.error('Status update error:', err)
    }
  }

  const handleBulkStatusUpdate = async (ids: string[], status: string) => {
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch('/api/assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error('Bulk update failed')
      await refresh()
    } catch (err) {
      console.error('Bulk update error:', err)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch('/api/assignments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error('Bulk delete failed')
      await refresh()
    } catch (err) {
      console.error('Bulk delete error:', err)
    }
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="header-card">
          <div className="page-header">
            <div>
              <h1 className="page-title">Assignments</h1>
              <p className="page-description">Browse, update, and manage all your assignments.</p>
            </div>
            <Link href="/assignments/new" className="btn-primary">+ New Assignment</Link>
          </div>
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <label className="w-full md:w-64">
                <span className="sr-only">Search assignments</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or course"
                  className="form-input"
                />
              </label>

              <label className="w-full md:w-60">
                <span className="sr-only">Filter by course</span>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="form-input"
                  disabled={filtersLoading}
                >
                  <option value="all">All courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="w-full md:w-48">
                <span className="sr-only">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="form-input"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>

            {(searchQuery || selectedCourse !== 'all' || statusFilter !== 'all') && (
              <button className="btn-secondary w-full md:w-auto" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="page-card">
          <AssignmentList
            assignments={filteredAssignments}
            loading={loading}
            onDeleteAssignment={deleteAssignment}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkDelete={handleBulkDelete}
            onStatusUpdate={handleStatusUpdate}
            emptyState={
              (searchQuery || selectedCourse !== 'all' || statusFilter !== 'all') ? (
                <div className="empty-state">
                  <p className="empty-title">No assignments match your filters yet.</p>
                  <p className="empty-description">Try adjusting your search, course, or status filters.</p>
                  <button className="btn-secondary mt-4" onClick={resetFilters}>Clear filters</button>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
