import { formatMessageDate } from './formatMessageDate'

export const formatTime = (
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

  // Se a mensagem é de hoje ou ontem, mostra tempo relativo
  if (messageDate.getTime() === today.getTime()) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min`
    } else {
      return `${Math.floor(diffInMinutes / 60)}h`
    }
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Ontem'
  } else {
    // Para datas mais antigas, mostra a data formatada
    return formatMessageDate(timestamp)
  }
}
