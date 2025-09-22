'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { AssignmentFormData } from '@/types/assignment'
import { parseSyllabus as parseWithChrono, type ParsedAssignment as RobustParsedAssignment } from '@/lib/parser'

interface ParsedAssignment {
  title: string
  dueDate: string
  type: 'homework' | 'quiz' | 'project' | 'exam'
  difficulty: 'easy' | 'moderate' | 'crushing' | 'brutal'
  confidence?: number
}

interface SyllabusParserProps {
  onAssignmentsParsed: (assignments: AssignmentFormData[]) => Promise<void>
  onClose: () => void
}

// @ts-ignore - Function props are fine for client components
type Course = {
  id: string
  name: string
  color?: string
}

export const SyllabusParser = ({ onAssignmentsParsed, onClose }: SyllabusParserProps) => {
  const [syllabusText, setSyllabusText] = useState('')
  const [courseName, setCourseName] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [parsedAssignments, setParsedAssignments] = useState<ParsedAssignment[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)

  // parsing logic - uses the robust chrono-based parser with pipeline approach
  const parseSyllabus = (text: string): ParsedAssignment[] => {
    // Use the new robust parser with options for academic year
    const parsed = parseWithChrono(text, {
      referenceDate: new Date("2025-08-15"), // start of academic year
      defaultDueTime: "23:59",
      timezone: "America/New_York",
      acceptPastDates: true,
    })
    
    // Convert to the format expected by the UI
    return parsed.map(assignment => ({
      title: assignment.title,
      dueDate: assignment.dueDate === "TBD" ? "2025-01-01T23:59" : assignment.dueDate,
      type: assignment.type,
      difficulty: assignment.difficulty,
      confidence: assignment.confidence
    }))
  }



  // Fetch courses when component mounts
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
          // Auto-select first course if available
          if (data.length > 0) {
            setCourseName(data[0].name)
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const handleParse = () => {
    if (!courseName.trim()) {
      alert('Please select a course first!')
      return
    }
    
    setLoading(true)

    try {
      const parsed = parseSyllabus(syllabusText)
      setParsedAssignments(parsed)
      setIsPreviewMode(true)
    } catch (error) {
      console.error('Parsing error:', error)
      alert('Error parsing syllabus. Check the format and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    const assignments: AssignmentFormData[] = parsedAssignments.map(parsed => ({
      ...parsed,
      courseName,
      description: '',
      weight: 1,
      submissionNote: '',
    }))

    onAssignmentsParsed(assignments)
  }

  const handleEdit = (index: number, field: keyof ParsedAssignment, value: string) => {
    const updated = [...parsedAssignments]
    updated[index] = { ...updated[index], [field]: value }
    setParsedAssignments(updated)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {!isPreviewMode ? (
            // Input Phase
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Syllabus Parser</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Select Course *</label>
                  {coursesLoading ? (
                    <div className="form-input bg-gray-50">Loading your courses...</div>
                  ) : courses.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 font-medium">No courses found!</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Please create a course first in the 
                        <a href="/courses" className="underline font-medium">Courses page</a>, 
                        then come back to parse your syllabus.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="form-input"
                        required
                      >
                        <option value="">Choose a course...</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        Assignments will be added to this course
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Paste Your Syllabus Here
                    <span className="text-sm text-gray-500 ml-2">
                      (Copy the assignments section from your syllabus)
                    </span>
                  </label>
                  <textarea
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    className="form-input min-h-[300px] font-mono text-sm"
                    placeholder="Paste your syllabus text here..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Enhanced Parser Features:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Understands natural language dates (&quot;Sun. 8/24&quot;, &quot;Sept 2&quot;, &quot;next Wed 11:59pm&quot;)</li>
                    <li>• Smart assignment detection with confidence scoring</li>
                    <li>• Handles wrapped lines and bullet points automatically</li>
                    <li>• Missing dates become &quot;TBD&quot; for you to edit later</li>
                    <li>• Automatic deduplication and type inference</li>
                    <li>• Preview shows confidence levels - review low-confidence items</li>
                  </ul>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleParse}
                    loading={loading}
                    variant="primary"
                    disabled={!syllabusText.trim()}
                  >
                    Parse Assignments
                  </Button>
                  <Button onClick={onClose} variant="secondary">
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Preview Phase
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Found {parsedAssignments.length} Assignments
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>

              {parsedAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No assignments found. Try adjusting your text format.</p>
                  <Button onClick={() => setIsPreviewMode(false)} variant="secondary">
                    Go Back and Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {parsedAssignments
                      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)) // Sort by confidence, highest first
                      .map((assignment, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${
                        (assignment.confidence || 0) < 0.5 
                          ? 'border-yellow-300 bg-yellow-50' 
                          : 'border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            (assignment.confidence || 0) >= 0.8 
                              ? 'bg-green-100 text-green-800' 
                              : (assignment.confidence || 0) >= 0.5 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(assignment.confidence || 0) >= 0.8 
                              ? 'High Confidence' 
                              : (assignment.confidence || 0) >= 0.5 
                              ? 'Medium Confidence'
                              : 'Low Confidence - Please Review'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round((assignment.confidence || 0) * 100)}% confident
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Title</label>
                            <input
                              type="text"
                              value={assignment.title}
                              onChange={(e) => handleEdit(index, 'title', e.target.value)}
                              className="form-input mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Due Date
                              {assignment.dueDate === "2025-01-01T23:59" && 
                                <span className="text-xs text-orange-600 ml-2">(TBD - Please edit)</span>
                              }
                            </label>
                            <input
                              type="datetime-local"
                              value={assignment.dueDate}
                              onChange={(e) => handleEdit(index, 'dueDate', e.target.value)}
                              className={`form-input mt-1 ${
                                assignment.dueDate === "2025-01-01T23:59" 
                                  ? 'border-orange-300 bg-orange-50' 
                                  : ''
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Type</label>
                            <select
                              value={assignment.type}
                              onChange={(e) => handleEdit(index, 'type', e.target.value)}
                              className="form-input mt-1"
                            >
                              <option value="homework">Homework</option>
                              <option value="quiz">Quiz</option>
                              <option value="project">Project</option>
                              <option value="exam">Exam</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Difficulty</label>
                            <select
                              value={assignment.difficulty}
                              onChange={(e) => handleEdit(index, 'difficulty', e.target.value)}
                              className="form-input mt-1"
                            >
                              <option value="easy">Easy</option>
                              <option value="moderate">Moderate</option>
                              <option value="crushing">Crushing</option>
                              <option value="brutal">Brutal</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={handleConfirm} variant="primary">
                      Create {parsedAssignments.length} Assignments
                    </Button>
                    <Button onClick={() => setIsPreviewMode(false)} variant="secondary">
                      Go Back and Edit
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
