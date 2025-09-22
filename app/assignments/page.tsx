'use client'

import Link from 'next/link'
import { useAssignments } from '@/hooks/useAssignments'
import { AssignmentList } from '@/components/features/assignments/AssignmentList'
import type { AssignmentStatusUpdateExtras } from '@/types/assignment'

export default function AssignmentsIndexPage() {
  const { assignments, loading, deleteAssignment, refresh } = useAssignments()

  const handleStatusUpdate = async (
    id: string,
    status: string,
    extras: AssignmentStatusUpdateExtras = {}
  ) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...extras }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await refresh()
    } catch (err) {
      console.error('Status update error:', err)
    }
  }

  const handleBulkStatusUpdate = async (ids: string[], status: string) => {
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch('/api/assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error('Bulk update failed')
      await refresh()
    } catch (err) {
      console.error('Bulk update error:', err)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch('/api/assignments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error('Bulk delete failed')
      await refresh()
    } catch (err) {
      console.error('Bulk delete error:', err)
    }
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="header-card">
          <div className="page-header">
            <div>
              <h1 className="page-title">Assignments</h1>
              <p className="page-description">Browse, update, and manage all your assignments.</p>
            </div>
            <Link href="/assignments/new" className="btn-primary">+ New Assignment</Link>
          </div>
        </div>

        <div className="page-card">
          <AssignmentList
            assignments={assignments}
            loading={loading}
            onDeleteAssignment={deleteAssignment}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkDelete={handleBulkDelete}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>
    </div>
  )
}
