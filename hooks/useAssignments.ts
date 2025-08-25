'use client'

import { useState, useEffect } from 'react'
import type { Assignment } from '@/types/assignment'

/**
 * Custom hook to manage assignments data and operations
 */
export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch assignments from API
  const fetchAssignments = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/assignments', { signal })
      if (!res.ok) throw new Error('Failed to fetch assignments')
      const data = await res.json()
      return Array.isArray(data) ? data as Assignment[] : []
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return [] // Request was cancelled
      }
      console.error('Failed to fetch assignments:', error)
      throw error
    }
  }

  // Delete an assignment
  const deleteAssignment = async (id: string): Promise<void> => {
    const res = await fetch('/api/assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (!res.ok) {
      throw new Error('Failed to delete assignment')
    }

    // Update local state
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  // Load assignments on mount
  useEffect(() => {
    const controller = new AbortController()
    
    fetchAssignments(controller.signal)
      .then(data => {
        setAssignments(data)
        setError(null)
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setError('Failed to load assignments')
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  // Refresh assignments
  const refresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchAssignments()
      setAssignments(data)
    } catch (error) {
      setError('Failed to refresh assignments')
    } finally {
      setLoading(false)
    }
  }

  return {
    assignments,
    loading,
    error,
    deleteAssignment,
    refresh
  }
}