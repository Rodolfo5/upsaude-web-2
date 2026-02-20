'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { errorToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
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
    if (!currentUser) return null

    const qrCodePatientId = getQRCodePatientId()

    if (currentUser.status === UserStatus.REJECTED) {
      errorToast('Seu cadastro foi rejeitado. Entre em contato com o suporte.')
      logout()
      setUserUid('')
      return '/login'
    }

    const isDoctor = currentUser.role === UserRole.DOCTOR

    if (isDoctor && currentUser.status === UserStatus.PENDING) {
      const needsToCompleteRegistration =
        !currentUser.isCompleted ||
        (currentUser.currentStep && currentUser.currentStep < 4)

      if (needsToCompleteRegistration) {
        return '/complete-registration'
      } else {
        // User completed registration but is pending approval
        // If from QR Code, redirect to medical record
        if (isFromQRCode() && qrCodePatientId) {
          return `/medical-record/${qrCodePatientId}`
        }
        // If already on complete-registration (showing success), stay there
        if (pathname === '/complete-registration') {
          return null // Don't redirect, let them see the success screen
        }
        // Otherwise, logout and show message
        errorToast('Seu cadastro está sendo analisado. Aguarde a aprovação.')
        logout()
        setUserUid('')
        return '/login'
      }
    }

    if (currentUser.status === UserStatus.APPROVED) {
      // If from QR Code, redirect to medical record first
      if (qrCodePatientId) {
        return `/medical-record/${qrCodePatientId}`
      }

      if (currentUser.role === UserRole.DOCTOR) {
        const hasAgendaConfiguration = currentUser.agenda != null

        if (!hasAgendaConfiguration) {
          return '/configure-agenda'
        } else {
          return '/dashboard'
        }
      } else if (currentUser.role === UserRole.ADMIN) {
        return '/admin/home'
      } else {
        return '/dashboard'
      }
    }

    if (currentUser.role === UserRole.ADMIN) {
      return '/admin/home'
    }

    return '/login'
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
