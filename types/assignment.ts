// Assignment-related types
export type Assignment = {
  id: string
  title: string
  description: string | null
  dueDate: string
  type: string
  difficulty: string
  weight: number
  course: { name: string }
}

export type AssignmentFormData = {
  title: string
  description: string
  dueDate: string
  type: string
  difficulty: string
  courseName: string
  weight: number
}

export type AssignmentType = 'homework' | 'quiz' | 'project' | 'exam'
export type DifficultyLevel = 'easy' | 'moderate' | 'crushing' | 'brutal'