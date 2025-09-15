import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md',
  loading = false, 
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) => {
  const baseClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    danger: 'btn-danger',
    success: 'btn-success'
  }

  const sizeClasses = size === 'sm' ? 'btn-sm' : ''

  const buttonClass = `${baseClasses[variant]} ${sizeClasses} ${className}`.trim()
  const isDisabled = disabled || loading

  return (
    <button 
      className={buttonClass}
      disabled={isDisabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

export default Button
