'use client'

import React from 'react'

type Props = {
  current: number
  best: number
  onCheckIn: () => Promise<void>
  onUndo: () => Promise<void>
}

export function StreakHeader({ current, best, onCheckIn, onUndo }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Streaks</h1>
        <p className="text-white/80">Current: {current} • Best: {best}</p>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={onCheckIn}>Check in today</button>
        <button className="btn-secondary" onClick={onUndo}>Undo</button>
      </div>
    </div>
  )
}

export default StreakHeader

