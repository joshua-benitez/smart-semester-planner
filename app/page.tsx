'use client'

import React from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useAssignments } from '@/hooks/useAssignments'
import { AssignmentList } from '@/components/features/assignments/AssignmentList'

export default function HomePage() {
  // Get user session and assignments
  const { data: session } = useSession()
  const { assignments, loading, deleteAssignment } = useAssignments()

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header Section */}
        <div className="header-card animate-fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title animate-float">Smart Semester Planner</h1>
              <p className="page-description">Keep track of all your assignments and courses in one place.</p>
            </div>
            <div className="flex gap-3 items-center">
              {session ? (
                <>
                  <div className="text-slate-300 mr-2">
                    Welcome, {session.user?.name || session.user?.email}!
                  </div>
                  <Link href="/courses" className="nav-link">
                    Manage Courses
                  </Link>
                  <Link href="/assignments/new" className="btn-primary">
                    Add Assignment
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="btn-danger"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/auth/signin" className="btn-primary">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="nav-link">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="page-card animate-slide-up">
          <h2 className="section-title">Your Assignments</h2>
          <AssignmentList 
            assignments={assignments} 
            loading={loading} 
            onDeleteAssignment={deleteAssignment}
          />
        </div>
      </div>
    </div>
  )
}