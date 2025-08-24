'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

// Add type for Course
type Course = {
  // Add id, name, color fields
  // Add assignments array with count
}

export default function CoursesPage() {
  // Add state for courses list
  // Add state for loading status
  // Add state for form data (new course name and color)
  // Add state for edit mode (which course is being edited)

  // TODO: Add useEffect to fetch courses when page loads
  useEffect(() => {
    // Create async function to fetch courses from /api/courses
    // Set courses state with response data
    // Set loading to false
  }, [])

  // TODO: Add function to handle creating new course
  const handleCreateCourse = async (e: React.FormEvent) => {
    // Prevent default form submission
    // Validate course name is not empty
    // Send POST request to /api/courses with name and color
    // If successful, refresh the courses list
    // Clear the form
  }

  // Add function to handle deleting a course
  const handleDeleteCourse = async (courseId: string) => {
    // Show confirmation dialog
    // Send DELETE request to /api/courses with course ID
    // If successful, remove from courses state
    // Handle error if course has assignments
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Add header section with title and description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          {/* Add page title "My Courses" */}
          {/* Add description about managing courses */}
          {/* Add "Back to Dashboard" link */}
        </div>

        {/* Add form section to create new course */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            {/* Add course name input field */}
            {/* Add color picker input */}
            {/* Add submit button */}
          </form>
        </div>

        {/* Add courses list section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Courses</h2>
          
          {/* Show loading state */}
          {/* Show empty state if no courses */}
          {/* Show courses grid */}
          {/* Each course card should show:
               - Course name with color indicator
               - Number of assignments
               - Edit and Delete buttons
               - Click to view assignments for that course */}
        </div>
      </div>
    </div>
  )
}