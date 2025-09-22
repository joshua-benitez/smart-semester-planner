'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { Assignment, AssignmentStatusUpdateExtras } from '@/types/assignment'

interface AssignmentCardProps {
  assignment: Assignment
  onDelete: (id: string) => void
  index?: number
  isSelected?: boolean
  onSelect?: (id: string) => void
  onStatusUpdate?: (id: string, status: string, extras?: AssignmentStatusUpdateExtras) => void
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
    const extras: AssignmentStatusUpdateExtras = {}

    if (newStatus === 'completed') {
      const promptDefault = assignment.submissionNote ?? ''
      const userInput = window.prompt(
        'Optional submission note (where or how you submitted it):',
        promptDefault
      )

      if (userInput !== null) {
        const trimmed = userInput.trim()
        extras.submissionNote = trimmed === '' ? '' : trimmed
      }

      extras.submittedAt = new Date().toISOString()
    } else {
      extras.submittedAt = null
    }

    try {
      await onStatusUpdate(assignment.id, newStatus, extras)
    } catch (error) {
      console.error('Failed to update assignment status:', error)
    }
  }

  return (
    <Card animate delay={index * 0.1} className={`${isSelected ? 'ring-2 ring-brandPrimary' : ''} space-y-3`}>
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
            <span className="text-white/90 font-medium bg-panelBg px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap">
              {assignment.course?.name ?? 'No course'}
            </span>
            <span className="text-white/80 bg-panelBg px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap">
              <span className="text-white/60 mr-1">Due:</span> {formatDate(assignment.dueDate)}
            </span>
          </div>

          {assignment.description && (
            <p className="text-slate-300 mb-4 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-600/30">
              {assignment.description}
            </p>
          )}

          {assignment.submissionNote && (
            <p className="text-brandPrimary/90 mb-4 text-sm bg-brandPrimary/10 border border-brandPrimary/30 px-3 py-2 rounded-lg">
              <span className="font-semibold">Submission note:</span> {assignment.submissionNote}
            </p>
          )}

          <div className="flex gap-2 md:gap-3 flex-wrap mb-1">
            <Badge variant="status" value={assignment.status} />
            <Badge variant="type" value={assignment.type} />
            <Badge variant="difficulty" value={assignment.difficulty} />
            <Badge variant="meta">Weight: {assignment.weight}%</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10 sm:mt-0 sm:pt-0 sm:border-0 sm:ml-auto">
          {onStatusUpdate && (
            <Button 
              variant={'secondary'}
              size="sm"
              onClick={handleStatusToggle}
            >
              {assignment.status === 'completed' ? '↻ Undo' : '✓ Complete'}
            </Button>
          )}
          <Link href={`/assignments/${assignment.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
          <button
            onClick={handleDelete}
            aria-label="Delete assignment"
            title="Delete"
            className="inline-flex items-center justify-center h-10 w-10 text-red-500 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brandBg rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <rect x="6" y="6" width="12" height="14" rx="2" />
              <path d="M10 10v8M12 10v8M14 10v8" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  )
}

export default AssignmentCard
