'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { errorToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import { useMultiStepForm } from '@/hooks/useMultiStepForm'
import {
  createUserWithEmailAndPasswordLocal,
  deleteOwnAccount,
} from '@/services/firebase/auth'
import {
  getUserProgressFromFirestore,
  saveUserProgressToFirestore,
} from '@/services/firestore/user'
import { createNewUserDoc } from '@/services/user'
import { UserRole } from '@/types/entities/user'
import { SignUpStep1Data } from '@/validations/signUpStep1'

import { Step1 } from './Step1/step1'

type SignUpFormData = SignUpStep1Data

interface SignUpFormProps {
  prefilledEmail?: string
}

export function SignUpForm({ prefilledEmail }: SignUpFormProps) {
  const { userUid, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)

  useEffect(() => {
    const loadUserProgress = async () => {
      if (authLoading.onAuthUserChanged) {
        return
      }

      if (userUid) {
        try {
          const userData = await getUserProgressFromFirestore(userUid)
          if (userData) {
            setCurrentUserId(userUid)
            if (userData.isCompleted) {
              router.replace('/dashboard')
              return
            }
            if (userData.currentStep && userData.currentStep > 1) {
              router.replace('/complete-registration')
            }
          }
        } catch (error) {
          console.error('Erro ao carregar progresso:', error)
        } finally {
          setIsLoadingProgress(false)
        }
      } else {
        setIsLoadingProgress(false)
      }
    }

    loadUserProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid, authLoading.onAuthUserChanged])

  const handleSaveStepData = useCallback(
    async (stepData: Partial<SignUpFormData>, step: number) => {
      try {
        const userIdToSave = currentUserId || userUid

        if (userIdToSave) {
          await saveUserProgressToFirestore(userIdToSave, stepData, step, false)
        }
      } catch (error) {
        console.error('Erro ao salvar progresso:', error)
      }
    },
    [currentUserId, userUid],
  )

  const { formData } = useMultiStepForm<SignUpFormData>({
    totalSteps: 1,
    initialStep: 1,
    onStepComplete: handleSaveStepData,
  })

  const handleStep1Next = useCallback(
    async (data: SignUpStep1Data) => {
      if (currentUserId || userUid) {
        router.replace('/complete-registration')
        return
      }

      setIsSubmitting(true)
      try {
        const { user, error } = await createUserWithEmailAndPasswordLocal(
          data.email,
          data.password,
        )

        if (error || !user?.uid) {
          errorToast(error || 'Erro ao criar autenticação')
          return
        }

        let fromQRCode = false
        let qrCodePatientId: string | undefined

        const callback = localStorage.getItem('medicalRecordCallback')
        if (callback) {
          try {
            const url = new URL(callback)
            const patientId = url.searchParams.get('patientId')
            if (patientId) {
              fromQRCode = true
              qrCodePatientId = patientId
            }
          } catch (e) {
            console.error('Error parsing QR Code callback:', e)
          }
        }

        const docResult = await createNewUserDoc({
          uid: user.uid,
          email: data.email,
          name: data.name,
          role: UserRole.DOCTOR,
          fromQRCode,
          qrCodePatientId,
        })

        if (docResult.error) {
          await deleteOwnAccount()
          errorToast('Erro ao criar perfil do usuário')
          return
        }

        setCurrentUserId(user.uid)
        router.replace('/complete-registration')
      } catch (error) {
        console.error('Erro ao criar usuário:', error)
        errorToast('Erro ao criar usuário')
      } finally {
        setIsSubmitting(false)
      }
    },
    [router, currentUserId, userUid],
  )

  const isFormLoading = isSubmitting

  if (isLoadingProgress) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    )
  }

  const renderCurrentStep = () => {
    const initialData = prefilledEmail
      ? { ...formData, email: prefilledEmail }
      : formData

    return (
      <Step1
        initialData={initialData}
        onNext={handleStep1Next}
        isLoading={isFormLoading}
        isAuthenticated={!!(currentUserId || userUid)}
        isEmailPrefilled={!!prefilledEmail}
      />
    )
  }

  return <div className="space-y-6">{renderCurrentStep()}</div>
}
