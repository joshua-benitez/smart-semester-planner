'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { validateAssignment } from '@/lib/validations'
import type { AssignmentFormData, AssignmentType, DifficultyLevel } from '@/types/assignment'

type Course = {
  id: string
  name: string
  color?: string
}

interface AssignmentFormProps {
  initialData?: Partial<AssignmentFormData>
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel: () => void
  submitText?: string
}

export const AssignmentForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  submitText = 'Create Assignment' 
}: AssignmentFormProps) => {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  // Helper to default due date to today at 23:59 local
  const defaultDueLocal = () => {
    const d = new Date()
    d.setHours(23, 59, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [formData, setFormData] = useState<AssignmentFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    dueDate: initialData.dueDate || defaultDueLocal(),
    type: initialData.type || 'homework',
    difficulty: initialData.difficulty || 'moderate',
    courseName: initialData.courseName || '',
    // Weight now represents category weight as percentage 0-100
    weight: initialData.weight !== undefined ? initialData.weight : 20,
    submissionNote: initialData.submissionNote || '',
  })
  const [isCreatingNewCourse, setIsCreatingNewCourse] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateAssignment(formData)
    if (validationError) {
      alert(validationError)
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight' ? parseFloat(value) : value
    }))
  }

  // Fetch courses when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const handleCourseSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === '__create_new__') {
      setIsCreatingNewCourse(true)
      setFormData(prev => ({ ...prev, courseName: '' }))
    } else {
      setIsCreatingNewCourse(false)
      const selectedCourse = courses.find(c => c.id === value)
      setFormData(prev => ({ ...prev, courseName: selectedCourse?.name || value }))
    }
  }

  const handleNewCourseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewCourseName(value)
    setFormData(prev => ({ ...prev, courseName: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="form-group">
      {/* Assignment Title */}
      <div>
        <label className="form-label">Assignment Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Math homework Chapter 5"
          className="form-input"
        />
      </div>

      {/* Course Selection */}
      <div>
        <label className="form-label">Course</label>
        {coursesLoading ? (
          <div className="form-input bg-gray-50">Loading courses...</div>
        ) : (
          <>
            <select 
              value={isCreatingNewCourse ? '__create_new__' : (courses.find(c => c.name === formData.courseName)?.id || '__create_new__')}
              onChange={handleCourseSelectionChange}
              className="form-input"
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
              <option value="__create_new__">+ Create new course</option>
            </select>
            
            {isCreatingNewCourse && (
              <div className="mt-2">
                <input
                  type="text"
                  value={newCourseName}
                  onChange={handleNewCourseNameChange}
                  placeholder="Enter new course name"
                  className="form-input"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">This will create a new course</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="form-label">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Any additional details about this assignment..."
          className="form-input"
        />
      </div>

      {/* Submission Note */}
      <div>
        <label className="form-label">Submission Note (optional)</label>
        <textarea
          name="submissionNote"
          value={formData.submissionNote ?? ''}
          onChange={handleChange}
          rows={3}
          placeholder="Where did you submit it? Add quick context for future you."
          className="form-input"
        />
        <p className="text-sm text-gray-500 mt-1">Notes boost early bonuses when you complete work ahead of the deadline.</p>
      </div>

      {/* Due Date and Type */}
      <div className="form-grid">
        <div>
          <label className="form-label">Due Date</label>
          <input
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="form-input"
          />
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn-sm btn-secondary" onClick={() => setFormData(prev => ({...prev, dueDate: defaultDueLocal()}))}>
              Today 11:59 PM
            </button>
            <button type="button" className="btn-sm btn-secondary" onClick={() => {
              const d = new Date()
              d.setDate(d.getDate()+1)
              d.setHours(23,59,0,0)
              const pad=(n:number)=>String(n).padStart(2,'0')
              const v = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
              setFormData(prev=>({...prev, dueDate: v}))
            }}>
              Tomorrow 11:59 PM
            </button>
          </div>
        </div>

        <div>
          <label className="form-label">Assignment Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="form-input">
            <option value="homework">Homework</option>
            <option value="quiz">Quiz</option>
            <option value="project">Project</option>
            <option value="exam">Exam</option>
          </select>
        </div>
      </div>

      {/* Difficulty and Weight */}
      <div className="form-grid">
        <div>
          <label className="form-label">Difficulty Level</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="form-input">
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="crushing">Crushing</option>
            <option value="brutal">Brutal</option>
          </select>
        </div>

        <div>
          <label className="form-label">Category Weight (%)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            className="form-input"
          />
          <p className="text-sm text-gray-500 mt-1">Percentage weight of this category in your course grade (0–100%)</p>
        </div>
      </div>

      {/* Submit and Cancel */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex gap-4">
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            className="flex-1"
          >
            {submitText}
          </Button>
          <Button 
            type="button" 
            onClick={onCancel}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}

export default AssignmentForm
