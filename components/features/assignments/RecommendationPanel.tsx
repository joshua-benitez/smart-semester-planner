'use client'

import React from 'react'
import Link from 'next/link'
import type { Assignment } from '@/types/assignment'
import { generateRecommendations, explainRecommendation } from '@/lib/recommendation-engine'
import type { AssignmentRecommendation } from '@/lib/recommendation-engine'

interface RecommendationPanelProps {
  assignments: Assignment[]
}

const urgencyStyles = {
  critical: {
    borderLeft: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  },
  high: {
    borderLeft: 'border-l-orange-500',
    badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  },
  medium: {
    borderLeft: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  },
  low: {
    borderLeft: 'border-l-gray-400',
    badge: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
  },
}

const CompactRecCard = ({ rec }: { rec: AssignmentRecommendation }) => {
  const styles = urgencyStyles[rec.urgencyLevel]
  const dueDate = new Date(rec.assignment.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/assignments/${rec.assignment.id}/edit`}
      className={`group flex flex-col justify-between rounded-lg border border-gray-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md ${styles.borderLeft}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brandPrimary">
          {rec.assignment.title}
        </h4>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${styles.badge}`}>
          {rec.urgencyLevel}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
        <span className="max-w-[120px] truncate">{rec.assignment.course?.name || 'General'}</span>
        <div className="flex shrink-0 gap-1.5">
          {rec.assignment.estimatedHours && <span>~{rec.assignment.estimatedHours}h</span>}
          <span className="font-mono text-[0.65rem]">• {dueDate}</span>
        </div>
      </div>
    </Link>
  )
}

export const RecommendationPanel = ({ assignments }: RecommendationPanelProps) => {
  const { topRecommendation, quickWins, highPriority, earlyBonusOpportunities } = generateRecommendations(assignments)

  if (!topRecommendation) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center shadow-sm">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Schedule Clear</h2>
        <p className="mt-1 text-sm text-gray-500">Your AI overview has no urgent recommendations right now.</p>
      </section>
    )
  }

  const topStyles = urgencyStyles[topRecommendation.urgencyLevel]
  const topDueDate = new Date(topRecommendation.assignment.dueDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-gray-200 pb-3">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">Focus Overview</h2>
      </div>

      <div className={`rounded-xl border border-gray-200 border-l-4 bg-white p-5 shadow-sm ${topStyles.borderLeft}`}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">
            Top Priority
          </span>
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${topStyles.badge}`}>
            {topRecommendation.urgencyLevel}
          </span>
        </div>

        <h3 className="mb-1 text-2xl font-bold leading-tight tracking-tight text-gray-900">
          {topRecommendation.assignment.title}
        </h3>
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-medium text-gray-500">
          <span className="text-gray-800">{topRecommendation.assignment.course?.name || 'General'}</span>
          <span>•</span>
          <span className="text-gray-600">Due {topDueDate}</span>
        </div>

        <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="mb-1 text-[0.9rem] font-bold text-gray-900">{topRecommendation.reasonText}</div>
          <p className="text-sm leading-relaxed text-gray-600">{explainRecommendation(topRecommendation)}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div className="flex gap-4 font-mono text-xs text-gray-500">
            <div className="flex flex-col">
              <span className="mb-0.5 text-[0.65rem] uppercase text-gray-400">Difficulty</span>
              <span className="font-bold capitalize text-gray-800">{topRecommendation.assignment.difficulty}</span>
            </div>
            {topRecommendation.assignment.estimatedHours && (
              <div className="flex flex-col">
                <span className="mb-0.5 text-[0.65rem] uppercase text-gray-400">Est. Time</span>
                <span className="font-bold text-gray-800">~{topRecommendation.assignment.estimatedHours}h</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="mb-0.5 text-[0.65rem] uppercase text-gray-400">Weight</span>
              <span className="font-bold text-gray-800">{topRecommendation.assignment.weight}%</span>
            </div>
          </div>

          <Link href={`/assignments/${topRecommendation.assignment.id}/edit`} className="btn-primary px-4 py-2 text-sm shadow-sm">
            Open Task
          </Link>
        </div>
      </div>

      {(quickWins.length > 0 || highPriority.length > 0 || earlyBonusOpportunities.length > 0) && (
        <div className="mt-6 space-y-6">
          {quickWins.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Quick Wins</h3>
                <span className="text-xs text-gray-500">Easy tasks to build momentum</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {quickWins.map((rec) => (
                  <CompactRecCard key={rec.assignment.id} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {highPriority.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">High Priority</h3>
                <span className="text-xs text-gray-500">Critical deadlines approaching</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {highPriority.slice(0, 3).map((rec) => (
                  <CompactRecCard key={rec.assignment.id} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {earlyBonusOpportunities.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Bonus Points</h3>
                <span className="text-xs text-gray-500">Complete early for +15 ladder points</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {earlyBonusOpportunities.map((rec) => (
                  <CompactRecCard key={rec.assignment.id} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default RecommendationPanel
