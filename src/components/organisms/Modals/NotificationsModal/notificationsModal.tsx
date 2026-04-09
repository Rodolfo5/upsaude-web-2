'use client'

import AssignmentIcon from '@mui/icons-material/Assignment'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChatBubbleIcon from '@mui/icons-material/ChatBubbleOutline'
import ChecklistIcon from '@mui/icons-material/Checklist'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import React, { useEffect } from 'react'

import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSidebar } from '@/contexts/SidebarContext'
import { useNotifications } from '@/hooks/useNotifications'
import { groupNotificationsByTime } from '@/lib/notifications/groupNotificationsByTime'
import { cn } from '@/lib/utils'
import type { DoctorNotificationEntity } from '@/types/entities/doctorNotification'

import { NotificationsModalProps } from './types'

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ReactNode; bgColor: string }
> = {
  'Questionários de Saúde': {
    icon: <HelpOutlineIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  Exames: {
    icon: <MedicationOutlinedIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-orange-500',
  },
  'Prescrição Memed': {
    icon: <MedicationOutlinedIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-orange-500',
  },
  Medicamento: {
    icon: <MedicationOutlinedIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-orange-500',
  },
  Consulta: {
    icon: <CalendarMonthIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-green-500',
  },
  'Trilhas de Saúde': {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  'Check-Up digital': {
    icon: <ChecklistIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-blue-500',
  },
  'Plano Terapêutico': {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  'Observações Médicas': {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  SOAP: {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  Outros: {
    icon: <AssignmentIcon className="h-5 w-5 text-white" />,
    bgColor: 'bg-[#792EBD]',
  },
  Chat: {
    icon: <ChatBubbleIcon className="h-5 w-5 text-white" />,
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
  notification: DoctorNotificationEntity
  onMarkAsRead: (id: string) => void
}) {
  const config = getCategoryConfig(notification.type)
  const createdAt =
    typeof notification.createdAt === 'object'
      ? notification.createdAt
      : new Date(notification.createdAt)

  const timeStr = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: ptBR,
  }).replace('há cerca de ', 'Há ')

  const isRead = notification.hasSeenToUsers?.includes(notification.users[0])

  return (
    <button
      type="button"
      onClick={() => !isRead && onMarkAsRead(notification.id)}
      className={cn(
        'flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50',
        !isRead && 'bg-purple-50/30',
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
              {notification.title}
            </p>
            {!isRead && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#792EBD]" />
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-gray-400">{timeStr}</span>
        </div>
        <p className="text-sm text-gray-600">{notification.content}</p>
      </div>
    </button>
  )
}

export function NotificationsModal({
  children,
  recipientId,
  open,
  onOpenChange,
  align = 'center',
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

  const { isExpanded } = useSidebar()
  const effectiveAlign =
    align === 'left' && isExpanded ? 'left-expanded' : align

  const hasUnread = notifications.some(
    (n) => !n.hasSeenToUsers?.includes(n.users[0]),
  )

  const table = useReactTable({
    data: notifications,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  useEffect(() => {
    table.setPageIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const paginatedNotifications = table
    .getRowModel()
    .rows.map((row) => row.original)
  const paginatedGroups = groupNotificationsByTime(paginatedNotifications)
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  return (
    <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn(
          'flex max-h-[85vh] w-[700px] flex-col overflow-hidden bg-white p-0 shadow-xl',
          effectiveAlign === 'left' && 'left-[16%] translate-x-[-50%]',
          effectiveAlign === 'left-expanded' && 'left-[26%] translate-x-[-50%]',
        )}
      >
        <div className="flex flex-row items-center justify-between space-y-0 border-b border-gray-200 px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-[#792EBD]">
            Notificações
          </DialogTitle>
          <DialogDescription className="sr-only">
            Lista de notificações do usuário
          </DialogDescription>
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
            className="m-0 max-h-[500px] flex-1 overflow-y-auto data-[state=inactive]:hidden"
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
            className="m-0 max-h-[500px] flex-1 overflow-y-auto data-[state=inactive]:hidden"
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
            className="m-0 max-h-[500px] flex-1 overflow-y-auto data-[state=inactive]:hidden"
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
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir para primeira página</span>
              <KeyboardDoubleArrowLeftIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Página anterior</span>
              <KeyboardArrowLeftIcon className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === currentPage
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 w-8 rounded-full border-none p-0',
                    isActive
                      ? 'bg-[#792EBD] text-white hover:bg-[#792EBD]/90'
                      : 'bg-transparent text-gray-600 hover:bg-gray-50',
                  )}
                  onClick={() => table.setPageIndex(page - 1)}
                >
                  {page}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Próxima página</span>
              <KeyboardArrowRightIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir para última página</span>
              <KeyboardDoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  notifications: DoctorNotificationEntity[]
  loading: boolean
  error: string | null
  onMarkAsRead: (id: string) => void
  hoje: DoctorNotificationEntity[]
  ontem: DoctorNotificationEntity[]
  antigas: DoctorNotificationEntity[]
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Carregando...</p>
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
