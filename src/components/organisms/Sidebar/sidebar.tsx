'use client'

import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  UserIcon,
  LifeBuoyIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  ChevronLeft as ChevronLeftIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

import { BellIconWithBadge } from '@/components/atoms/BellIconWithBadge/bellIconWithBadge'
import { NotificationsModal } from '@/components/organisms/Modals/NotificationsModal/notificationsModal'
import { useSidebar } from '@/contexts/SidebarContext'
import useAuth from '@/hooks/useAuth'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { cn } from '@/lib/utils'

type SidebarItem = {
  label: string
  href: string
  icon: ReactNode
}

const items: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboardIcon size={20} />,
  },
  {
    label: 'Meus Pacientes',
    href: '/pacientes',
    icon: <UsersIcon size={20} />,
  },
  {
    label: 'Agenda',
    href: '/agenda',
    icon: <CalendarIcon size={20} />,
  },
  {
    label: 'Questionários',
    href: '/questionarios',
    icon: <ClipboardListIcon size={20} />,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: <MessageSquareIcon size={20} />,
  },
]

const secondary: SidebarItem[] = [
  { label: 'Perfil', href: '/perfil', icon: <UserIcon size={20} /> },
  {
    label: 'Suporte',
    href: '/suporte',
    icon: <LifeBuoyIcon size={20} />,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { userUid, logoutUser, loading } = useAuth()
  const { isExpanded, toggleExpanded } = useSidebar()
  const { unreadCount } = useUnreadNotifications(userUid ?? undefined)

  const handleLogoutClick = () => {
    logoutUser().catch(() => undefined)
  }


  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-purple-50 py-6 transition-all duration-300',
        isExpanded ? 'w-64' : 'w-16',
      )}
    >
      {/* Top section */}
      <div className="flex w-full flex-col gap-6">
        {/* Logo */}

        {/* Logo */}
        {isExpanded ? (
          <div className="flex flex-1 items-center justify-center">
            <Image
              src="/logoups1.png"
              alt="Upsaúde Logo"
              width={200}
              height={60}
              style={{ width: '100px', height: 'auto' }}
              priority
            />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Image
              src="/logoups1.png"
              alt="Upsaúde Logo"
              width={200}
              height={60}
              style={{ width: '40px', height: 'auto' }}
              priority
            />
          </div>
        )}

        {/* Botão Hambúrguer */}
        <div
          className={cn(
            'flex items-center px-4',
            isExpanded ? 'justify-between' : 'flex-col gap-3',
          )}
        >
          {/* {!isExpanded && (
            <Image
              src="/purple-logo.png"
              alt="Logo"
              width={65}
              height={65}
              className="flex-shrink-0"
            />
          )} */}
          <button
            onClick={toggleExpanded}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label={isExpanded ? 'Contrair menu' : 'Expandir menu'}
          >
            {isExpanded ? (
              <PanelLeftCloseIcon size={20} />
            ) : (
              <ChevronLeftIcon size={20} />
            )}
          </button>
        </div>

        {/* Main items */}
        <div className="flex w-full flex-col items-center gap-4">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary',
                  isActive && 'bg-primary/15 text-primary',
                  isExpanded ? 'w-[90%]' : 'w-12 justify-center',
                )}
                aria-label={item.label}
                title={!isExpanded ? item.label : undefined}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  {item.icon}
                </div>
                {isExpanded && (
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Notificações */}
          <NotificationsModal recipientId={userUid ?? undefined} align="left">
            <button
              type="button"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary',
                isExpanded ? 'w-[90%]' : 'w-12 justify-center',
              )}
              aria-label="Notificações"
              title={!isExpanded ? 'Notificações' : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                <BellIconWithBadge unreadCount={unreadCount} />
              </div>
              {isExpanded && (
                <span className="truncate text-sm font-medium">
                  Notificações
                </span>
              )}
            </button>
          </NotificationsModal>
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex w-full flex-col items-center gap-4">
        <div
          className={cn(
            'my-4 h-px bg-slate-400',
            isExpanded ? 'w-[90%]' : 'mx-auto w-12',
          )}
        />

        {secondary.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary',
                isActive && 'bg-primary/15 text-primary',
                isExpanded ? 'w-[90%]' : 'w-12 justify-center',
              )}
              aria-label={item.label}
              title={!isExpanded ? item.label : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {item.icon}
              </div>
              {isExpanded && (
                <span className="truncate text-sm font-medium">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}

        <button
          type="button"
          onClick={handleLogoutClick}
          disabled={loading.logout}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60',
            isExpanded ? 'w-[90%]' : 'w-12 justify-center',
          )}
          aria-label="Sair"
          title={!isExpanded ? 'Sair' : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center">
            <LogOutIcon size={20} />
          </div>
          {isExpanded && (
            <span className="truncate text-sm font-medium">Sair</span>
          )}
        </button>
      </div>
    </aside>
  )
}
