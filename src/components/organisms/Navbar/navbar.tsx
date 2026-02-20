'use client'

import X from '@mui/icons-material/Close'
import LogoutIcon from '@mui/icons-material/Logout'
import Menu from '@mui/icons-material/Menu'
import UserIcon from '@mui/icons-material/Person'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useUser from '@/hooks/useUser'
import { cn } from '@/lib/utils'
import { logout } from '@/services/firebase/auth'
import { UserRole } from '@/types/entities/user'

import { NavbarProps, NavItem } from './types'

// --- Sub-componentes para melhor organização ---

// Menu de links para Desktop
function NavLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav className="hidden items-center gap-6 md:flex">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

// Menu de Ações (Login/Logout/Perfil)
function UserMenu() {
  const { currentUser } = useUser()
  const user = currentUser
  const router = useRouter()

  // Se não estiver logado, não renderiza nada
  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()

    if (user.role === UserRole.ADMIN) {
      router.push('/admin-login')
    } else {
      router.push('/login')
    }
  }

  // Se for ADMIN, renderiza um botão simples de Logout
  if (user.role === UserRole.ADMIN) {
    return (
      <Button variant="default" onClick={handleLogout}>
        Sair
      </Button>
    )
  }

  // Se for USER, renderiza o Dropdown com Avatar
  if (user.role === UserRole.DOCTOR) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {/* <AvatarImage src={user.photoURL || ''} alt={user.name || ''} /> */}
              <AvatarFallback className="bg-blue-300">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <div className="flex w-full cursor-pointer items-center gap-2 rounded-lg hover:bg-blue-50">
              <LogoutIcon fontSize="small" />
              <span>Sair</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return null
}

// --- Componente Principal da Navbar ---

export function Navbar({ navItems }: NavbarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 flex w-full items-center border-b bg-slate-100">
      <div className="flex w-full items-center justify-between px-10 py-4">
        <Link href="/" className="font-bold">
          <Image src="/LogoUPsaude1.png" alt="Logo" width={50} height={50} />
        </Link>

        <NavLinks items={navItems} pathname={pathname} />

        <div className="flex items-center">
          <div className="hidden md:block">
            <UserMenu />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
            <span className="sr-only">Abrir menu</span>
          </Button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="container flex flex-col gap-4 pb-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2">
            <UserMenu />
          </div>
        </div>
      )}
    </nav>
  )
}
