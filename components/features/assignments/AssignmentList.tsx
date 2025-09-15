'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AssignmentCard } from './AssignmentCard'
import type { Assignment } from '@/types/assignment'
import { Button } from '@/components/ui/Button'

interface AssignmentListProps {
  assignments: Assignment[]
  loading: boolean
  onDeleteAssignment: (id: string) => void
  onBulkStatusUpdate?: (ids: string[], status: string) => void
  onBulkDelete?: (ids: string[]) => void
  onStatusUpdate?: (id: string, status: string) => void
}

export const AssignmentList = ({ assignments, loading, onDeleteAssignment, onBulkStatusUpdate, onBulkDelete, onStatusUpdate }: AssignmentListProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCompleted, setShowCompleted] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filter assignments based on show completed toggle
  const completedStatuses = ['completed', 'submitted', 'graded']
  const filteredAssignments = showCompleted ? assignments : assignments.filter(a => !completedStatuses.includes(a.status))

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAssignments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAssignments.map(a => a.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkAction = async (status: string) => {
    if (selectedIds.size === 0 || !onBulkStatusUpdate) return
    
    setBulkLoading(true)
    try {
      await onBulkStatusUpdate(Array.from(selectedIds), status)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Bulk update failed:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !onBulkDelete) return
    
    const count = selectedIds.size
    if (!confirm(`Are you sure you want to delete ${count} assignment${count > 1 ? 's' : ''}?`)) {
      return
    }
    
    setBulkLoading(true)
    try {
      await onBulkDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setBulkLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner animate-glow"></div>
        <p className="loading-text">Loading your assignments...</p>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Header */}
      <div className="rounded-lg p-4 border-2 border-brandPrimary bg-brandPrimary/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredAssignments.length && filteredAssignments.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-brandPrimary bg-transparent accent-brandPrimary"
              />
              <span className="text-white text-sm">
                {selectedIds.size === 0 ? 'Select all' : `${selectedIds.size} selected`}
              </span>
            </div>
            
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-sm text-white underline"
            >
              {showCompleted ? 'Hide completed' : 'Show completed'}
            </button>
          </div>

          {/* Bulk Action Buttons */}
          {selectedIds.size > 0 && onBulkStatusUpdate && (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="primary" onClick={() => handleBulkAction('completed')} disabled={bulkLoading}>
                Mark Completed
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleBulkAction('in_progress')} disabled={bulkLoading}>
                Mark In Progress
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleBulkAction('not_started')} disabled={bulkLoading}>
                Mark Not Started
              </Button>

              {/* Separator */}
              <div className="w-px h-6 bg-white/20"></div>

              {onBulkDelete && (
                <Button size="sm" variant="danger" onClick={handleBulkDelete} disabled={bulkLoading}>
                  Delete Selected
                </Button>
              )}

              {bulkLoading && <span className="text-white/80 text-sm py-1.5">Processing...</span>}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Cards */}
      {filteredAssignments.map((assignment, index) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onDelete={onDeleteAssignment}
          index={index}
          isSelected={selectedIds.has(assignment.id)}
          onSelect={handleSelectOne}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  )
}

export default AssignmentList
