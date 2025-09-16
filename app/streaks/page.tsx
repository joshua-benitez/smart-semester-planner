'use client'

import React from 'react'
import { useStreaks } from '@/hooks/useStreaks'
import StreakHeatmap from '@/components/features/streaks/StreakHeatmap'
import StreakHeader from '@/components/features/streaks/StreakHeader'

export default function StreaksPage() {
  const { data, loading, error, checkIn, undo } = useStreaks()

  return (
    <div className="container py-10 space-y-8">
      <StreakHeader
        current={data?.currentStreak ?? 0}
        best={data?.bestStreak ?? 0}
        onCheckIn={checkIn}
        onUndo={undo}
      />

      <div className="card">
        {loading ? (
          <div className="text-white/80">Loading streaks…</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <StreakHeatmap days={data?.days ?? []} weeks={12} />
        )}
      </div>

      <div className="page-card">
        <h2 className="text-xl font-bold mb-2">Ideas for tomorrow</h2>
        <ul className="list-disc pl-5 space-y-1 text-white/90">
          <li>Streak freeze (use 1 token to preserve streak if you miss a day).</li>
          <li>Multipliers for consecutive weeks (boost RP/score after 7/14/30 days).</li>
          <li>Weekly goal (e.g., 5 check‑ins) with progress ring and confetti on complete.</li>
          <li>Streak badges (7/30/100 days) and a "close to next badge" nudger.</li>
          <li>Optional public share card (image) to post wins.</li>
        </ul>
      </div>
    </div>
  )
}

