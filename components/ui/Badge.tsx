'use client'

import React from 'react'
import { capitalize } from '@/lib/utils'

type BadgeVariant = 'status' | 'type' | 'difficulty' | 'meta'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  value?: string
  size?: BadgeSize
  children?: React.ReactNode
  className?: string
}

const base = 'inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium'

function classesFor(variant: BadgeVariant, value?: string): string {
  const v = (value ?? '').toLowerCase()

  if (variant === 'status') {
    if (v === 'completed') return 'bg-green-500/20 text-green-300 border-green-500/30'
    if (v === 'in_progress') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    if (v === 'submitted') return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    if (v === 'graded') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    if (v === 'missed') return 'bg-red-500/20 text-red-300 border-red-500/30'
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  if (variant === 'type') {
    // homework, quiz, project, exam
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  }

  if (variant === 'difficulty') {
    if (v === 'easy') return 'bg-green-500/20 text-green-300 border-green-500/30'
    if (v === 'moderate') return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    if (v === 'crushing') return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
    if (v === 'brutal') return 'bg-red-500/20 text-red-300 border-red-500/30'
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  // meta
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
}

export function Badge({ variant = 'meta', value, size = 'sm', children, className = '', ...rest }: BadgeProps) {
  const cls = [
    base,
    size === 'md' ? 'px-2.5 py-1.5 text-sm' : '',
    classesFor(variant, value),
    className,
  ].filter(Boolean).join(' ')

  const content = children ?? (value ? capitalize(value) : null)

  return (
    <span className={cls} {...rest}>
      {content}
    </span>
  )
}

export default Badge

