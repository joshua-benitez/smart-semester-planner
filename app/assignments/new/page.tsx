'use client'

// I need to import useState for form data and useRouter to redirect after submission
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAssignment() {
  // I'll use useRouter to redirect back to dashboard after creating assignment
  const router = useRouter()

  // I need state for loading and form data
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'homework',
    difficulty: 'moderate',
    courseName: '',
    weight: 1
  })

  // This function will handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // I'll send POST request to my API
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/')
      } else {
        alert('Error creating assignment')
      }
    } catch (error) {
      alert('Error creating assignment')
    }

    setLoading(false)
  }

  // This function updates my form data when user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weight' ? parseFloat(value) : value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Assignment</h1>
      <p className="mb-4">Create a new assignment to keep track of your coursework.</p>
      <p className="mb-4">Assignments are used to calculate your rank and RP (Relative Performance).</p>
      <p className="mb-4">You can also set the difficulty and weight of the assignment to adjust its impact on your overall performance.</p>

      <p> Please fill out the form below to create a new assignment.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Course Name</label>
          <input
            type="text"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Due Date</label>
          <input
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="homework">Homework</option>
            <option value="quiz">Quiz</option>
            <option value="project">Project</option>
            <option value="exam">Exam</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Difficulty</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="crushing">Crushing</option>
            <option value="brutal">Brutal</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2">Weight</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            min="0.1"
            step="0.1"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 bg-blue-600 text-white rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Creating...' : 'Create Assignment'}
        </button>
      </form>
    </div>
  )
}