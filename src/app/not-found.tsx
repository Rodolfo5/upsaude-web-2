'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
import { UserRole } from '@/types/entities/user'

export default function NotFoundPage() {
  const router = useRouter()
  const { userUid } = useAuth()
  const { currentUser } = useUser()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userUid) {
        router.replace('/login')
      } else if (currentUser?.role === UserRole.ADMIN) {
        router.replace('/admin/home')
      } else {
        router.replace('/admin/home')
      }
    }, 2000) // 2 segundos para mostrar a mensagem

    return () => clearTimeout(timer)
  }, [userUid, currentUser, router])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-red-600">
          404 - Página não encontrada
        </h1>
        <p className="mb-2 text-lg text-gray-700">
          Não encontramos a página que você tentou acessar.
        </p>
        <p className="text-gray-500">
          Estamos redirecionando você para a área correta...
        </p>
      </div>
    </div>
  )
}
