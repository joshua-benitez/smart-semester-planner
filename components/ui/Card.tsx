import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export const Card = ({ children, className = '', animate = false, delay = 0 }: CardProps) => {
  const baseClasses = "content-card"
  const animationClasses = animate ? "animate-fade-in" : ""
  const combinedClasses = `${baseClasses} ${animationClasses} ${className}`.trim()
  
  const style = animate && delay > 0 ? { animationDelay: `${delay}s` } : undefined

  return (
    <div className={combinedClasses} style={style}>
      {children}
    </div>
  )
}

export default Card