import { isToday, isYesterday, startOfDay, subDays } from 'date-fns'

import type { DoctorNotificationEntity } from '@/types/entities/doctorNotification'

export interface GroupedNotifications {
  hoje: DoctorNotificationEntity[]
  ontem: DoctorNotificationEntity[]
  antigas: DoctorNotificationEntity[]
}

export function groupNotificationsByTime(
  notifications: DoctorNotificationEntity[],
): GroupedNotifications {
  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)

  const hoje = notifications.filter((n) =>
    isToday(
      typeof n.createdAt === 'object' ? n.createdAt : new Date(n.createdAt),
    ),
  )
  const ontem = notifications.filter((n) =>
    isYesterday(
      typeof n.createdAt === 'object' ? n.createdAt : new Date(n.createdAt),
    ),
  )
  const antigas = notifications.filter((n) => {
    const d =
      typeof n.createdAt === 'object' ? n.createdAt : new Date(n.createdAt)
    return d < yesterday
  })

  return { hoje, ontem, antigas }
}
