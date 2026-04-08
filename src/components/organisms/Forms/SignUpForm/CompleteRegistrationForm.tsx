'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { useMemedRegisterDoctor } from '@/hooks/queries/useMemedRegisterDoctor'
// import { useMemedValidateCrm } from '@/hooks/queries/useMemedValidateCrm'
import { errorToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import { useMultiStepForm } from '@/hooks/useMultiStepForm'
import { checkCrmInUse } from '@/services/doctor'
import {
  getUserProgressFromFirestore,
  saveUserProgressToFirestore,
  saveOffice,
} from '@/services/firestore/user'
import { SignUpStep2Data } from '@/validations/signUpStep2'
import { SignUpStep3Data } from '@/validations/signUpStep3'
import { SignUpStep4Data } from '@/validations/signUpStep4'

import { SignUpSuccess } from './SignUpSuccess/signUpSuccess'
import { Step2 } from './Step2/step2'
import { Step3 } from './Step3/step3'
import { Step4 } from './Step4/step4'

type CompleteRegistrationData = SignUpStep2Data &
  SignUpStep3Data &
  SignUpStep4Data

export function CompleteRegistrationForm() {
  const { userUid, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [initialStep, setInitialStep] = useState(1)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [prefilledData, setPrefilledData] = useState<
    Partial<CompleteRegistrationData>
  >({})
  const { mutateAsync: registerDoctorInMemed } = useMemedRegisterDoctor()
  // const { mutateAsync: validateCrm } = useMemedValidateCrm()
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
              router.push('/dashboard')
              return
            }

            const savedStep = userData.currentStep || 1

            // O step local começa em 1, então usamos o savedStep diretamente
            // mas garantimos que seja no mínimo 1
            const calculatedInitialStep = Math.max(savedStep, 1)

            setInitialStep(calculatedInitialStep)

            if (userData.cpf) prefilledData.cpf = userData.cpf
            if (userData.birthDate) {
              prefilledData.birthDate =
                typeof userData.birthDate === 'string'
                  ? new Date(userData.birthDate)
                  : userData.birthDate
            }
            if (userData.state) prefilledData.state = userData.state
          }
          setPrefilledData({ ...prefilledData })
        } catch (error) {
          console.error('Erro ao carregar progresso:', error)
        } finally {
          setIsLoadingProgress(false)
        }
      } else {
        router.push('/cadastro')
      }
    }

    loadUserProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUid, authLoading.onAuthUserChanged])

  const handleSaveStepData = useCallback(
    async (stepData: Partial<CompleteRegistrationData>, step: number) => {
      try {
        const userIdToSave = currentUserId || userUid

        if (userIdToSave) {
          const firestoreStep = step

          await saveUserProgressToFirestore(
            userIdToSave,
            stepData,
            firestoreStep,
            false,
          )

          // Não forçar refresh aqui para evitar re-render que impede o avanço
          // O refresh será feito naturalmente quando necessário
        }
      } catch (error) {
        console.error('Erro ao salvar progresso:', error)
      }
    },
    [currentUserId, userUid],
  )

  const { currentStep, totalSteps, formData, goToNextStep, goToPreviousStep } =
    useMultiStepForm<CompleteRegistrationData>({
      totalSteps: 3,
      initialStep,
      initialData: prefilledData,
      onStepComplete: handleSaveStepData,
      onFormComplete: handleFormComplete,
    })

  async function handleFormComplete(data: CompleteRegistrationData) {
    setIsSubmitting(true)
    try {
      const userIdToSave = currentUserId || userUid

      if (!userIdToSave) {
        throw new Error('Usuário não autenticado')
      }

      const completeUserData = {
        ...data,
      }

      await saveUserProgressToFirestore(userIdToSave, completeUserData, 4, true)

      // Registrar na Memed se for médico com CRM
      if (
        data.typeOfCredential === 'CRM' &&
        data.credential &&
        data.credentialState
      ) {
        try {
          // Limpar CRM (remover caracteres não numéricos)
          const cleanCrm = data.credential.replace(/\D/g, '')
          const upperCrmState = data.credentialState.toUpperCase()

          // 1. VALIDAÇÃO LOCAL: Verificar se o CRM está em uso no sistema local
          // IMPORTANTE: Excluir o próprio usuário da verificação, pois o CRM já foi salvo
          // no Firestore durante as etapas anteriores

          const crmInUseCheck = await checkCrmInUse(
            cleanCrm,
            upperCrmState,
            userIdToSave,
          )

          if (crmInUseCheck.inUse) {
            const errorMsg = 'CRM já está sendo usado por outro médico'
            errorToast(errorMsg)
            setIsSubmitting(false)
            return
          }

          // Buscar dados completos do usuário para obter name e email
          const userData = await getUserProgressFromFirestore(userIdToSave)

          if (userData) {
            // Extrair name e surname do campo name
            const fullName = userData.name || ''
            const nameParts = fullName.trim().split(/\s+/)
            const name = nameParts[0] || fullName
            const surname = nameParts.slice(1).join(' ') || ''

            // Formatar data de nascimento para dd/mm/YYYY
            let formattedBirthDate: string | undefined
            if (data.birthDate) {
              const birthDate =
                data.birthDate instanceof Date
                  ? data.birthDate
                  : new Date(data.birthDate)

              if (!isNaN(birthDate.getTime())) {
                const day = String(birthDate.getDate()).padStart(2, '0')
                const month = String(birthDate.getMonth() + 1).padStart(2, '0')
                const year = birthDate.getFullYear()
                formattedBirthDate = `${day}/${month}/${year}`
              }
            }

            // 2. TENTAR CADASTRAR NA MEMED
            const memedResult = await registerDoctorInMemed({
              externalId: userIdToSave,
              name,
              surname,
              email: userData.email || '',
              cpf: data.cpf || '',
              birthDate: formattedBirthDate || '',
              crm: cleanCrm,
              crmState: upperCrmState,
            })

            // 3. VERIFICAR RESULTADO DO CADASTRO
            if (memedResult.success && memedResult.memedId) {
              // 3a. SUCESSO: Novo médico cadastrado na Memed

              // Salvar memedId, token e status de registro no Firestore
              await saveUserProgressToFirestore(
                userIdToSave,
                {
                  memedId: memedResult.memedId,
                  memedRegistered: true,
                  ...(memedResult.prescriberToken && {
                    token: memedResult.prescriberToken,
                  }),
                },
                4, // Mantém o step 4
                true, // Mantém isCompleted como true
              )
            } else {
              // 3b. ERRO: Verificar se é porque o médico já existe na Memed
              const errorMessage = memedResult.error || ''
              const errorText = errorMessage.toLowerCase()
              const alreadyExists =
                errorText.includes('já existe') ||
                errorText.includes('already exists') ||
                errorText.includes('já exi') ||
                errorText.includes('duplicate') ||
                errorText.includes('duplicado')

              if (alreadyExists) {
                // 4. MÉDICO JÁ EXISTE NA MEMED: Buscar memedId existente e vincular
                try {
                  // Buscar memedId usando múltiplas estratégias (CRM+UF, external_id, CPF)
                  const memedIdResponse = await fetch(
                    '/api/memed/get-doctor-memed-id',
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        crm: cleanCrm,
                        crmState: upperCrmState,
                        externalId: userIdToSave, // Tenta também pelo external_id
                        cpf: data.cpf?.replace(/\D/g, ''),
                      }),
                    },
                  )

                  const memedIdResult = await memedIdResponse.json()

                  if (memedIdResult.found && memedIdResult.memedId) {
                    await saveUserProgressToFirestore(
                      userIdToSave,
                      {
                        memedId: memedIdResult.memedId,
                        memedRegistered: true,
                      },
                      4,
                      true,
                    )
                  } else {
                    await saveUserProgressToFirestore(
                      userIdToSave,
                      {
                        memedRegistered: false,
                        memedNote:
                          'Médico já existe na Memed (não foi possível obter memedId)',
                      },
                      4,
                      true,
                    )
                  }
                } catch (validationError) {
                  console.error(
                    '❌ Erro ao buscar médico existente na Memed:',
                    {
                      timestamp: new Date().toISOString(),
                      crm: cleanCrm,
                      crmState: upperCrmState,
                      error:
                        validationError instanceof Error
                          ? validationError.message
                          : 'Erro desconhecido',
                    },
                  )
                  await saveUserProgressToFirestore(
                    userIdToSave,
                    {
                      memedRegistered: false,
                      memedNote:
                        'Médico já existe na Memed (erro ao buscar memedId)',
                    },
                    4,
                    true,
                  )
                }
              } else {
                // 3c. OUTRO ERRO: Não foi possível cadastrar e não é "já existe"
                console.warn(
                  '⚠️ Médico criado na plataforma, mas falha ao registrar na Memed:',
                  {
                    timestamp: new Date().toISOString(),
                    crm: cleanCrm,
                    crmState: upperCrmState,
                    error: errorMessage,
                    userId: userIdToSave,
                    message:
                      'Cadastro na Memed falhou, mas médico foi criado na plataforma',
                  },
                )
                // Não bloqueia o cadastro - médico é criado mesmo se Memed falhar
              }
            }
          }
        } catch (memedError) {
          // Erro não bloqueante - apenas log
          console.error('Erro ao registrar médico na Memed:', memedError)
          // Não mostrar erro para o usuário, pois o cadastro foi concluído
        }
      }

      setIsFormSubmitted(true)
    } catch (error) {
      console.error('Erro ao completar cadastro:', error)
      errorToast('Erro ao completar cadastro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep2Next = useCallback(
    (data: SignUpStep2Data) => {
      goToNextStep(data)
    },
    [goToNextStep],
  )

  const handleStep3Next = useCallback(
    (data: SignUpStep3Data) => {
      goToNextStep(data)
    },
    [goToNextStep],
  )

  const handleStep4Submit = useCallback(
    async (data: SignUpStep4Data) => {
      try {
        const userIdToSave = currentUserId || userUid

        if (userIdToSave && data.office) {
          await saveOffice(userIdToSave, data.office)
        }

        goToNextStep(data)
      } catch (error) {
        console.error('Erro ao salvar dados do consultório:', error)
        errorToast('Erro ao salvar dados do consultório')
      }
    },
    [currentUserId, userUid, goToNextStep],
  )

  const isFormLoading = isSubmitting || isLoadingProgress

  if (isLoadingProgress) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    )
  }

  const renderCurrentStep = () => {
    const globalStep = currentStep + 1

    switch (currentStep) {
      case 1:
        return (
          <Step2
            initialData={formData}
            onNext={handleStep2Next}
            onPrevious={goToPreviousStep}
            isLoading={isFormLoading}
            currentStep={globalStep}
            totalSteps={totalSteps + 1}
          />
        )
      case 2:
        return (
          <Step3
            initialData={formData}
            onNext={handleStep3Next}
            onPrevious={goToPreviousStep}
            isLoading={isFormLoading}
            currentStep={globalStep}
            totalSteps={totalSteps + 1}
            currentUserId={currentUserId || userUid}
          />
        )
      case 3:
        return (
          <Step4
            initialData={formData}
            onSubmit={handleStep4Submit}
            onPrevious={goToPreviousStep}
            isLoading={isFormLoading}
            currentStep={globalStep}
            totalSteps={totalSteps + 1}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {isFormSubmitted ? <SignUpSuccess /> : renderCurrentStep()}
    </div>
  )
}
