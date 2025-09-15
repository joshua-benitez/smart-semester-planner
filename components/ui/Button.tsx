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

  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brandBg'
  const buttonClass = `${baseClasses[variant]} ${sizeClasses} ${focusRing} ${className}`.trim()
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
