'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { validateAssignment } from '@/lib/validations'
import type { AssignmentFormData, AssignmentType, DifficultyLevel } from '@/types/assignment'

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
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    dueDate: initialData.dueDate || '',
    type: initialData.type || 'homework',
    difficulty: initialData.difficulty || 'moderate',
    courseName: initialData.courseName || '',
    weight: initialData.weight || 1
  })

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

  return (
    <form onSubmit={handleSubmit} className="form-group">
      {/* Assignment Title */}
      <div>
        <label className="form-label">Assignment Title *</label>
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

      {/* Course Name */}
      <div>
        <label className="form-label">Course Name *</label>
        <input
          type="text"
          name="courseName"
          value={formData.courseName}
          onChange={handleChange}
          required
          placeholder="e.g., Calculus I"
          className="form-input"
        />
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

      {/* Due Date and Type */}
      <div className="form-grid">
        <div>
          <label className="form-label">Due Date *</label>
          <input
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="form-input"
          />
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
          <label className="form-label">Weight</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            min="0.1"
            max="5"
            step="0.1"
            className="form-input"
          />
          <p className="text-sm text-gray-500 mt-1">How important this assignment is (0.1 - 5.0)</p>
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