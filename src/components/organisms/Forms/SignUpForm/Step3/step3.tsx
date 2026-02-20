'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material'
import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { StepIndicator } from '@/components/atoms/StepIndicator/stepIndicator'
import FileUploadField from '@/components/molecules/FileUploadField/fileUploadField'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import { credentialTypes } from '@/constants/options'
import { getSpecialtiesForCredential } from '@/utils/specialtyHelpers'
import signUpStep3Schema, { SignUpStep3Data } from '@/validations/signUpStep3'

import { brazilianStates } from '../../SignUpForm/Step2/step2'

interface Step3Props {
  initialData?: Partial<SignUpStep3Data>
  onNext: (data: SignUpStep3Data) => void
  onPrevious?: () => void
  isLoading?: boolean
  currentStep: number
  totalSteps: number
  currentUserId?: string | null
}

export function Step3({
  initialData,
  onNext,
  onPrevious,
  isLoading = false,
  currentStep,
  totalSteps,
}: Step3Props) {
  const {
    handleSubmit,
    control,
    formState: { isValid },
    setValue,
    watch,
  } = useForm<SignUpStep3Data>({
    mode: 'onChange',
    resolver: zodResolver(signUpStep3Schema),
    defaultValues: initialData,
  })

  const typeOfCredential = watch('typeOfCredential')
  const credentialState = watch('credentialState')
  // Mantemos apenas os watchers necessários

  const isCrmSelected = typeOfCredential === 'CRM'

  const filteredSpecialties = useMemo(
    () => getSpecialtiesForCredential(typeOfCredential),
    [typeOfCredential],
  )

  // Limpar credentialState quando mudar o tipo de credencial
  useEffect(() => {
    if (!isCrmSelected && credentialState) {
      setValue('credentialState', undefined)
    }
  }, [isCrmSelected, credentialState, setValue])

  const previousCredentialRef = useRef<string | undefined>(undefined)
  // Limpar especialidade quando o usuário mudar o tipo de credencial (evita valor inválido)
  useEffect(() => {
    const prev = previousCredentialRef.current
    previousCredentialRef.current = typeOfCredential
    if (prev !== undefined && prev !== typeOfCredential && typeOfCredential) {
      setValue('specialty', '')
    }
  }, [typeOfCredential, setValue])

  const handleSubmitForm = (data: SignUpStep3Data) => {
    // Nota: Removida validação que bloqueava o avanço quando o tipo fosse CRM.
    // A validação/registro na Memed acontece durante a aprovação pelo admin.

    onNext(data)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <form
        onSubmit={handleSubmit(handleSubmitForm)}
        className="flex w-full flex-col gap-4"
      >
        <div className="flex items-start gap-2 pb-6">
          {onPrevious && (
            <span
              onClick={onPrevious}
              className="cursor-pointer text-sm text-purple-600 transition-colors hover:text-purple-600"
            >
              <ArrowLeftIcon fontSize="large" />
            </span>
          )}
          <div className="flex flex-col items-start gap-2">
            <h4 className="text-3xl font-bold text-[#530570]">Cadastre-se</h4>
            <span className="text-md mb-32 text-gray-600">
              Sua jornada começa no Up Saúde!
            </span>
          </div>
        </div>

        <div className="pb-6">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>
        <SelectField
          name="typeOfCredential"
          control={control}
          placeholder="Conselho"
          options={credentialTypes}
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <div className="relative">
          <InputField
            name="credential"
            control={control}
            label={isCrmSelected ? 'CRM' : 'Credencial'}
            type="text"
            placeholder={
              isCrmSelected
                ? 'Digite o número do CRM'
                : 'Digite o número da sua credencial'
            }
            required
            disabled={isLoading}
            className="transition-all duration-200"
            variant={'default'}
          />
          {/* Não mostramos validação de CRM no cliente; a checagem/registro é feita no fluxo de aprovação do admin. */}
        </div>

        {isCrmSelected && (
          <SelectField
            name="credentialState"
            control={control}
            placeholder="Estado do CRM"
            options={brazilianStates}
            label="Estado do CRM"
            disabled={isLoading}
            className="transition-all duration-200"
          />
        )}

        <SelectField
          name="specialty"
          control={control}
          placeholder="Especialidade"
          options={filteredSpecialties}
          disabled={isLoading || !typeOfCredential}
          className="transition-all duration-200"
        />

        <FileUploadField
          name="credentialDocument"
          control={control}
          label="Imagem ou PDF da credencial"
          onFileSelect={(value) => {
            setValue('credentialDocument', value as string)
          }}
          loading={isLoading}
          disabled={isLoading}
        />

        <div className="flex gap-3 pt-4">
          {onPrevious && (
            <Button
              type="button"
              variant="secondary-gray"
              size="lg"
              onClick={onPrevious}
              disabled={isLoading}
              className="flex-1"
            >
              ← Voltar
            </Button>
          )}

          <Button
            type="submit"
            size="lg"
            className="flex-1 font-semibold"
            loading={isLoading}
            disabled={isLoading || !isValid}
          >
            Próximo →
          </Button>
        </div>
      </form>
    </div>
  )
}
