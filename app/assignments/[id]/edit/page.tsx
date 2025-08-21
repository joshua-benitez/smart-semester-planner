'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'



export default function EditAssignment() {
    const params = useParams()
    const router = useRouter()
    const assignmentId = params.id as string

    // State for the assignment data and loading
    const [data, setData] = useState(null) // To store the fetched data
    const [loading, setloading] = useState(true) // To indicate loading status
    const [error, setError] = useState<Error | string | null>(null) // to store any errors

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
                setloading(false)
            }
        }
        
        fetchAssignment()
    }, [assignmentId])




        return (
            <div>
                <h1>Assignment ID: {assignmentId}</h1>
            </div>
        );

    }



