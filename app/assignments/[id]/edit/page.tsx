'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'


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
            <div className="page-container">
                <div className="page-content max-w-2xl">
                    <div className="page-card">
                        <div className="mb-8">
                            <h1 className="page-title">Edit Assignment</h1>
                            <p className="page-description">Update the details for your assignment below.</p>
                            <Link href="/" className="nav-link mt-4 inline-flex">
                              ← Back to Dashboard
                            </Link>
                        </div>

                        {loading && (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p className="loading-text">Loading assignment...</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                                <p className="text-red-700">Error: {typeof error === 'string' ? error : error.toString()}</p>
                            </div>
                        )}
                        
                        {!data && !loading && !error && (
                            <div className="empty-state">
                                <p className="empty-title">Assignment not found.</p>
                                <p className="empty-description">The assignment you&apos;re looking for doesn&apos;t exist.</p>
                            </div>
                        )}
                        
                        {data && !loading && (
                            <form onSubmit={handleSubmit} className="form-group">
                        <div>
                            <label className="form-label">Assignment Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Math homework Chapter 5"
                                className="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Course Name *</label>
                            <input
                                type="text"
                                name="courseName"
                                value={formData.courseName}
                                onChange={handleChange}
                                placeholder="e.g., Calculus I"
                                className="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Any additional details about this assignment..."
                                className="form-input"
                                rows={4}
                            ></textarea>
                        </div>
                        {/* Due Date and Type Row */}
                        <div className="form-grid">
                            <div>
                                <label className="form-label">Due Date *</label>
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
                                <label className="form-label">Assignment Type</label>
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
                                    {/* Removed 'reading' to align with Prisma enum */}
                                </select>
                            </div>
                        </div>

                        {/* Difficulty and Weight Row */}
                        <div className="form-grid">
                            <div>
                                <label className="form-label">Difficulty Level</label>
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
                                <label className="form-label">Weight</label>
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
                                    className="btn-primary flex-1"
                                >
                                    {submitLoading ? 'Updating Assignment...' : 'Update Assignment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="btn-secondary"
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
