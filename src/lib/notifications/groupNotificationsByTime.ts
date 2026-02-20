import { isToday, isYesterday, startOfDay, subDays } from 'date-fns'

import type { EmailNotificationEntity } from '@/types/entities/emailNotification'

export interface GroupedNotifications {
  hoje: EmailNotificationEntity[]
  ontem: EmailNotificationEntity[]
  antigas: EmailNotificationEntity[]
}

export function groupNotificationsByTime(
  notifications: EmailNotificationEntity[],
): GroupedNotifications {
  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)

  const hoje = notifications.filter((n) =>
    isToday(typeof n.createdAt === 'object' ? n.createdAt : new Date(n.createdAt)),
  )
  const ontem = notifications.filter((n) =>
    isYesterday(typeof n.createdAt === 'object' ? n.createdAt : new Date(n.createdAt)),
  )
  const antigas = notifications.filter((n) => {
    const d = typeof n.createdAt === 'object' ? n.createdAt : new Date(n.createdAt)
    return d < yesterday
  })

  return { hoje, ontem, antigas }
}
