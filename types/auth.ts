// Authentication-related types
export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface SignUpFormData {
  email: string
  password: string
  name?: string
}