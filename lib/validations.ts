// Keeping the form sanity checks in one spot so the pages stay clean
import type { AssignmentFormData } from '@/types/assignment'
import type { SignInFormData, SignUpFormData } from '@/types/auth'
import { isNonEmptyString, parseDateSafe } from './utils'

// quick sanity pass on assignment payloads before touching Prisma
export const validateAssignment = (data: AssignmentFormData): string | null => {
  if (!isNonEmptyString(data.title)) return 'Title is required'
  if (!isNonEmptyString(data.courseName)) return 'Course name is required'
  if (!data.dueDate) return 'Due date is required'
  
  const parsedDate = parseDateSafe(data.dueDate)
  if (!parsedDate) return 'Due date is invalid'
  
  // weight is a percent slider now, keep it inside 0-100 so GPA math works later
  if (data.weight < 0 || data.weight > 100) return 'Category weight must be between 0 and 100%'
  
  return null
}

// bare-bones login validation (no need to be fancy here)
export const validateSignIn = (data: SignInFormData): string | null => {
  if (!isNonEmptyString(data.email)) return 'Email is required'
  if (!isNonEmptyString(data.password)) return 'Password is required'
  
  // cheap email regex is good enough for school logins
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) return 'Please enter a valid email address'
  
  return null
}

// sign-up check: make sure we don't store trash credentials
export const validateSignUp = (data: SignUpFormData): string | null => {
  if (!isNonEmptyString(data.email)) return 'Email is required'
  if (!isNonEmptyString(data.password)) return 'Password is required'
  
  // same email guard as above
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) return 'Please enter a valid email address'
  
  if (data.password.length < 6) return 'Password must be at least 6 characters long'
  
  return null
}
