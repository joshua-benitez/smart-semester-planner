'use client'

import React from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  children: React.ReactNode
  headerRight?: React.ReactNode
}

export const Modal = ({ isOpen, title, children, headerRight }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="rounded-lg p-6 w-full max-w-md mx-4 border-2 border-brandPrimary bg-brandBg text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {headerRight ?? null}
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
