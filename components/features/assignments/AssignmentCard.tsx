'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { Assignment } from '@/types/assignment'

interface AssignmentCardProps {
  assignment: Assignment
  onDelete: (id: string) => void
  index?: number
  isSelected?: boolean
  onSelect?: (id: string) => void
  onStatusUpdate?: (id: string, status: string) => void
}

export const AssignmentCard = ({ assignment, onDelete, index = 0, isSelected = false, onSelect, onStatusUpdate }: AssignmentCardProps) => {
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await onDelete(assignment.id)
      } catch (error) {
        console.error('Failed to delete assignment:', error)
      }
    }
  }

  const handleStatusToggle = async () => {
    if (!onStatusUpdate) return
    
    const newStatus = assignment.status === 'completed' ? 'not_started' : 'completed'
    try {
      await onStatusUpdate(assignment.id, newStatus)
    } catch (error) {
      console.error('Failed to update assignment status:', error)
    }
  }

  return (
    <Card animate delay={index * 0.1} className={`${isSelected ? 'ring-2 ring-blue-500' : ''} space-y-3`}>
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
          <h3 className="text-xl font-bold text-slate-100 mb-3">
            {assignment.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-blue-400 font-semibold bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30 whitespace-nowrap">
              {assignment.course?.name ?? 'No course'}
            </span>
            <span className="text-slate-300 bg-slate-500/20 px-3 py-1.5 rounded-lg border border-slate-500/30 whitespace-nowrap">
              <span className="text-slate-400 mr-1">Due:</span> {formatDate(assignment.dueDate)}
            </span>
          </div>

          {assignment.description && (
            <p className="text-slate-300 mb-4 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-600/30">
              {assignment.description}
            </p>
          )}

          <div className="flex gap-2 md:gap-3 flex-wrap">
            <Badge variant="status" value={assignment.status} />
            <Badge variant="type" value={assignment.type} />
            <Badge variant="difficulty" value={assignment.difficulty} />
            <Badge variant="meta">Weight: {assignment.weight}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {onStatusUpdate && (
            <Button 
              variant={assignment.status === 'completed' ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleStatusToggle}
            >
              {assignment.status === 'completed' ? '↻ Undo' : '✓ Complete'}
            </Button>
          )}
          <Link 
            href={`/assignments/${assignment.id}/edit`}
          >
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default AssignmentCard
