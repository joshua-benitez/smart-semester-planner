// Streak-related types (scaffold)
export type StreakDay = {
  date: string;          // YYYY-MM-DD
  checked: boolean;      // user checked in (true) or not (false)
};

export type StreakSummary = {
  currentStreak: number; // consecutive days up to today
  bestStreak: number;    // historical best
  days: StreakDay[];     // range for heatmap (e.g., last 12 weeks)
};

