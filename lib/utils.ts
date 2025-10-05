// My grab-bag of helpers so components stop copy/pasting the same logic

// friendly date output for the UI without pulling in a whole library
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// tiny helper to keep the validation files readable
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

// safest way to parse without throwing and wrecking async flows
export const parseDateSafe = (dateString: any): Date | null => {
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

// quick-and-dirty id generator for client-side maps
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// I use this when syllabus text comes in all lowercase
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
