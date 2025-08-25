'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AssignmentForm } from '@/components/features/assignments/AssignmentForm'
import type { AssignmentFormData } from '@/types/assignment'

export default function NewAssignment() {
  const router = useRouter()

  const handleSubmit = async (formData: AssignmentFormData) => {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || 'Failed to create assignment')
    }

    router.push('/')
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="page-container">
      <div className="page-content max-w-2xl">
        <div className="page-card">
          <div className="mb-8">
            <h1 className="page-title">Create New Assignment</h1>
            <p className="page-description">Fill out the form below to add a new assignment to your semester planner.</p>
            <Link href="/" className="nav-link mt-4 inline-flex">
              ← Back to Dashboard
            </Link>
          </div>

          <AssignmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitText="Create Assignment"
          />
        </div>
      </div>
    </div>
  )
}