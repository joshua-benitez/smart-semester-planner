'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Assignment } from '@/types/assignment'

interface AssignmentCardProps {
  assignment: Assignment
  onDelete: (id: string) => void
  index?: number
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export const AssignmentCard = ({ assignment, onDelete, index = 0, isSelected = false, onSelect }: AssignmentCardProps) => {
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await onDelete(assignment.id)
      } catch (error) {
        console.error('Failed to delete assignment:', error)
      }
    }
  }

  return (
    <Card animate delay={index * 0.1} className={isSelected ? 'ring-2 ring-blue-500' : ''}>
      <div className="mobile-stack">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="flex items-start pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(assignment.id)}
              className="w-4 h-4 rounded border-slate-400 bg-slate-700 text-blue-500"
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-100 mb-2">
            {assignment.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <span className="text-blue-400 font-semibold bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
              {assignment.course?.name ?? 'No course'}
            </span>
            <span className="text-slate-300 bg-slate-500/20 px-3 py-1.5 rounded-lg border border-slate-500/30">
              Due: {formatDate(assignment.dueDate)}
            </span>
          </div>

          {assignment.description && (
            <p className="text-slate-300 mb-4 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-600/30">
              {assignment.description}
            </p>
          )}

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

        <div className="flex gap-2">
          <Link 
            href={`/assignments/${assignment.id}/edit`}
          >
            <Button variant="success">Edit</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default AssignmentCard