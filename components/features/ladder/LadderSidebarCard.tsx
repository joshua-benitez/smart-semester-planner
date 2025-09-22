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
  const hasEvents = Boolean(!loading && !error && data && data.recentEvents?.length)

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-soft backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/60">Ladder Progress</h2>
            {!loading && !error && data && (
              <div className="flex items-baseline gap-2">
                <span className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 text-brandPrimary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v4" />
                    <path d="m12 22-2-4 2-4 2 4-2 4Z" />
                    <path d="m5.5 7 3.5 2" />
                    <path d="m18.5 7-3.5 2" />
                    <path d="m5 17 4-2" />
                    <path d="m19 17-4-2" />
                  </svg>
                  {data.stepLabel}
                </span>
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
                <span className="text-white/50">{data.nextStepLabel ? `${data.nextStepLabel} at ${data.nextStepPoints} pts` : 'Top of the ladder'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brandPrimary via-sky-400 to-cyan-300 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-white/70">
                  {`${Math.round(Math.min(100, Math.max(0, data.progressPercent)))}%`}
                </span>
              </div>
            </div>

            {hasEvents ? (
              <div className="space-y-2 text-xs text-white/60">
                <p className="font-medium text-white/70">Recent activity</p>
                <ul className="space-y-1.5">
                  {data.recentEvents.slice(0, 3).map((event) => (
                    <li key={event.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-white/50">
                          <span>{event.label}</span>
                          <span aria-hidden="true">•</span>
                          <span>{event.relativeTime}</span>
                        </div>
                        {event.description && <p className="text-[0.7rem] text-white/70">{event.description}</p>}
                      </div>
                      <span className={`text-[0.7rem] font-semibold ${event.pointsChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {event.pointsChange >= 0 ? '+' : ''}{event.pointsChange} pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-white/55">
                <div className="font-medium text-white/70">Recent activity</div>
                <div className="space-y-2">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="h-2.5 rounded-full bg-white/10"
                      style={{ opacity: 0.6 - idx * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            )}

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
