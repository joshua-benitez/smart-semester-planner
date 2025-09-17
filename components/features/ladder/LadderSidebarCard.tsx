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
    <div className="mt-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-soft backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/60">Ladder Progress</h2>
            {!loading && !error && data && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight text-white">{data.stepLabel}</span>
                {typeof data.level === 'number' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brandPrimary/20 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-brandPrimary">
                    <span className="size-1.5 rounded-full bg-brandPrimary" aria-hidden="true" />
                    Level {data.level}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            className="text-xs font-medium text-white/60 transition hover:text-white"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>

        {loading && <div className="text-sm text-white/70">Loading ladder…</div>}
        {error && <div className="text-sm text-red-400">{error}</div>}

        {!loading && !error && data && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[0.7rem] text-white/60">
                <span className="font-medium text-white/70">{data.currentPoints} pts</span>
                <span>{data.nextStepLabel ? `${data.nextStepLabel} at ${data.nextStepPoints} pts` : 'Top of the ladder'}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brandPrimary transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/60">
              <p className="font-medium text-white/70">Recent activity</p>
              <p className="leading-snug text-white/50">Ladder events coming soon. Keep logging study sessions to unlock the next badge.</p>
            </div>

            <Link href="/profile" className="inline-flex items-center gap-2 text-xs font-semibold text-brandPrimary transition hover:text-brandPrimaryDark">
              <span>View ladder details</span>
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6h7" />
                <path d="m6 2.5 3.5 3.5L6 9.5" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default LadderSidebarCard
