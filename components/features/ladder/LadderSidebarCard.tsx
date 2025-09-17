'use client'

import React from 'react'
import Link from 'next/link'
import type { LadderSummary } from '@/types/ladder'

interface LadderSidebarCardProps {
  data?: LadderSummary
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export function LadderSidebarCard({ data, loading, error, onRefresh }: LadderSidebarCardProps) {
  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">Ladder Progress</h2>
        <button
          className="text-xs text-white/60 hover:text-white"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>

      {loading && <div className="text-white/70 text-sm">Loading ladder…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {!loading && !error && data && (
        <div className="space-y-3">
          <div>
            <div className="text-xl font-bold">{data.stepLabel}</div>
            <div className="text-xs text-white/60">Level {data.level ?? '—'}</div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>{data.currentPoints} pts</span>
              <span>{data.nextStepLabel ? `${data.nextStepLabel} at ${data.nextStepPoints} pts` : 'Top of the ladder'}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-brandPrimary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-white/50 leading-snug">
            // code here — show recent ladder events once API returns them
          </div>

          <Link href="/profile" className="inline-flex items-center gap-1 text-xs text-brandPrimary hover:text-brandPrimaryDark">
            View details
          </Link>
        </div>
      )}
    </div>
  )
}

export default LadderSidebarCard
