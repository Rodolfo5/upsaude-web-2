'use client'

import { Navbar } from '@/components/organisms/Navbar/navbar'
import RouteGuard from '@/router'

/**
 * 👨‍💼 LAYOUT PARA ADMINISTRADORES
 *
 * Layout específico para usuários com role ADMIN
 * - Proteção de rota para administradores
 * - Menu de navegação administrativo
 * - Estrutura de dashboard administrativo
 */

const adminMenuItems = [
  {
    label: 'Dashboard',
    href: '/admin/home',
  },
  {
    label: 'Usuários',
    href: '/admin/usuarios',
  },
  {
    label: 'Consultas',
    href: '/admin/consultas',
  },
  {
    label: 'Fila de Espera',
    href: '/admin/queue',
  },
  {
    label: 'Pagamentos',
    href: '/admin/pagamentos',
  },
  // {
  //   label: 'Configurações',
  //   href: '/admin/configuracoes',
  // },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard accessType="admin">
      <main className="flex h-screen w-full flex-col bg-white">
        <Navbar navItems={adminMenuItems} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </RouteGuard>
  )
}
