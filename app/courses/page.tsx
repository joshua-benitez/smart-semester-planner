'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

// shape the course object returned by the API
type Course = {
  id: string
  name: string
  color: string
  userId: string
  createdAt: string
  updatedAt: string
  _count: { assignments: number }
  assignments: { id: string }[] // need this to block deletes when assignments exist
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseColor, setNewCourseColor] = useState('#3b82f6') // default blue keeps the UI consistent
  const [sortBy, setSortBy] = useState<'name' | 'assignments' | 'created'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // fetch courses on load so the list isn't empty
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const payload = await response.json()
          if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to fetch courses')
          setCourses(payload.data ?? [])
        } else {
          console.error('Failed to fetch courses')
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  // sort helper for the list view
  const sortedCourses = React.useMemo(() => {
    const sorted = [...courses].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        case 'assignments':
          const aCount = a._count?.assignments || 0
          const bCount = b._count?.assignments || 0
          return sortOrder === 'asc' ? aCount - bCount : bCount - aCount
        case 'created':
          return sortOrder === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    return sorted
  }, [courses, sortBy, sortOrder])

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  // handle create course from the form
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseName.trim()) {
      alert('Course name is required')
      return
    }
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName.trim(), color: newCourseColor })
      })
      if (response.ok) {
        const payload = await response.json()
        if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to create course')
        setCourses([...courses, payload.data])
        setNewCourseName('')
        setNewCourseColor('#3b82f6')
      } else {
        console.error('Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  // delete course after double checking there are no assignments tied to it
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }
    const course = courses.find(c => c.id === courseId)
    if (course && course._count.assignments > 0) {
      alert('Cannot delete course with existing assignments. Please delete assignments first.')
      return
    }
    try {
      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId })
      })
      if (response.ok) {
        const payload = await response.json()
        if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to delete course')
        setCourses(courses.filter(c => c.id !== courseId))
      } else {
        console.error('Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  return (
    <div className="page-container">
      <div className="page-content max-w-6xl">
        {/* header section */}
        <div className="header-card">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Courses</h1>
              <p className="page-description">Organize and manage your semester courses.</p>
            </div>
            <Link href="/dashboard" className="nav-link">← Back to Dashboard</Link>
          </div>
        </div>

        {/* add new course */}
        <div className="page-card mb-8">
          <h2 className="section-title">Add New Course</h2>
          <form onSubmit={handleCreateCourse} className="form-group">
            <div className="form-grid">
              <div>
                <label htmlFor="courseName" className="form-label">
                  Course Name *
                </label>
                <input
                  type="text"
                  id="courseName"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Calculus I, Computer Science 101"
                  required
                />
              </div>
              <div>
                <label htmlFor="courseColor" className="form-label">
                  Course Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="courseColor"
                    value={newCourseColor}
                    onChange={(e) => setNewCourseColor(e.target.value)}
                    className="h-12 w-16 border border-gray-300 rounded-lg cursor-pointer"
                    title="Choose course color"
                  />
                  <span className="text-sm text-gray-500">Choose a color to identify this course</span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="btn-primary">
                Create Course
              </button>
            </div>
          </form>
        </div>

        {/* course list */}
        <div className="page-card">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="section-title mb-4 md:mb-0">Your Courses</h2>
            
            {/* sorting buttons */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Sort by:</label>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleSort('name')}
                  className={`btn-sm ${sortBy === 'name' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('assignments')}
                  className={`btn-sm ${sortBy === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Assignments {sortBy === 'assignments' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('created')}
                  className={`btn-sm ${sortBy === 'created' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Created {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No courses yet. Start by adding one!</p>
              <p className="empty-description">Create your first course above to organize your assignments.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedCourses.map((course) => (
                <div key={course.id} className="content-card border border-white/10 bg-cardBg">
                  <div className="mobile-stack items-start">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white/20 shadow-sm"
                        style={{ backgroundColor: course.color }}
                        title={`Course color: ${course.color}`}
                      ></div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{course.name}</h3>
                        <p className="text-white/70">
                          {course._count?.assignments || 0} assignment{(course._count?.assignments || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/dashboard?course=${course.id}`} className="nav-link">
                        View Assignments
                      </Link>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="btn-danger"
                        title={course._count.assignments > 0 ? "Cannot delete course with assignments" : "Delete course"}
                        disabled={course._count.assignments > 0}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
      </div>
    </div>
  )
}
