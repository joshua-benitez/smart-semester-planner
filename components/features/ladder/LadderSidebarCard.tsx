'use client'

import React from 'react'
import type { LadderSummary } from '@/types/ladder'

interface LadderSidebarCardProps {
  data?: LadderSummary
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export function LadderSidebarCard({ data, loading, error, onRefresh }: LadderSidebarCardProps) {
  const hasEvents = Boolean(!loading && !error && data && data.recentEvents?.length)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Progression</h2>
        <button className="text-xs font-medium text-brandPrimary transition-colors hover:text-brandPrimaryDark" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {loading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && !error && data && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold tracking-tight text-gray-900">{data.stepLabel}</span>
              {typeof data.level === 'number' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-blue-800">
                  L{data.level}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                <span className="font-bold text-gray-900">{data.currentPoints} pts</span>
                <span>{data.nextStepLabel ? `Next: ${data.nextStepPoints} pts` : 'Top of ladder'}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brandPrimary transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%` }}
                />
              </div>
            </div>

            {hasEvents && (
              <div className="border-t border-gray-100 pt-2">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Recent Activity</p>
                <ul className="space-y-2">
                  {data.recentEvents.slice(0, 3).map((event) => (
                    <li key={event.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-900">{event.label}</span>
                        <span className="text-[0.65rem] font-medium text-gray-500">{event.relativeTime}</span>
                      </div>
                      <span className={`text-xs font-bold ${event.pointsChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {event.pointsChange >= 0 ? '+' : ''}{event.pointsChange}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LadderSidebarCard
