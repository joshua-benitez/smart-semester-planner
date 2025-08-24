'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Semester Planner</h1>
              <p className="text-gray-600">Keep track of all your assignments in one place.</p>
            </div>
            <Link 
              href="/assignments/new" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              Add New Assignment
            </Link>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Assignments</h2>

          {/* Show different content based on loading state and data */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No assignments yet. Start by adding one!</p>
              <Link href="/assignments/new" className="text-blue-600 hover:text-blue-800 font-medium">
                Create your first assignment →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <span className="text-blue-600 font-medium">{assignment.course?.name ?? 'No course'}</span>
                        <span className="text-gray-600">Due: {formatDate(assignment.dueDate)}</span>
                      </div>

                      {/* Only show description if it exists */}
                      {assignment.description && (
                        <p className="text-gray-700 mb-4 leading-relaxed">{assignment.description}</p>
                      )}

                      {/* Tags for assignment details */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {assignment.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          assignment.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          assignment.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          assignment.difficulty === 'crushing' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assignment.difficulty}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                          Weight: {assignment.weight}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col lg:items-end">
                      <Link 
                        href={`/assignments/${assignment.id}/edit`} 
                        className="inline-flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        className="inline-flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition font-medium"
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
                              alert('Assignment deleted successfully')
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