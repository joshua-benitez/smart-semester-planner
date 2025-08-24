'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'


export default function EditAssignment() {
    const params = useParams()
    const router = useRouter()
    const assignmentId = params.id as string

    // The Assignment type with all fields from API
    type Assignment = {
        id: string
        title: string
        description: string | null
        dueDate: string
        type: string
        difficulty: string
        weight: number
        course: { name: string }
    }

    type FormData = {
        title: string
        description: string
        dueDate: string
        type: string
        difficulty: string
        courseName: string
        weight: number
    }

    // State for the assignment data and loading
    const [data, setData] = useState<Assignment | null>(null) // To store the fetched data
    const [loading, setLoading] = useState(true) // To indicate loading status
    const [error, setError] = useState<Error | string | null>(null) // to store any errors
    const [submitLoading, setSubmitLoading] = useState(false) // To track form submission loading
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        dueDate: '',
        type: 'homework',
        difficulty: 'moderate',
        courseName: '',
        weight: 1
    })



    // useEffect to fetch the assignment data when the page loads
    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const response = await fetch('/api/assignments')
                const assignments = await response.json()
                const assignment = assignments.find((assignment: { id: string }) => {
                    return assignment.id === assignmentId
                })
                setData(assignment)
            } catch (error) {
                setError(error instanceof Error ? error : String(error))
            } finally {
                setLoading(false)
            }
        }

        fetchAssignment()
    }, [assignmentId])

    // useEffect to populate form when data loads
    useEffect(() => {
        if (data) {
            setFormData({
                title: data.title,
                description: data.description || '',
                dueDate: data.dueDate,
                type: data.type || 'homework',
                difficulty: data.difficulty || 'moderate',
                courseName: data.course.name,
                weight: data.weight || 1
            })

        }
    }, [data])

    const validate = (): string | null => {
        if (!formData.title.trim()) return 'Title is required'
        if (!formData.courseName.trim()) return 'Course name is required'
        if (!formData.dueDate) return 'Due date is required'
        const d = new Date(formData.dueDate)
        if (isNaN(d.getTime())) return 'Due date is invalid'
        if (formData.weight < 1) return 'Weight must be at least 1'
        return null
    }

    // Add handleSubmit function  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitLoading(true)
        try {
            const res = await fetch('/api/assignments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: assignmentId, ...formData })
            })
            if (!res.ok) {
                // Try to get the error message from the response
                const body = await res.json().catch(() => ({}))
                console.error('Update failed:', body)
                alert(body?.error || 'Failed to update assignment')
                setSubmitLoading(false)
                return
            }
            // Success! Go back to the dashboard
            router.push('/')
        } catch (error) {
            console.error('Network error:', error)
            alert('Network error updating assignment')
        } finally {
            setSubmitLoading(false)
        }
    }

    // handleChange function to update form data
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'weight' ? Number(value) : value // Convert weight to number
        }))
    }

    function renderForm(formData: FormData) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-2xl mx-auto px-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Assignment</h1>
                            <p className="text-gray-600">Update the details for your assignment below.</p>
                        </div>

                        {loading && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Loading assignment...</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                                <p className="text-red-700">Error: {typeof error === 'string' ? error : error.toString()}</p>
                            </div>
                        )}
                        
                        {!data && !loading && !error && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Assignment not found.</p>
                            </div>
                        )}
                        
                        {data && !loading && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Math homework Chapter 5"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
                            <input
                                type="text"
                                name="courseName"
                                value={formData.courseName}
                                onChange={handleChange}
                                placeholder="e.g., Calculus I"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Any additional details about this assignment..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                                rows={4}
                            ></textarea>
                        </div>
                        {/* Due Date and Type Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                                <input
                                    type="datetime-local"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="homework">Homework</option>
                                    <option value="project">Project</option>
                                    <option value="exam">Exam</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="reading">Reading</option>
                                </select>
                            </div>
                        </div>

                        {/* Difficulty and Weight Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                                <select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
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
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min={1}
                                    max={5}
                                    step={0.1}
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">How important this assignment is (0.1 - 5.0)</p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitLoading ? 'Updating Assignment...' : 'Update Assignment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                )}
                    </div>
                </div>
            </div>
        )
    }
    return renderForm(formData)
}
