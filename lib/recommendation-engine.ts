import type { Assignment } from '@/types/assignment'

export type RecommendationReason =
  | 'overdue_critical'
  | 'due_today_urgent'
  | 'due_soon_high_weight'
  | 'quick_win_easy'
  | 'blocking_high_priority'
  | 'early_bonus_opportunity'

export type AssignmentRecommendation = {
  assignment: Assignment
  score: number
  reason: RecommendationReason
  reasonText: string
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
}

export type RecommendationGroup = {
  title: string
  description: string
  recommendations: AssignmentRecommendation[]
}

// Calculate urgency score based on time until due (0-100)
function calculateUrgencyScore(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilDue < 0) return 100 // Overdue
  if (hoursUntilDue < 12) return 95 // Less than 12 hours
  if (hoursUntilDue < 24) return 85 // Less than 1 day
  if (hoursUntilDue < 48) return 70 // Less than 2 days
  if (hoursUntilDue < 72) return 55 // Less than 3 days
  if (hoursUntilDue < 168) return 40 // Less than 1 week
  return 20 // More than 1 week
}

// Calculate importance score based on weight and difficulty (0-100)
function calculateImportanceScore(assignment: Assignment): number {
  const weightScore = (assignment.weight / 100) * 60 // Max 60 points from weight

  const difficultyMap: Record<string, number> = {
    brutal: 40,
    crushing: 30,
    moderate: 20,
    easy: 10,
  }
  const difficultyScore = difficultyMap[assignment.difficulty] || 20 // Max 40 points from difficulty

  return Math.min(100, weightScore + difficultyScore)
}

// Calculate quick win score (higher for easy, short tasks)
function calculateQuickWinScore(assignment: Assignment): number {
  let score = 0

  // Favor easy assignments
  if (assignment.difficulty === 'easy') score += 40
  else if (assignment.difficulty === 'moderate') score += 20

  // Favor short assignments
  if (assignment.estimatedHours) {
    if (assignment.estimatedHours <= 1) score += 40
    else if (assignment.estimatedHours <= 2) score += 25
    else if (assignment.estimatedHours <= 4) score += 10
  } else {
    // If no estimate, assume moderate
    score += 15
  }

  // Slight bonus for low weight (not critical)
  if (assignment.weight < 10) score += 10
  else if (assignment.weight < 20) score += 5

  return Math.min(100, score)
}

// Detect if assignment qualifies for early bonus
function canGetEarlyBonus(dueDate: string): boolean {
  const now = new Date()
  const due = new Date(dueDate)
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilDue > 12 // Can still get early bonus if completed 12+ hours before due
}

