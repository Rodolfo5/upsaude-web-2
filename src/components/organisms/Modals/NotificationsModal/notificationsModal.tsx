'use client'

import AssignmentIcon from '@mui/icons-material/Assignment'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChatBubbleIcon from '@mui/icons-material/ChatBubbleOutline'
import ChecklistIcon from '@mui/icons-material/Checklist'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as React from 'react'

import { Button } from '@/components/atoms/Button/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/hooks/useNotifications'
import { groupNotificationsByTime } from '@/lib/notifications/groupNotificationsByTime'
import { cn } from '@/lib/utils'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'
import { EmailNotificationCategory } from '@/types/entities/emailNotification'

import { NotificationsModalProps } from './types'

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ReactNode; bgColor: string }
> = {
  [EmailNotificationCategory.CHAT]: {
    icon: <ChatBubbleIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  [EmailNotificationCategory.THERAPEUTIC_PLAN]: {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  [EmailNotificationCategory.CONSULTATIONS]: {
    icon: <CalendarMonthIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-green-500',
  },
  [EmailNotificationCategory.PRESCRIPTIONS]: {
    icon: <MedicationOutlinedIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-orange-500',
  },
  [EmailNotificationCategory.CHECKUP]: {
    icon: <ChecklistIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-blue-500',
  },
  [EmailNotificationCategory.QUESTIONNAIRES]: {
    icon: <HelpOutlineIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  [EmailNotificationCategory.TRIAGE]: {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
}

function getCategoryConfig(category: string) {
  return (
    CATEGORY_CONFIG[category] ?? {
      icon: <AssignmentIcon className="h-5 w-5 text-white" />,
      bgColor: 'bg-[#792EBD]',
    }
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: EmailNotificationEntity
  onMarkAsRead: (id: string) => void
}) {
  const config = getCategoryConfig(notification.category)
  const createdAt =
    typeof notification.createdAt === 'object'
      ? notification.createdAt
      : new Date(notification.createdAt)
  
  const timeStr = formatDistanceToNow(createdAt, { 
    addSuffix: true, 
    locale: ptBR 
  }).replace('há cerca de ', 'Há ')

  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      className={cn(
        'flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50',
        !notification.isRead && 'bg-purple-50/30',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          config.bgColor,
        )}
      >
        {config.icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {notification.category}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#792EBD]" />
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-gray-400">{timeStr}</span>
        </div>
        <p className="text-sm text-gray-600">
          {notification.message}
        </p>
      </div>
    </button>
  )
}

export function NotificationsModal({
  children,
  recipientId,
  open,
  onOpenChange,
}: NotificationsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const {
    notifications,
    loading,
    error,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  } = useNotifications(recipientId, open ?? isOpen)

  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const { hoje, ontem, antigas } = groupNotificationsByTime(notifications)
  const hasUnread = notifications.some((n) => !n.isRead)
  
  // Pagination
  const totalPages = Math.ceil(notifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNotifications = notifications.slice(startIndex, endIndex)
  const paginatedGroups = groupNotificationsByTime(paginatedNotifications)

  return (
    <Popover open={open ?? isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[700px] max-h-[85vh] overflow-hidden bg-white p-0 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-row items-center justify-between space-y-0 border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-[#792EBD]">
            Notificações
          </h2>
        </div>

        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'unread' | 'read')}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 pt-2">
            <TabsList className="h-auto gap-0 border-0 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-0 pb-3 pr-6 text-sm font-medium text-gray-600 data-[state=active]:border-[#792EBD] data-[state=active]:text-[#792EBD] data-[state=active]:shadow-none"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-none border-b-2 border-transparent px-6 pb-3 text-sm font-medium text-gray-600 data-[state=active]:border-[#792EBD] data-[state=active]:text-[#792EBD] data-[state=active]:shadow-none"
              >
                Não lidas
              </TabsTrigger>
              <TabsTrigger
                value="read"
                className="rounded-none border-b-2 border-transparent px-6 pb-3 text-sm font-medium text-gray-600 data-[state=active]:border-[#792EBD] data-[state=active]:text-[#792EBD] data-[state=active]:shadow-none"
              >
                Lidas
              </TabsTrigger>
            </TabsList>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-sm font-medium text-[#792EBD] hover:bg-transparent hover:text-[#792EBD] hover:underline"
              >
                Marcar tudo como lido
              </Button>
            )}
          </div>

          <TabsContent
            value="all"
            className="m-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
          >
            <NotificationList
              notifications={paginatedNotifications}
              loading={loading}
              error={error}
              onMarkAsRead={markAsRead}
              hoje={paginatedGroups.hoje}
              ontem={paginatedGroups.ontem}
              antigas={paginatedGroups.antigas}
            />
          </TabsContent>
          <TabsContent
            value="unread"
            className="m-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
          >
            <NotificationList
              notifications={paginatedNotifications}
              loading={loading}
              error={error}
              onMarkAsRead={markAsRead}
              hoje={paginatedGroups.hoje}
              ontem={paginatedGroups.ontem}
              antigas={paginatedGroups.antigas}
            />
          </TabsContent>
          <TabsContent
            value="read"
            className="m-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
          >
            <NotificationList
              notifications={paginatedNotifications}
              loading={loading}
              error={error}
              onMarkAsRead={markAsRead}
              hoje={paginatedGroups.hoje}
              ontem={paginatedGroups.ontem}
              antigas={paginatedGroups.antigas}
            />
          </TabsContent>
        </Tabs>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Primeira página"
            >
              ‹‹
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Página anterior"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1,
              )
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-sm font-medium',
                      currentPage === page
                        ? 'bg-[#792EBD] text-white'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Próxima página"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Última página"
            >
              ››
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function NotificationList({
  notifications,
  loading,
  error,
  onMarkAsRead,
  hoje,
  ontem,
  antigas,
}: {
  notifications: EmailNotificationEntity[]
  loading: boolean
  error: string | null
  onMarkAsRead: (id: string) => void
  hoje: EmailNotificationEntity[]
  ontem: EmailNotificationEntity[]
  antigas: EmailNotificationEntity[]
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (error === 'INDEX_REQUIRED') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-orange-900">
            🔧 Configuração Necessária
          </p>
          <p className="mb-4 text-sm text-orange-800">
            O Firestore precisa de um índice para exibir as notificações.
          </p>
          <div className="space-y-2 text-left text-xs text-orange-700">
            <p className="font-semibold">Como resolver:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Abra o console do navegador (F12)</li>
              <li>Copie o link que aparece no erro</li>
              <li>Cole no navegador e clique em "Criar índice"</li>
              <li>Aguarde 2-5 minutos e recarregue a página</li>
            </ol>
          </div>
          <p className="mt-4 text-xs text-orange-600">
            📚 Mais detalhes:{' '}
            <code className="rounded bg-orange-100 px-1">
              COMO_RESOLVER_ERRO_FIRESTORE.md
            </code>
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm font-semibold text-red-900">Erro ao carregar</p>
          <p className="mt-1 text-xs text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-gray-500">Nenhuma notificação</p>
      </div>
    )
  }

  return (
    <div>
      {hoje.length > 0 && (
        <section>
          <h3 className="border-b border-gray-100 bg-white px-6 py-3 text-sm font-semibold text-gray-900">
            Hoje
          </h3>
          <div className="divide-y divide-gray-100">
            {hoje.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </section>
      )}
      {ontem.length > 0 && (
        <section className="border-t border-gray-100">
          <h3 className="border-b border-gray-100 bg-white px-6 py-3 text-sm font-semibold text-gray-900">
            Ontem
          </h3>
          <div className="divide-y divide-gray-100">
            {ontem.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </section>
      )}
      {antigas.length > 0 && (
        <section className="border-t border-gray-100">
          <h3 className="border-b border-gray-100 bg-white px-6 py-3 text-sm font-semibold text-gray-900">
            Todos
          </h3>
          <div className="divide-y divide-gray-100">
            {antigas.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
