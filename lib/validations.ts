// Form validation utilities
import type { AssignmentFormData } from '@/types/assignment'
import type { SignInFormData, SignUpFormData } from '@/types/auth'
import { isNonEmptyString, parseDateSafe } from './utils'

/**
 * Validate assignment form data
 */
export const validateAssignment = (data: AssignmentFormData): string | null => {
  if (!isNonEmptyString(data.title)) return 'Title is required'
  if (!isNonEmptyString(data.courseName)) return 'Course name is required'
  if (!data.dueDate) return 'Due date is required'
  
  const parsedDate = parseDateSafe(data.dueDate)
  if (!parsedDate) return 'Due date is invalid'
  
  // Weight now represents category weight as a percentage 0-100
  if (data.weight < 0 || data.weight > 100) return 'Category weight must be between 0 and 100%'
  
  return null
}

/**
 * Validate sign-in form data
 */
export const validateSignIn = (data: SignInFormData): string | null => {
  if (!isNonEmptyString(data.email)) return 'Email is required'
  if (!isNonEmptyString(data.password)) return 'Password is required'
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) return 'Please enter a valid email address'
  
  return null
}

/**
 * Validate sign-up form data
 */
export const validateSignUp = (data: SignUpFormData): string | null => {
  if (!isNonEmptyString(data.email)) return 'Email is required'
  if (!isNonEmptyString(data.password)) return 'Password is required'
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) return 'Please enter a valid email address'
  
  if (data.password.length < 6) return 'Password must be at least 6 characters long'
  
  return null
}
