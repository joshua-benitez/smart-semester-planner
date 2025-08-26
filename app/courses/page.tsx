'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

// Add type for Course
type Course = {
  id: string
  name: string
  color: string
  userId: string
  createdAt: string
  updatedAt: string
  _count: { assignments: number }
  assignments: { id: string }[] // Include assignments array
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]) // Add state for courses list
  const [loading, setLoading] = useState(true) // Add state for loading status
  const [newCourseName, setNewCourseName] = useState('') // Add state for form data (new course name and color)
  const [newCourseColor, setNewCourseColor] = useState('#3b82f6') // Default to blue
  const [sortBy, setSortBy] = useState<'name' | 'assignments' | 'created'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Add useEffect to fetch courses when page loads
  useEffect(() => {
    // Create async function to fetch courses from /api/courses
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        } else {
          console.error('Failed to fetch courses')
        }
      }
      // Set courses state with response data
      catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false) // Set loading to false after fetch completes
      }
    }
    fetchCourses()
  }, [])

  // Sort courses based on selected criteria
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

  // Add function to handle creating new course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent default form submission
    // Validate course name is not empty
    if (!newCourseName.trim()) {
      alert('Course name is required')
      return
    }
    // Send POST request to /api/courses with name and color
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName.trim(), color: newCourseColor })
      })
      if (response.ok) {
        const createdCourse = await response.json()
        setCourses([...courses, createdCourse]) // Add new course to courses state
        setNewCourseName('') // Clear form
        setNewCourseColor('#3b82f6') // Reset to default color
      } else {
        console.error('Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  // Add function to handle deleting a course
  const handleDeleteCourse = async (courseId: string) => {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }
    // Validate course has no assignments before deleting
    const course = courses.find(c => c.id === courseId)
    if (course && course._count.assignments > 0) {
      alert('Cannot delete course with existing assignments. Please delete assignments first.')
      return
    }
    // Send DELETE request to /api/courses with course ID
    try {
      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId })
      })
      if (response.ok) {
        setCourses(courses.filter(c => c.id !== courseId)) // Remove deleted course from courses state
      } else {
        console.error('Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

    return (
    <div className="page-container">
      <div className="page-content">
        {/* Header Section */}
        <div className="header-card">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Courses</h1>
              <p className="page-description">Organize and manage your semester courses.</p>
            </div>
            <Link href="/" className="nav-link">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Add New Course Section */}
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

        {/* Your Courses Section */}
        <div className="page-card">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="section-title mb-4 md:mb-0">Your Courses</h2>
            
            {/* Sorting Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleSort('name')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'name' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('assignments')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'assignments' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Assignments {sortBy === 'assignments' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('created')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    sortBy === 'created' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
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
            <div className="space-y-4">
              {sortedCourses.map((course) => (
                <div key={course.id} className="content-card">
                  <div className="mobile-stack">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ backgroundColor: course.color }}
                        title={`Course color: ${course.color}`}
                      ></div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-gray-600">
                          {course._count?.assignments || 0} assignment{(course._count?.assignments || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/?course=${course.id}`} className="nav-link">
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