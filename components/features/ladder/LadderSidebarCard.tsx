'use client'

import React from 'react'
import Link from 'next/link'
import type { LadderSummary } from '@/types/ladder'

// card that lives in the sidebar and gives a quick ladder snapshot
interface LadderSidebarCardProps {
  data?: LadderSummary
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export function LadderSidebarCard({ data, loading, error, onRefresh }: LadderSidebarCardProps) {
  const hasEvents = Boolean(!loading && !error && data && data.recentEvents?.length)

  return (
    <div className="mt-6">
      <div className="rounded-xl border px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0f1116" }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(230,234,246,0.35)" }}>Ladder</h2>
            {!loading && !error && data && (
              <div className="flex items-baseline gap-2">
                <span className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white/90">
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
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
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-wide" style={{ background: "rgba(15,139,255,0.15)", color: "#0f8bff" }}>
                    <span className="size-1.5 rounded-full" style={{ background: "#0f8bff" }} aria-hidden="true" />
                    L{data.level}
                  </span>
                )}
              </div>
            )}
          </div>
          <button className="text-[0.7rem] font-medium transition hover:text-white" style={{ color: "rgba(230,234,246,0.4)" }} onClick={onRefresh}>
            Refresh
          </button>
        </div>

        {loading && <div className="text-[0.78rem]" style={{ color: "rgba(230,234,246,0.35)" }}>Loading…</div>}
        {error && <div className="text-[0.78rem] text-red-400">{error}</div>}

        {!loading && !error && data && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[0.68rem]">
                <span style={{ color: "rgba(230,234,246,0.45)" }}>{data.currentPoints} pts</span>
                <span style={{ color: "rgba(230,234,246,0.3)" }}>{data.nextStepLabel ? `${data.nextStepLabel} at ${data.nextStepPoints} pts` : 'Top of ladder'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%`, background: "linear-gradient(90deg,#0f8bff,#22d3ee)" }} />
                </div>
                <span className="text-[0.68rem] font-semibold" style={{ color: "rgba(230,234,246,0.45)" }}>
                  {`${Math.round(Math.min(100, Math.max(0, data.progressPercent)))}%`}
                </span>
              </div>
            </div>

            {hasEvents ? (
              <div className="space-y-2">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider" style={{ color: "rgba(230,234,246,0.35)" }}>Recent</p>
                <ul className="space-y-1.5">
                  {data.recentEvents.slice(0, 3).map((event) => (
                    <li key={event.id} className="flex items-center justify-between rounded-md px-2 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "rgba(230,234,246,0.3)" }}>
                          <span>{event.label}</span>
                          <span aria-hidden="true">•</span>
                          <span>{event.relativeTime}</span>
                        </div>
                        {event.description && <p className="text-[0.68rem]" style={{ color: "rgba(230,234,246,0.5)" }}>{event.description}</p>}
                      </div>
                      <span className={`text-[0.68rem] font-semibold ${event.pointsChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {event.pointsChange >= 0 ? '+' : ''}{event.pointsChange}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[0.68rem] font-semibold uppercase tracking-wider" style={{ color: "rgba(230,234,246,0.35)" }}>Recent</div>
                <div className="space-y-2">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)", opacity: 0.6 - idx * 0.15 }} />
                  ))}
                </div>
              </div>
            )}

            <Link href="/profile" className="inline-flex items-center gap-2 text-[0.7rem] font-semibold transition" style={{ color: "#0f8bff" }}>
              <span>View ladder</span>
              <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
