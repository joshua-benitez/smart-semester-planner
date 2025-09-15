'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Assignment } from '@/types/assignment'

/**
 * Custom hook to manage assignments data and operations using React Query
 */
export const useAssignments = () => {
  const queryClient = useQueryClient()

  const assignmentsQuery = useQuery<Assignment[], Error>({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await fetch('/api/assignments')
      if (!res.ok) throw new Error('Failed to fetch assignments')
      const data = await res.json()
      return Array.isArray(data) ? (data as Assignment[]) : []
    },
    staleTime: 60_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error('Failed to delete assignment')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['assignments'] })
  }

  return {
    assignments: assignmentsQuery.data ?? [],
    loading: assignmentsQuery.isLoading,
    error: assignmentsQuery.isError ? 'Failed to load assignments' : null,
    deleteAssignment: (id: string) => deleteMutation.mutateAsync(id),
    refresh,
  }
}
