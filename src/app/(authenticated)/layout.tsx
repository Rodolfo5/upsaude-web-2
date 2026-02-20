'use client'

import { usePathname } from 'next/navigation'

import Sidebar from '@/components/organisms/Sidebar/sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'
import RouteGuard from '@/router'

/**
 * 🏥 LAYOUT PARA MÉDICOS
 *
 * Layout específico para usuários autenticados (médicos)
 * - Proteção de rota
 * - Apenas Sidebar lateral
 * - Área principal para conteúdo
 */

function AuthenticatedLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isExpanded } = useSidebar()
  const pathname = usePathname()

  const pagesWithoutSidebar = [
    '/complete-registration',
    '/configure-agenda',
    '/configure-agenda-step-2',
    '/configure-agenda-summary',
  ]
  if (
    pagesWithoutSidebar.includes(pathname) ||
    pathname.startsWith('/videochamada-teste/') ||
    pathname.match(/^\/agenda\/[^/]+\/video\/[^/]+/)
  ) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          'bg-white transition-all duration-300',
          isExpanded ? 'ml-64' : 'ml-16',
        )}
      >
        {children}
      </main>
    </>
  )
}

export default function MedicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard accessType="authenticated">
      <SidebarProvider>
        <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
      </SidebarProvider>
    </RouteGuard>
  )
}
