'use client'

import AnalyticsIcon from '@mui/icons-material/Analytics'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChatBubbleIcon from '@mui/icons-material/ChatBubbleOutline'
import ChecklistIcon from '@mui/icons-material/Checklist'
import GroupIcon from '@mui/icons-material/Group'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import PersonIcon from '@mui/icons-material/Person'
// import VideoCallIcon from '@mui/icons-material/VideoCall'
import { IndentDecreaseIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BellIconWithBadge } from '@/components/atoms/BellIconWithBadge/bellIconWithBadge'
import { NotificationsModal } from '@/components/organisms/Modals/NotificationsModal/notificationsModal'
import { useSidebar } from '@/contexts/SidebarContext'
import useAuth from '@/hooks/useAuth'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { cn } from '@/lib/utils'

type SidebarItem = {
  label: string
  href: string
  icon: React.ReactNode
}

const items: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <AnalyticsIcon fontSize="small" />,
  },
  {
    label: 'Meus Pacientes',
    href: '/pacientes',
    icon: <GroupIcon fontSize="small" />,
  },
  {
    label: 'Agenda',
    href: '/agenda',
    icon: <CalendarMonthIcon fontSize="small" />,
  },
  {
    label: 'Questionários',
    href: '/questionarios',
    icon: <ChecklistIcon fontSize="small" />,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: <ChatBubbleIcon fontSize="small" />,
  },
  // {
  //   label: 'Videochamada (Teste)',
  //   href: '/videochamada-teste',
  //   icon: <VideoCallIcon fontSize="small" />,
  // },
]

const secondary: SidebarItem[] = [
  { label: 'Perfil', href: '/perfil', icon: <PersonIcon fontSize="small" /> },
  {
    label: 'Suporte',
    href: '/suporte',
    icon: <HelpOutlineIcon fontSize="small" />,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { userUid, logoutUser, loading } = useAuth()
  const { isExpanded, toggleExpanded } = useSidebar()
  const { unreadCount } = useUnreadNotifications(userUid ?? undefined)

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
              src="/LogoUPsaude1.png"
              alt="Upsaúde Logo"
              width={100}
              height={40}
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Image
              src="/LogoUPsaude1.png"
              alt="Upsaúde Logo"
              width={40}
              height={40}
              className="object-contain"
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
              <IndentDecreaseIcon />
            ) : (
              <MenuIcon fontSize="small" />
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
          onClick={logoutUser}
          disabled={loading.logout}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60',
            isExpanded ? 'w-[90%]' : 'w-12 justify-center',
          )}
          aria-label="Sair"
          title={!isExpanded ? 'Sair' : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center">
            <LogoutIcon fontSize="small" />
          </div>
          {isExpanded && (
            <span className="truncate text-sm font-medium">Sair</span>
          )}
        </button>
      </div>
    </aside>
  )
}
