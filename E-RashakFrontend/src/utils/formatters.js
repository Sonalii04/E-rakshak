export function formatDateTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function formatConfidence(value) {
  return `${Math.round(value)}%`
}

export function confidenceTone(value) {
  if (value >= 85) return 'text-accent-700 bg-accent-50 border-accent-100'
  if (value >= 60) return 'text-amber-700 bg-warning-50 border-warning-100'
  return 'text-red-700 bg-danger-50 border-danger-100'
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

export function truncate(text, length = 60) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}
