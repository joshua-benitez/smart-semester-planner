// Assignment-related types
export type Assignment = {
  id: string
  title: string
  description: string | null
  dueDate: string
  type: string
  difficulty: string
  weight: number
  status: string
  courseId: string
  course: { id: string; name: string; color?: string }
  submittedAt: string | null
  submissionNote: string | null
}

export type AssignmentFormData = {
  title: string
  description: string
  dueDate: string
  type: string
  difficulty: string
  courseName: string
  weight: number
  submissionNote?: string
}

export type AssignmentType = 'homework' | 'quiz' | 'project' | 'exam'
export type DifficultyLevel = 'easy' | 'moderate' | 'crushing' | 'brutal'

export type AssignmentStatusUpdateExtras = {
  submittedAt?: string | null
  submissionNote?: string | null
}
