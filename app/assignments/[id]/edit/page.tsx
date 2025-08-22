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
        type: '',
        difficulty: '',
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

    // TODO 3: Add another useEffect to populate form when data loads
    // When data changes from null to actual assignment data,
    // you need to setFormData with the fetched assignment values
    // This runs AFTER the fetch completes and data is set


    // TODO 4: Add handleChange function
    // Copy the handleChange function from your create assignment form
    // It handles updating formData when user types in form fields

    // TODO 5: Add handleSubmit function  
    // Similar to create form but:
    // - Use PUT method instead of POST
    // - Send assignment ID in the request body
    // - Navigate back to dashboard on success

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Edit Assignment</h1>

            {loading && <p className="text-gray-500">Loading assignment...</p>}
            {error && <p className="text-red-500">Error: {typeof error === 'string' ? error : error.toString()}</p>}

            {/* TODO 6: Add the form JSX when data is loaded and not loading */}
            {/* Copy the form structure from your create assignment page */}
            {/* Make sure form fields are pre-populated with data values */}
            {/* Example: value={formData.title} will show the existing title */}

            {data && !loading && (
                <div>
                    <p className="text-green-600 mb-4">Assignment loaded: {data.title}</p>
                    {/* Your form goes here - copy from /assignments/new/page.tsx */}
                    {/* Remember to use onSubmit={handleSubmit} */}
                </div>
            )}
        </div>
    )
}