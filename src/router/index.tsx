'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { errorToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
import { getRedirectPath } from '@/lib/getRedirectPath'
import { logout } from '@/services/firebase/auth'
import { DoctorEntity, UserRole, UserStatus } from '@/types/entities/user'
import { SUPER_ADMIN_EMAIL } from '@/constants/generic'

interface RouteGuardProps {
  children: React.ReactNode
  accessType: 'public' | 'authenticated' | 'admin'
}

export default function RouteGuard({ children, accessType }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { userUid, loading, setUserUid } = useAuth()
  const { currentUser, loading: userLoading, refreshUser } = useUser()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const isHandlingAdminPublicLogin = useRef(false)

  // Otimização: calcular permissão de forma síncrona para evitar flash de loading
  // durante navegação interna (quando auth já está resolvido)
  const isAuthResolved = !loading.onAuthUserChanged && !userLoading.fetchCurrentUser

  const computeAllowed = (): boolean => {
    if (!isAuthResolved) return false

    const isLoginFlowInProgress =
      loading.loginWithInternalService ||
      loading.loginWithGoogle ||
      loading.loginWithApple

    if (
      accessType === 'public' &&
      pathname === '/login' &&
      userUid &&
      currentUser?.role === UserRole.ADMIN &&
      !isLoginFlowInProgress
    ) {
      return false
    }

    switch (accessType) {
      case 'public':
        return !userUid

      case 'authenticated': {
        const isDoctor = currentUser?.role === UserRole.DOCTOR
        if (!userUid || !isDoctor) return false

        if (currentUser?.status === UserStatus.APPROVED) return true

        if (currentUser?.status === UserStatus.PENDING) {
          if (!currentUser.isCompleted && pathname === '/complete-registration')
            return true
          if (pathname === '/complete-registration') return true
        }

        return false
      }

      case 'admin':
        return (
          !!userUid &&
          (currentUser?.role === UserRole.ADMIN ||
            currentUser?.email === SUPER_ADMIN_EMAIL)
        )
    }

    return false
  }

  const isAllowed = computeAllowed()

  // Check if user came from QR Code (using Firebase flag)
  const isFromQRCode = (): boolean => {
    const doctor = currentUser as DoctorEntity | null
    return doctor?.fromQRCode === true
  }

  // Get the patient ID from QR Code (from Firebase or localStorage as fallback)
  const getQRCodePatientId = (): string | null => {
    // First, try to get from Firebase
    const doctor = currentUser as DoctorEntity | null
    if (doctor?.qrCodePatientId) {
      return doctor.qrCodePatientId
    }

    // Fallback to localStorage
    if (typeof window === 'undefined') return null
    const callback = localStorage.getItem('medicalRecordCallback')
    if (!callback) return null

    try {
      const url = new URL(callback)
      return url.searchParams.get('patientId')
    } catch {
      return null
    }
  }

  // Check if user is accessing their QR Code patient's medical record
  const isAccessingQRCodePatientRecord = (): boolean => {
    const qrCodePatientId = getQRCodePatientId()
    if (!qrCodePatientId) return false
    return pathname === `/medical-record/${qrCodePatientId}`
  }

  const getCorrectRedirectPath = (): string | null => {
    const result = getRedirectPath(currentUser, pathname, {
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
    return result.path
  }

  const redirectAdminToAdminLogin = async () => {
    if (isHandlingAdminPublicLogin.current) return

    isHandlingAdminPublicLogin.current = true

    try {
      await logout()
      setUserUid('')
      errorToast(
        'Administradores devem acessar pela pagina de login administrativo.',
      )
    } catch (error) {
      console.error('Erro ao deslogar admin da rota /login:', error)
    } finally {
      router.replace('/admin-login')
    }
  }

  useEffect(() => {
    // Wait until auth state and user data are loaded
    if (loading.onAuthUserChanged || userLoading.fetchCurrentUser) return

    // Force refresh user data on first check after auth is ready
    if (!hasCheckedAuth && userUid && !currentUser) {
      setHasCheckedAuth(true)
      refreshUser()
      return
    }

    const isLoginFlowInProgress =
      loading.loginWithInternalService ||
      loading.loginWithGoogle ||
      loading.loginWithApple

    // Handle redirects for unauthorized access
    if (
      accessType === 'public' &&
      pathname === '/login' &&
      userUid &&
      currentUser?.role === UserRole.ADMIN &&
      !isLoginFlowInProgress
    ) {
      redirectAdminToAdminLogin().catch(() => undefined)
      return
    }

    if (!isAllowed) {
      if (accessType === 'public' && userUid && currentUser) {
        const correctPath = getCorrectRedirectPath()
        if (correctPath) {
          router.replace(correctPath)
        }
      } else if (accessType === 'authenticated') {
        if (!userUid) {
          router.replace('/login')
        } else if (currentUser?.role === UserRole.ADMIN) {
          router.replace('/admin/home')
        } else if (currentUser?.role === UserRole.DOCTOR) {
          const correctPath = getCorrectRedirectPath()
          if (correctPath) {
            router.replace(correctPath)
          }
        }
      } else if (
        accessType === 'admin' &&
        (!userUid ||
          (currentUser?.role !== UserRole.ADMIN &&
            currentUser?.email !== SUPER_ADMIN_EMAIL))
      ) {
        router.replace('/admin-login')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userUid,
    currentUser,
    loading.onAuthUserChanged,
    userLoading.fetchCurrentUser,
    accessType,
    pathname,
    hasCheckedAuth,
    isAllowed,
  ])

  if (loading.onAuthUserChanged || userLoading.fetchCurrentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingComponent />
      </div>
    )
  }

  return isAllowed ? <>{children}</> : null
}
