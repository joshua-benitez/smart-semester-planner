'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useAssignments } from '@/hooks/useAssignments'
import { AssignmentList } from '@/components/features/assignments/AssignmentList'

type Course = {
  id: string
  name: string
  color?: string
}

export default function HomePage() {
  // Get user session and assignments
  const { data: session } = useSession()
  const { assignments, loading, deleteAssignment } = useAssignments()
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
      filtered = assignments.filter(assignment => assignment.courseId === selectedCourseId)
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

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header Section */}
        <div className="header-card animate-fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title animate-float">Smart Semester Planner</h1>
              <p className="page-description">Keep track of all your assignments and courses in one place.</p>
            </div>
            <div className="flex gap-3 items-center">
              {session ? (
                <>
                  <div className="text-slate-300 mr-2">
                    Welcome, {session.user?.name || session.user?.email}!
                  </div>
                  <Link href="/courses" className="nav-link">
                    Manage Courses
                  </Link>
                  <Link href="/assignments/new" className="btn-primary">
                    Add Assignment
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="btn-danger"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/auth/signin" className="btn-primary">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="nav-link">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="page-card animate-slide-up">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="section-title mb-4 md:mb-0">Your Assignments</h2>
            
            {/* Filters and Sorting */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Course Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Course:</label>
                <select 
                  value={selectedCourseId} 
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'title' | 'difficulty')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="title">Title</option>
                  <option value="difficulty">Difficulty</option>
                </select>
              </div>
            </div>
          </div>
          
          <AssignmentList 
            assignments={filteredAndSortedAssignments} 
            loading={loading} 
            onDeleteAssignment={deleteAssignment}
          />
        </div>
      </div>
    </div>
  )
}