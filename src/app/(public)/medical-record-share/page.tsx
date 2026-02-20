'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
import { UserRole, UserStatus } from '@/types/entities/user'

export default function MedicalRecordSharePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userUid, loading: authLoading } = useAuth()
  const { currentUser, loading: userLoading, refreshUser } = useUser()

  const patientId = searchParams.get('patientId')
  const token = searchParams.get('token')

  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [hasRefreshedUser, setHasRefreshedUser] = useState(false)

  useEffect(() => {
    if (!patientId || !token) {
      setIsValid(false)
      return
    }
    // TODO: Validate token if needed, for now assume valid
    setIsValid(true)
  }, [patientId, token])

  useEffect(() => {
    if (
      authLoading.onAuthUserChanged ||
      userLoading.fetchCurrentUser ||
      isValid === null
    )
      return

    // Force refresh user data once to get latest from Firestore
    if (userUid && !hasRefreshedUser && !currentUser) {
      setHasRefreshedUser(true)
      refreshUser()
      return
    }

    // Save callback to localStorage for use after registration
    const currentUrl = window.location.href
    localStorage.setItem('medicalRecordCallback', currentUrl)

    if (!userUid) {
      // Not logged in, redirect to login with callback
      const encodedCallback = encodeURIComponent(currentUrl)
      router.replace(`/login?callback=${encodedCallback}`)
      return
    }

    if (currentUser?.role !== UserRole.DOCTOR) {
      // Not a doctor, redirect to login
      router.replace('/login')
      return
    }

    // User is logged in and is a doctor
    // Check if user is approved or pending (pending users can also view from QR Code)
    if (
      currentUser.status === UserStatus.APPROVED ||
      (currentUser.status === UserStatus.PENDING && currentUser.isCompleted)
    ) {
      // Redirect to the actual medical record page
      router.replace(`/medical-record/${patientId}`)
    } else if (
      currentUser.status === UserStatus.PENDING &&
      !currentUser.isCompleted
    ) {
      // User still needs to complete registration
      router.replace('/complete-registration')
    } else {
      // Other status (rejected, etc.)
      router.replace('/login')
    }
  }, [
    userUid,
    currentUser,
    authLoading.onAuthUserChanged,
    userLoading.fetchCurrentUser,
    isValid,
    patientId,
    router,
    hasRefreshedUser,
    refreshUser,
  ])

  if (
    authLoading.onAuthUserChanged ||
    userLoading.fetchCurrentUser ||
    isValid === null
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingComponent />
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Link Inválido</h1>
          <p className="text-gray-600">O link fornecido não é válido.</p>
        </div>
      </div>
    )
  }

  return null // Should redirect
}
