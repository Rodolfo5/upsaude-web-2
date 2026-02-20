export function calculateAge(date?: Date | string) {
  if (!date) return '-'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diff = new Date().getTime() - dateObj.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}
