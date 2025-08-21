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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Semester Planner</h1>

      {/* Button to add new assignments */}
      <Link href="/assignments/new" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium">
        Add New Assignment
      </Link>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Your Assignments</h2>

      {/* Show different content based on loading state and data */}
      {loading ? (
        <p className="text-gray-500">Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <p className="text-gray-500">No assignments yet. Start by adding one!</p>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h3>
              <p className="text-blue-600 font-medium mb-2">{assignment.course?.name ?? 'No course'}</p>
              <p className="text-gray-600 mb-3">Due: {formatDate(assignment.dueDate)}</p>

              {/* Only show description if it exists */}
              {assignment.description && <p className="text-gray-700 mb-3">{assignment.description}</p>}

              {/* Tags for assignment details with different colors based on difficulty */}
              <div className="flex gap-2 flex-wrap">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{assignment.type}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${assignment.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  assignment.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    assignment.difficulty === 'crushing' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {assignment.difficulty}
                </span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Weight: {assignment.weight}</span>

              </div>
              {/* Edit and Delete buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link href={`/assignments/${assignment.id}/edit`} className="text-blue-600 hover:text-blue-800 transition">
                  Edit
                </Link>
                <button
                  className="text-red-600 hover:text-red-800 transition"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this assignment?')) {
                      try {
                        const res = await fetch('/api/assignments', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: assignment.id })
                        })
                        if (!res.ok) throw new Error('Failed to delete assignment')

                        // Remove from state only if API call succeeds
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
          ))}
        </div>
      )}
    </div>
  )
}
