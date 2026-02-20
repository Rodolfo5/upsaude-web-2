'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { StepIndicator } from '@/components/atoms/StepIndicator/stepIndicator'
import InputField from '@/components/molecules/InputField/inputField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import signUpStep5Schema, { SignUpStep5Data } from '@/validations/signUpStep5'

interface Step5Props {
  initialData?: Partial<SignUpStep5Data>
  onSubmit: (data: SignUpStep5Data) => void
  onPrevious?: () => void
  isLoading?: boolean
  currentStep: number
  totalSteps: number
}

export function Step5({
  initialData,
  onSubmit,
  onPrevious,
  isLoading = false,
  currentStep,
  totalSteps,
}: Step5Props) {
  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<SignUpStep5Data>({
    mode: 'onChange',
    resolver: zodResolver(signUpStep5Schema),
    defaultValues: initialData,
  })

  const handleSubmitForm = (data: SignUpStep5Data) => {
    onSubmit(data)
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

        <InputField
          name="office.cep"
          control={control}
          label="CEP do consultório"
          type="text"
          placeholder="00000-000"
          maskType="cep"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            name="office.city"
            control={control}
            label="Cidade"
            type="text"
            placeholder="Digite a cidade"
            disabled={isLoading}
            className="transition-all duration-200"
          />

          <InputField
            name="office.state"
            control={control}
            label="Estado"
            type="text"
            placeholder="Digite o estado"
            disabled={isLoading}
            className="transition-all duration-200"
          />
        </div>

        <InputField
          name="office.neighborhood"
          control={control}
          label="Bairro"
          type="text"
          placeholder="Digite o bairro"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <InputField
          name="office.complement"
          control={control}
          label="Complemento"
          type="text"
          placeholder="Digite o complemento"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <InputField
          name="office.address"
          control={control}
          label="Endereço"
          type="text"
          placeholder="Digite o endereço do consultório"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <InputField
          name="office.phone"
          control={control}
          label="Telefone"
          type="text"
          placeholder="(00) 00000-0000"
          maskType="cellphone"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <InputField
          name="office.workingHours"
          control={control}
          label="Horário de funcionamento"
          type="text"
          placeholder="Ex: 08:00 às 18:00"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <TextareaField
          name="agenda"
          control={control}
          label="Informações da agenda (opcional)"
          placeholder="Informações adicionais sobre disponibilidade"
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            size="lg"
            className="flex-1 font-semibold"
            loading={isLoading}
            disabled={isLoading || !isValid}
          >
            {isLoading ? 'Finalizando...' : 'Concluir Cadastro'}
          </Button>
        </div>
      </form>
    </div>
  )
}
