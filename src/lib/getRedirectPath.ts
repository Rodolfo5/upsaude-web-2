'use client'

import {
  DoctorEntity,
  UserEntity,
  UserRole,
  UserStatus,
} from '@/types/entities/user'

function getQRCodePatientId(currentUser: UserEntity | null): string | null {
  const doctor = currentUser as DoctorEntity | null
  if (doctor?.qrCodePatientId) return doctor.qrCodePatientId
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

function isFromQRCode(currentUser: UserEntity | null): boolean {
  const doctor = currentUser as DoctorEntity | null
  return doctor?.fromQRCode === true
}

export interface GetRedirectPathResult {
  path: string | null
  runSideEffects?: () => void
}

export interface GetRedirectPathCallbacks {
  onRejected: () => void
  onPendingLogout: () => void
}

/**
 * Calculates the correct redirect path for an authenticated user.
 * Returns the path and optional side effects (logout, toast) to run when redirecting to login.
 */
export function getRedirectPath(
  currentUser: UserEntity | null,
  pathname: string,
  callbacks: GetRedirectPathCallbacks,
): GetRedirectPathResult {
  if (!currentUser) return { path: null }

  const qrCodePatientId = getQRCodePatientId(currentUser)

  if (currentUser.status === UserStatus.REJECTED) {
    return {
      path: '/login',
      runSideEffects: callbacks.onRejected,
    }
  }

  const isDoctor = currentUser.role === UserRole.DOCTOR

  if (isDoctor && currentUser.status === UserStatus.PENDING) {
    const needsToCompleteRegistration =
      !currentUser.isCompleted ||
      (currentUser.currentStep != null && currentUser.currentStep < 4)

    if (needsToCompleteRegistration) {
      return { path: '/complete-registration' }
    }

    if (isFromQRCode(currentUser) && qrCodePatientId) {
      return { path: `/medical-record/${qrCodePatientId}` }
    }
    if (pathname === '/complete-registration') {
      return { path: null }
    }
    return {
      path: '/login',
      runSideEffects: callbacks.onPendingLogout,
    }
  }

  if (currentUser.status === UserStatus.APPROVED) {
    if (qrCodePatientId) {
      return { path: `/medical-record/${qrCodePatientId}` }
    }
    if (currentUser.role === UserRole.DOCTOR) {
      const hasAgendaConfiguration = currentUser.agenda != null
      return {
        path: hasAgendaConfiguration ? '/dashboard' : '/configure-agenda',
      }
    }
    if (currentUser.role === UserRole.ADMIN) {
      return { path: '/admin/home' }
    }
    return { path: '/dashboard' }
  }

  if (currentUser.role === UserRole.ADMIN) {
    return { path: '/admin/home' }
  }

  return { path: '/login' }
}
