'use client'

import React from 'react'
import Link from 'next/link'
import type { Assignment } from '@/types/assignment'
import { generateRecommendations, explainRecommendation } from '@/lib/recommendation-engine'
import type { AssignmentRecommendation } from '@/lib/recommendation-engine'

interface RecommendationPanelProps {
  assignments: Assignment[]
}

const urgencyColors = {
  critical: {
    border: 'border-red-500/60',
    background: 'bg-red-500/10',
    gradient: 'from-red-400/40 via-red-500/10 to-transparent',
    text: 'text-red-300',
    badge: 'bg-red-500/20 border-red-500/40 text-red-300',
  },
  high: {
    border: 'border-orange-500/60',
    background: 'bg-orange-500/10',
    gradient: 'from-orange-400/40 via-orange-500/10 to-transparent',
    text: 'text-orange-300',
    badge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  },
  medium: {
    border: 'border-blue-500/60',
    background: 'bg-blue-500/10',
    gradient: 'from-blue-400/40 via-blue-500/10 to-transparent',
    text: 'text-blue-300',
    badge: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  },
  low: {
    border: 'border-gray-500/60',
    background: 'bg-gray-500/10',
    gradient: 'from-gray-400/40 via-gray-500/10 to-transparent',
    text: 'text-gray-300',
    badge: 'bg-gray-500/20 border-gray-500/40 text-gray-300',
  },
}

const RecommendationCard = ({ rec }: { rec: AssignmentRecommendation }) => {
  const colors = urgencyColors[rec.urgencyLevel]
  const dueDate = new Date(rec.assignment.dueDate).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/assignments/${rec.assignment.id}/edit`}
      className={`block relative overflow-hidden rounded-xl border-2 p-4 transition hover:scale-[1.02] ${colors.background} ${colors.border} hover:shadow-lg`}
    >
      <div className={`pointer-events-none absolute inset-0 -z-10 opacity-50 bg-gradient-to-br ${colors.gradient}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-white line-clamp-2 mb-1">
            {rec.assignment.title}
          </h4>
          <p className="text-xs text-white/60">{rec.assignment.course?.name || 'General'}</p>
        </div>
        <span className={`px-2 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 ${colors.badge}`}>
          {rec.urgencyLevel}
        </span>
      </div>

      <p className={`text-sm font-medium mb-2 ${colors.text}`}>
        {rec.reasonText}
      </p>

      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Due: {dueDate}</span>
        {rec.assignment.estimatedHours && (
          <span>~{rec.assignment.estimatedHours}h</span>
        )}
      </div>
    </Link>
  )
}

export const RecommendationPanel = ({ assignments }: RecommendationPanelProps) => {
  const { topRecommendation, quickWins, highPriority, earlyBonusOpportunities } = generateRecommendations(assignments)

  if (!topRecommendation) {
    return (
      <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/10">
        <h2 className="text-xl font-bold mb-4">🎯 Smart Recommendations</h2>
        <div className="text-center py-8 text-white/70">
          <p className="text-lg">🎉 All caught up!</p>
          <p className="text-sm mt-2">No assignments to recommend right now.</p>
        </div>
      </section>
    )
  }

  const topColors = urgencyColors[topRecommendation.urgencyLevel]
  const topDueDate = new Date(topRecommendation.assignment.dueDate).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <section className="rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/10 space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">🎯 Smart Recommendations</h2>
        <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">
          Powered by AI scoring
        </span>
      </div>

      {/* Top Recommendation - Hero Card */}
      <div className={`relative overflow-hidden rounded-2xl border-2 p-6 ${topColors.background} ${topColors.border} ring-2 ring-white/10`}>
        <div className={`pointer-events-none absolute inset-0 -z-10 opacity-60 bg-gradient-to-br ${topColors.gradient}`} aria-hidden="true" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⭐</span>
              <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${topColors.badge}`}>
                START THIS NEXT
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {topRecommendation.assignment.title}
            </h3>
            <p className="text-sm text-white/70 mb-3">
              {topRecommendation.assignment.course?.name || 'General'} • Due {topDueDate}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className={`text-base font-medium ${topColors.text}`}>
            {topRecommendation.reasonText}
          </div>
          <p className="text-sm text-white/80">
            {explainRecommendation(topRecommendation)}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <span className="font-medium">Difficulty:</span>
            <span className={`status-badge status-${topRecommendation.assignment.difficulty} text-xs`}>
              {topRecommendation.assignment.difficulty}
            </span>
          </div>
          {topRecommendation.assignment.estimatedHours && (
            <div className="flex items-center gap-2 text-white/60">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2"/>
              </svg>
              <span>~{topRecommendation.assignment.estimatedHours} hours</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/60">
            <span className="font-medium">Weight:</span>
            <span>{topRecommendation.assignment.weight}%</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            href={`/assignments/${topRecommendation.assignment.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium text-white transition"
          >
            <span>View Assignment</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <h3 className="text-lg font-bold">Quick Wins</h3>
            <span className="text-xs text-white/50">Easy tasks to build momentum</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickWins.map((rec) => (
              <RecommendationCard key={rec.assignment.id} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* High Priority */}
      {highPriority.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔥</span>
            <h3 className="text-lg font-bold">High Priority</h3>
            <span className="text-xs text-white/50">Critical deadlines approaching</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {highPriority.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.assignment.id} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Early Bonus Opportunities */}
      {earlyBonusOpportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎁</span>
            <h3 className="text-lg font-bold">Earn Bonus Points</h3>
            <span className="text-xs text-white/50">Complete early for +15 ladder points</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {earlyBonusOpportunities.map((rec) => (
              <RecommendationCard key={rec.assignment.id} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default RecommendationPanel
