'use client'

import NotificationsIcon from '@mui/icons-material/Notifications'
import { cn } from '@/lib/utils'

export interface BellIconWithBadgeProps {
  unreadCount: number
  className?: string
  iconClassName?: string
  'aria-label'?: string
}

/**
 * Ícone de sino com badge mostrando contagem de notificações não lidas.
 * - count === 0: sem badge
 * - count 1–99: número
 * - count > 99: "99+"
 */
export function BellIconWithBadge({
  unreadCount,
  className,
  iconClassName,
  'aria-label': ariaLabel,
}: BellIconWithBadgeProps) {
  const displayCount =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null

  return (
    <div className={cn('relative inline-flex', className)}>
      <NotificationsIcon
        fontSize="small"
        className={iconClassName}
        aria-hidden
      />
      {displayCount !== null && (
        <span
          className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#792EBD] px-1 text-[10px] font-semibold text-white"
          aria-hidden
        >
          {displayCount}
        </span>
      )}
      <span className="sr-only">
        {ariaLabel ??
          (unreadCount > 0
            ? `${unreadCount} notificação${unreadCount !== 1 ? 'ões' : ''} não lida${unreadCount !== 1 ? 's' : ''}`
            : 'Notificações')}
      </span>
    </div>
  )
}
