import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: React.ReactNode
}

export const Button = ({ 
  variant = 'primary', 
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

  const buttonClass = `${baseClasses[variant]} ${className}`.trim()
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