export const formatMessageDate = (
  timestamp: { toDate?: () => Date } | Date,
): string => {
  if (!timestamp) return ''
  const date =
    'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )

  if (messageDate.getTime() === today.getTime()) {
    return 'Hoje'
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Ontem'
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
}

export const formatMessageTime = (
  timestamp: { toDate?: () => Date } | Date,
): string => {
  if (!timestamp) return ''
  const date =
    'toDate' in timestamp && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp as Date)

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isSameDay = (
  timestamp1: { toDate?: () => Date } | Date,
  timestamp2: { toDate?: () => Date } | Date,
): boolean => {
  if (!timestamp1 || !timestamp2) return false

  const date1 =
    'toDate' in timestamp1 && timestamp1.toDate
      ? timestamp1.toDate()
      : new Date(timestamp1 as Date)
  const date2 =
    'toDate' in timestamp2 && timestamp2.toDate
      ? timestamp2.toDate()
      : new Date(timestamp2 as Date)

  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}