// Main recommendation function
export function generateRecommendations(assignments: Assignment[]): {
  topRecommendation: AssignmentRecommendation | null
  quickWins: AssignmentRecommendation[]
  highPriority: AssignmentRecommendation[]
  earlyBonusOpportunities: AssignmentRecommendation[]
} {
  // Only consider incomplete assignments
  const activeAssignments = assignments.filter(a => a.status !== 'completed')

  if (activeAssignments.length === 0) {
    return {
      topRecommendation: null,
      quickWins: [],
      highPriority: [],
      earlyBonusOpportunities: [],
    }
  }

  const now = new Date()
  const recommendations: AssignmentRecommendation[] = []

  for (const assignment of activeAssignments) {
    const urgencyScore = calculateUrgencyScore(assignment.dueDate)
    const importanceScore = calculateImportanceScore(assignment)
    const quickWinScore = calculateQuickWinScore(assignment)

    const due = new Date(assignment.dueDate)
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    const isOverdue = hoursUntilDue < 0
    const dueToday = hoursUntilDue >= 0 && hoursUntilDue < 24
    const dueSoon = hoursUntilDue >= 24 && hoursUntilDue < 72

    // Determine primary reason and calculate final score
    let reason: RecommendationReason
    let reasonText: string
    let urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
    let finalScore: number

    if (isOverdue) {
      reason = 'overdue_critical'
      reasonText = `Overdue by ${Math.abs(Math.round(hoursUntilDue / 24))} day${Math.abs(Math.round(hoursUntilDue / 24)) !== 1 ? 's' : ''} - needs immediate attention!`
      urgencyLevel = 'critical'
      finalScore = urgencyScore + importanceScore * 0.5 // Heavy weight on urgency
    } else if (dueToday) {
      reason = 'due_today_urgent'
      reasonText = `Due today at ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - finish this ASAP!`
      urgencyLevel = 'high'
      finalScore = urgencyScore + importanceScore * 0.6
    } else if (dueSoon && assignment.weight >= 20) {
      reason = 'due_soon_high_weight'
      reasonText = `High-value assignment (${assignment.weight}% of grade) due in ${Math.round(hoursUntilDue / 24)} days`
      urgencyLevel = 'high'
      finalScore = urgencyScore * 0.7 + importanceScore * 0.9
    } else if (quickWinScore >= 60) {
      reason = 'quick_win_easy'
      const timeEstimate = assignment.estimatedHours
        ? `~${assignment.estimatedHours} hour${assignment.estimatedHours !== 1 ? 's' : ''}`
        : 'quick task'
      reasonText = `Quick win - ${timeEstimate}, ${assignment.difficulty} difficulty`
      urgencyLevel = 'medium'
      finalScore = quickWinScore * 0.6 + urgencyScore * 0.3 + importanceScore * 0.1
    } else if (canGetEarlyBonus(assignment.dueDate)) {
      reason = 'early_bonus_opportunity'
      const daysUntil = Math.round(hoursUntilDue / 24)
      reasonText = `Complete now for +15 ladder points! Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
      urgencyLevel = 'medium'
      finalScore = urgencyScore * 0.5 + importanceScore * 0.4 + 20 // Bonus for gamification
    } else {
      reason = 'blocking_high_priority'
      reasonText = `Important assignment - ${assignment.weight}% of grade, ${assignment.difficulty} difficulty`
      urgencyLevel = 'low'
      finalScore = urgencyScore * 0.5 + importanceScore * 0.5
    }

    recommendations.push({
      assignment,
      score: finalScore,
      reason,
      reasonText,
      urgencyLevel,
    })
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score)

  // Separate into categories
  const quickWins = recommendations
    .filter(r => r.reason === 'quick_win_easy')
    .slice(0, 3)

  const highPriority = recommendations
    .filter(r => r.urgencyLevel === 'critical' || r.urgencyLevel === 'high')
    .slice(0, 5)

  const earlyBonusOpportunities = recommendations
    .filter(r => r.reason === 'early_bonus_opportunity' && canGetEarlyBonus(r.assignment.dueDate))
    .slice(0, 3)

  return {
    topRecommendation: recommendations[0] || null,
    quickWins,
    highPriority,
    earlyBonusOpportunities,
  }
}

// Get a simple text explanation for why to do this assignment
export function explainRecommendation(recommendation: AssignmentRecommendation): string {
  const { assignment, reason } = recommendation

  switch (reason) {
    case 'overdue_critical':
      return `This assignment is overdue and should be your top priority to avoid further late penalties.`
    case 'due_today_urgent':
      return `With only hours remaining, focus on completing this today to avoid missing the deadline.`
    case 'due_soon_high_weight':
      return `This assignment is worth ${assignment.weight}% of your grade and due soon. Starting now gives you time to do quality work.`
    case 'quick_win_easy':
      const time = assignment.estimatedHours ? `about ${assignment.estimatedHours} hours` : 'a short time'
      return `This is a quick win that should only take ${time}. Knock it out to build momentum!`
    case 'early_bonus_opportunity':
      return `Complete this assignment ahead of schedule to earn +15 ladder points as an early bonus!`
    case 'blocking_high_priority':
      return `This is an important assignment that deserves focused attention. Tackling it now prevents last-minute stress.`
    default:
      return `Work on this assignment to stay on top of your coursework.`
  }
}
