'use client'

import React from 'react'
import Link from 'next/link'
import { AssignmentCard } from './AssignmentCard'
import type { Assignment } from '@/types/assignment'

interface AssignmentListProps {
  assignments: Assignment[]
  loading: boolean
  onDeleteAssignment: (id: string) => void
}

export const AssignmentList = ({ assignments, loading, onDeleteAssignment }: AssignmentListProps) => {
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
      {assignments.map((assignment, index) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onDelete={onDeleteAssignment}
          index={index}
        />
      ))}
    </div>
  )
}

export default AssignmentList