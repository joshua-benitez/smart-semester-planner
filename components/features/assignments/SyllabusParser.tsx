'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { AssignmentFormData } from '@/types/assignment'

interface ParsedAssignment {
  title: string
  dueDate: string
  type: 'homework' | 'quiz' | 'project' | 'exam'
  difficulty: 'easy' | 'moderate' | 'crushing' | 'brutal'
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

  // parsing logic - handles CSC-151 multi-line format
  const parseSyllabus = (text: string): ParsedAssignment[] => {
    const assignments: ParsedAssignment[] = []
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      console.log(`Line ${i}: "${line}"`)
      
      // Skip header/info lines
      if (line.includes('Due Date Calendar') || line.includes('Assignment Opens') || line.includes('Alert:')) {
        console.log('  -> Skipping header line')
        continue
      }
      
      // Pattern 1: Single line with assignment and date
      const singleLinePattern = /(Homework|Quiz|Project|Exam).+(\d{1,2}\/\d{1,2}\/\d{2})/i
      const singleMatch = singleLinePattern.exec(line)
      if (singleMatch) {
        const [, type, date] = singleMatch
        assignments.push({
          title: line,
          dueDate: convertToISO(date),
          type: type.toLowerCase() as ParsedAssignment['type'],
          difficulty: type.toLowerCase() === 'exam' ? 'crushing' : 'moderate'
        })
        continue
      }
      
      // Pattern 2: CSC-151 format - assignment name on one line, dates on following lines  
      if (line.includes('Quiz') || line.includes('Project') || line.includes('Exam') || line.includes('Chapter') || line.includes('hapter')) {
        console.log('  -> Found potential assignment line')
        // Determine assignment type
        let type: ParsedAssignment['type'] = 'homework'
        if (line.toLowerCase().includes('quiz')) type = 'quiz'
        if (line.toLowerCase().includes('project')) type = 'project'  
        if (line.toLowerCase().includes('exam')) type = 'exam'
        
        // Look ahead for date lines (but don't skip other assignments)
        let j = i + 1
        let dates: string[] = []
        
        // Collect all dates within the next few lines
        while (j < lines.length && j < i + 5) {
          const nextLine = lines[j]
          const datePattern = /\d{1,2}\/\d{1,2}\/\d{2}/g
          let dateMatch
          
          while ((dateMatch = datePattern.exec(nextLine)) !== null) {
            dates.push(dateMatch[0])
          }
          
          // Stop if we hit another assignment line (but don't consume it)
          if (j > i + 1 && (nextLine.includes('Quiz') || nextLine.includes('Project') || nextLine.includes('Exam') || nextLine.includes('Chapter'))) {
            break
          }
          
          j++
        }
        
        if (dates.length > 0) {
          // Use the last date as the due date (usually the pattern is: open date, due date)
          const dueDate = dates[dates.length - 1]
          
          const newAssignment = {
            title: line,
            dueDate: convertToISO(dueDate),
            type,
            difficulty: (type === 'exam' ? 'crushing' : 'moderate') as ParsedAssignment['difficulty']
          }
          
          console.log('Adding assignment:', newAssignment)
          assignments.push(newAssignment)
        }
      }
    }
    
    // Remove duplicates based on title AND due date combination
    const uniqueAssignments = assignments.filter((assignment, index) => 
      assignments.findIndex(a => a.title === assignment.title && a.dueDate === assignment.dueDate) === index
    )
    
    return uniqueAssignments
  }


  // Helper to convert MM/DD/YY to ISO format
  const convertToISO = (dateStr: string): string => {
    const [month, day, year] = dateStr.split('/')
    const fullYear = `20${year}` // Assumes 20xx
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59` // 11:59 PM default
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
      weight: 1
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
                  <h3 className="font-medium text-blue-900 mb-2">Tips for best results:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Include assignment names and due dates</li>
                    <li>• Make sure dates are in MM/DD/YY format</li>
                    <li>• Include assignment types (Quiz, Project, Exam, etc.)</li>
                    <li>• The parser will try to be smart about what's an assignment vs. just text</li>
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
                    {parsedAssignments.map((assignment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
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
                            <label className="text-sm font-medium text-gray-700">Due Date</label>
                            <input
                              type="datetime-local"
                              value={assignment.dueDate}
                              onChange={(e) => handleEdit(index, 'dueDate', e.target.value)}
                              className="form-input mt-1"
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