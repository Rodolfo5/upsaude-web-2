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

interface RouteGuardProps {
  children: React.ReactNode
  accessType: 'public' | 'authenticated' | 'admin'
}

export default function RouteGuard({ children, accessType }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { userUid, loading, setUserUid } = useAuth()
  const { currentUser, loading: userLoading, refreshUser } = useUser()
  const [isAllowed, setIsAllowed] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const isHandlingAdminPublicLogin = useRef(false)

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
      errorToast('Administradores devem acessar pela pagina de login administrativo.')
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
    // This ensures we have the latest data from Firestore
    if (!hasCheckedAuth && userUid && !currentUser) {
      setHasCheckedAuth(true)
      refreshUser()
      return
    }

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
      setIsAllowed(false)
      void redirectAdminToAdminLogin()
      return
    }

    let allowed = false

    switch (accessType) {
      case 'public':
        allowed = !userUid
        break

      case 'authenticated': {
        const isDoctor = currentUser?.role === UserRole.DOCTOR
        if (!userUid || !isDoctor) {
          allowed = false
          break
        }

        // Approved doctors have full access
        if (currentUser?.status === UserStatus.APPROVED) {
          allowed = true
          break
        }

        // Pending doctors...
        if (currentUser?.status === UserStatus.PENDING) {
          // Can access complete-registration if not completed
          if (
            !currentUser.isCompleted &&
            pathname === '/complete-registration'
          ) {
            allowed = true
            break
          }

          // If from QR Code, can access the patient's medical record
          // (regardless of isCompleted status - they just completed the form)
          if (isFromQRCode() && isAccessingQRCodePatientRecord()) {
            allowed = true
            break
          }

          // Also allow staying on complete-registration even if completed
          // (to show the success screen)
          if (pathname === '/complete-registration') {
            allowed = true
            break
          }
        }

        allowed = false
        break
      }

      case 'admin':
        allowed = !!userUid && currentUser?.role === UserRole.ADMIN
        break
    }

    setIsAllowed(allowed)

    // Redirect if not allowed
    if (!allowed) {
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
        (!userUid || currentUser?.role !== UserRole.ADMIN)
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
