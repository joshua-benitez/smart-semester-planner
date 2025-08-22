'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// I need a type for my form data to keep TypeScript happy
type FormState = {
  title: string
  description: string 
  dueDate: string
  type: string
  difficulty: string
  courseName: string
  weight: number
}

export default function NewAssignment() {
  const router = useRouter()

  // State for loading status and form data
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    dueDate: '',
    type: 'homework',
    difficulty: 'moderate',
    courseName: '',
    weight: 1
  })

  // I need to validate the form before submitting
  const validate = (): string | null => {
    if (!formData.title.trim()) return 'Title is required'
    if (!formData.courseName.trim()) return 'Course name is required'
    if (!formData.dueDate) return 'Due date is required'
    const d = new Date(formData.dueDate)
    if (isNaN(d.getTime())) return 'Due date is invalid'
    return null
  }

  // Handle form submission with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if the form is valid before sending
    const err = validate()
    if (err) {
      alert(err)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        // Try to get the error message from the response
        const body = await res.json().catch(() => ({}))
        console.error('Create failed:', body)
        alert(body?.error || 'Failed to create assignment')
        setLoading(false)
        return
      }

      // Success! Go back to the dashboard
      router.push('/')
    } catch (error) {
      console.error('Network error:', error)
      alert('Network error creating assignment')
    } finally {
      setLoading(false)
    }
  }

  // Update form data when user types in any field
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      // Convert weight to number, keep everything else as string
      [name]: name === 'weight' ? parseFloat(value) : value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Assignment</h1>
      <p className="text-gray-600 mb-8">Fill out the form below to add a new assignment to your semester planner.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Title Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Math homework Chapter 5"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Course Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
          <input
            type="text"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            required
            placeholder="e.g., Calculus I"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Additional details..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Due Date and Assignment Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 border rounded-lg">
              <option value="homework">Homework</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
              <option value="exam">Exam</option>
            </select>
          </div>
        </div>

        {/* Difficulty and Weight Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full p-3 border rounded-lg">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="crushing">Crushing</option>
              <option value="brutal">Brutal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              min="0.1"
              max="5"
              step="0.1"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">How important this assignment is (0.1 - 5.0)</p>
          </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Assignment...' : 'Create Assignment'}
          </button>

          <button type="button" onClick={() => router.push('/')} className="px-6 py-3 border rounded-lg">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}