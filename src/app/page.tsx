'use client'

/**
 * Página inicial da aplicação (rota /).
 * Não exibe conteúdo: redireciona para login se não autenticado,
 * ou para a tela correta (dashboard, admin, etc.) se autenticado.
 */

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import LoadingComponent from '../components/atoms/Loading/loading'
import { errorToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
import { getRedirectPath } from '@/lib/getRedirectPath'
import { logout } from '@/services/firebase/auth'

export default function Home() {
  const router = useRouter()
  const { userUid, loading: authLoading, setUserUid } = useAuth()
  const { currentUser, loading: userLoading, refreshUser } = useUser()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    if (authLoading.onAuthUserChanged || userLoading.fetchCurrentUser) return

    if (!hasCheckedAuth && userUid && !currentUser) {
      setHasCheckedAuth(true)
      refreshUser()
      return
    }

    if (!userUid) {
      router.replace('/login')
      return
    }

    if (!currentUser) return

    const result = getRedirectPath(currentUser, '/', {
      onRejected: () => {
        errorToast(
          'Seu cadastro foi rejeitado. Entre em contato com o suporte.',
        )
        logout()
        setUserUid('')
      },
      onPendingLogout: () => {
        errorToast('Seu cadastro está sendo analisado. Aguarde a aprovação.')
        logout()
        setUserUid('')
      },
    })

    result.runSideEffects?.()
    if (result.path) {
      router.replace(result.path)
    }
  }, [
    userUid,
    currentUser,
    authLoading.onAuthUserChanged,
    userLoading.fetchCurrentUser,
    hasCheckedAuth,
    router,
    setUserUid,
    refreshUser,
  ])

  if (authLoading.onAuthUserChanged || userLoading.fetchCurrentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingComponent />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingComponent />
    </div>
  )
}
