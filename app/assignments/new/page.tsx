'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AssignmentForm } from '@/components/features/assignments/AssignmentForm'
import { SyllabusParser } from '@/components/features/assignments/SyllabusParser'
import type { AssignmentFormData } from '@/types/assignment'

export default function NewAssignment() {
  const router = useRouter()
  const [showSyllabusParser, setShowSyllabusParser] = useState(false)
  const [batchCreating, setBatchCreating] = useState(false)

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

    router.push('/assignments')
  }

  const handleCancel = () => {
    router.push('/assignments')
  }

  const handleBatchCreate = async (assignments: AssignmentFormData[]) => {
    setBatchCreating(true)
    
    try {
      // fire off creates in parallel to keep it fast
      const promises = assignments.map(assignment => 
        fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignment)
        })
      )
      
      const results = await Promise.all(promises)
      
      // bail out if any of the calls came back unhappy
      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        throw new Error(`Failed to create ${failed.length} assignments`)
      }
      
      alert(`Successfully created ${assignments.length} assignments!`)
      setShowSyllabusParser(false)
      router.push('/assignments')
    } catch (error) {
      console.error('Batch creation error:', error)
      alert('Some assignments failed to create. Please try again.')
    } finally {
      setBatchCreating(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-content max-w-2xl">
        <div className="page-card">
          <div className="mb-8">
            <h1 className="page-title">Create New Assignment</h1>
            <p className="page-description">Fill out the form below to add a new assignment to your semester planner.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link href="/" className="nav-link">
                ← Back to Dashboard
              </Link>
              
              <button
                onClick={() => setShowSyllabusParser(true)}
                className="btn-secondary text-sm"
              >
                Parse Syllabus (Fast Add)
              </button>
            </div>
          </div>

          <AssignmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitText="Create Assignment"
          />
          
          {/* syllabus parser modal */}
          {showSyllabusParser && (
            <SyllabusParser
              onAssignmentsParsed={handleBatchCreate}
              onClose={() => setShowSyllabusParser(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
