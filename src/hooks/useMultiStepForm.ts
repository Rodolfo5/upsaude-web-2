import { useState, useCallback } from 'react'

export interface UseMultiStepFormProps<T> {
  totalSteps: number
  initialData?: Partial<T>
  initialStep?: number
  onStepComplete?: (stepData: Partial<T>, step: number) => void
  onFormComplete?: (formData: T) => void
}

export function useMultiStepForm<T>({
  totalSteps,
  initialData = {},
  initialStep = 1,
  onStepComplete,
  onFormComplete,
}: UseMultiStepFormProps<T>) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<Partial<T>>(initialData)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const updateFormData = useCallback((stepData: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...stepData }))
  }, [])

  const goToNextStep = useCallback(
    (stepData: Partial<T>) => {
      updateFormData(stepData)
      setCompletedSteps((prev) => new Set([...prev, currentStep]))

      if (currentStep < totalSteps) {
        const nextStep = currentStep + 1
        // Salvar o progresso de forma assíncrona sem bloquear a navegação
        Promise.resolve(onStepComplete?.(stepData, nextStep)).catch((error) => {
          console.error('Erro ao salvar progresso:', error)
        })
        setCurrentStep(nextStep)
      } else {
        // Formulário completo
        const finalData = { ...formData, ...stepData } as T
        onFormComplete?.(finalData)
      }
    },
    [
      currentStep,
      formData,
      totalSteps,
      updateFormData,
      onStepComplete,
      onFormComplete,
    ],
  )

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step)
      }
    },
    [totalSteps],
  )

  const resetForm = useCallback(() => {
    setCurrentStep(1)
    setFormData(initialData)
    setCompletedSteps(new Set())
  }, [initialData])

  const isStepCompleted = useCallback(
    (step: number) => {
      return completedSteps.has(step)
    },
    [completedSteps],
  )

  const canGoToStep = useCallback(
    (step: number) => {
      return step === 1 || isStepCompleted(step - 1)
    },
    [isStepCompleted],
  )

  return {
    currentStep,
    totalSteps,
    formData,
    completedSteps,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetForm,
    isStepCompleted,
    canGoToStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
  }
}
