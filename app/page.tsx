'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

// I need this type to match what comes back from my API
type Assignment = {
  id: string
  title: string
  description: string | null
  dueDate: string
  type: string
  difficulty: string
  weight: number
  course: { name: string }
}

export default function HomePage() {
  // Get user session
  const { data: session, status } = useSession()
  
  // I need state to hold my assignments and track loading
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Function to fetch my assignments from the API
  async function fetchAssignments(signal?: AbortSignal) {
    try {
      const res = await fetch('/api/assignments', { signal })
      if (!res.ok) throw new Error('Network response was not ok')
      const data = await res.json()
      // Make sure I return an array even if the API returns something weird
      return Array.isArray(data) ? data as Assignment[] : []
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      return []
    }
  }

  // Load assignments when the page loads (with cleanup to avoid memory leaks)
  useEffect(() => {
    const controller = new AbortController()
    fetchAssignments(controller.signal).then((data) => {
      setAssignments(data)
      setLoading(false)
    })
    // Clean up the request if the component unmounts
    return () => controller.abort()
  }, [])

  // Helper to make dates look better
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
          <h2 className="section-title">Your Assignments</h2>

          {/* Show different content based on loading state and data */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner animate-glow"></div>
              <p className="loading-text">Loading your assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No assignments yet. Start by adding one!</p>
              <p className="empty-description">Create your first assignment or set up your courses to get organized.</p>
              <div className="flex gap-3 justify-center mt-6">
                <Link href="/courses" className="nav-link">
                  Set up Courses First
                </Link>
                <Link href="/assignments/new" className="btn-primary">
                  Create Assignment
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment, index) => (
                <div 
                  key={assignment.id} 
                  className="content-card animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mobile-stack">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-100 mb-2">{assignment.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="text-blue-400 font-semibold bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                          {assignment.course?.name ?? 'No course'}
                        </span>
                        <span className="text-slate-300 bg-slate-500/20 px-3 py-1.5 rounded-lg border border-slate-500/30">
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      </div>

                      {/* Only show description if it exists */}
                      {assignment.description && (
                        <p className="text-slate-300 mb-4 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-600/30">
                          {assignment.description}
                        </p>
                      )}

                      {/* Tags for assignment details */}
                      <div className="flex gap-3 flex-wrap">
                        <span className="status-badge" style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          {assignment.type}
                        </span>
                        <span className={`status-badge ${
                          assignment.difficulty === 'easy' ? 'status-easy' :
                          assignment.difficulty === 'moderate' ? 'status-moderate' :
                          assignment.difficulty === 'crushing' ? 'status-crushing' :
                          'status-brutal'
                        }`}>
                          {assignment.difficulty}
                        </span>
                        <span className="status-badge" style={{
                          background: 'rgba(100, 116, 139, 0.2)',
                          color: '#94a3b8',
                          border: '1px solid rgba(100, 116, 139, 0.3)'
                        }}>
                          Weight: {assignment.weight}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link 
                        href={`/assignments/${assignment.id}/edit`} 
                        className="btn-success"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn-danger"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this assignment?')) {
                            try {
                              const res = await fetch('/api/assignments', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: assignment.id })
                              })
                              if (!res.ok) throw new Error('Failed to delete assignment')

                              setAssignments(assignments.filter((a) => a.id !== assignment.id))
                              alert('Assignment deleted successfully!')
                            } catch (error) {
                              console.error('Failed to delete assignment:', error)
                              alert('Failed to delete assignment')
                            }
                          }
                        }}
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