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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* header section with title and description */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600 mb-6">Manage your courses and their assignments here.</p>
        <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                Course Name
              </label>
              <input
                type="text"
                id="courseName"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter course name"
                required
              />
            </div>
            <div>
              <label htmlFor="courseColor" className="block text-sm font-medium text-gray-700">
                Course Color
              </label>
              <input
                type="color"
                id="courseColor"
                value={newCourseColor}
                onChange={(e) => setNewCourseColor(e.target.value)}
                className="mt-1 h-10 w-20 border border-gray-300 rounded-md shadow-sm p-1"
                title="Choose your color"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Course
            </button>
          </form>
        </div>

    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Courses</h2>
      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">No courses found. Add a new course above.</p>
      ) : (
        <ul className="space-y-4">
          {courses.map((course) => (
            <li key={course.id} className="border border-gray-300 rounded-md p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: course.color }}
                  title={`Course color: ${course.color}`}
                ></span>
                <span className="text-lg font-medium text-gray-900">{course.name}</span>
                <span className="text-sm text-gray-500">({course._count.assignments} assignments)</span>
              </div>
              <div className="space-x-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
      </div>
    </div>
  )
}