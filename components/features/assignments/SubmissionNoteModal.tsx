'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface SubmissionNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (note: string) => void
  defaultValue?: string
  assignmentTitle: string
}

export function SubmissionNoteModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValue = '',
  assignmentTitle
}: SubmissionNoteModalProps) {
  const [note, setNote] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(note.trim())
    onClose()
  }

  const handleSkip = () => {
    onSubmit('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      title="Mark as Completed"
      headerRight={(
        <button
          onClick={onClose}
          className="text-white hover:opacity-80"
          aria-label="Close submission note modal"
        >
          ✕
        </button>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-white/90 mb-3">
            Completing: <span className="font-semibold">{assignmentTitle}</span>
          </p>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Submission Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-brandPrimary focus:outline-none"
            rows={3}
            placeholder="Where or how did you submit this?"
          />
          <p className="text-xs text-white/60 mt-1">
            Notes boost early bonuses and help track your submissions.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" className="flex-1">
            Complete Assignment
          </Button>
          <Button type="button" variant="secondary" onClick={handleSkip}>
            Skip Note
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
