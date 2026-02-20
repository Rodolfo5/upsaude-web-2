'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { StepIndicator } from '@/components/atoms/StepIndicator/stepIndicator'
import InputField from '@/components/molecules/InputField/inputField'
import signUpStep1Schema, { SignUpStep1Data } from '@/validations/signUpStep1'

interface Step1Props {
  initialData?: Partial<SignUpStep1Data>
  onNext: (data: SignUpStep1Data) => void | Promise<void>
  onPrevious?: () => void
  isLoading?: boolean
  isAuthenticated?: boolean
  isEmailPrefilled?: boolean
}

export function Step1({
  initialData,
  onNext,
  onPrevious,
  isLoading = false,
  isAuthenticated = false,
  isEmailPrefilled = false,
}: Step1Props) {
  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<SignUpStep1Data>({
    mode: 'onChange',
    resolver: zodResolver(signUpStep1Schema),
    defaultValues: initialData,
  })

  const handleSubmitForm = async (data: SignUpStep1Data) => {
    await onNext(data)
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <form
        onSubmit={handleSubmit(handleSubmitForm)}
        className="flex w-full min-w-0 flex-col gap-4"
      >
        <div className="flex min-w-0 items-start gap-2 pb-6">
          <div className="flex min-w-0 flex-col items-start gap-2">
            <h4 className="min-w-0 text-2xl font-bold text-[#530570] sm:text-3xl">
              Cadastre-se
            </h4>
            <span className="text-sm text-gray-600 sm:text-base">
              Sua jornada começa no Up Saúde!
            </span>
          </div>
        </div>
        <div className="pb-6">
          <StepIndicator currentStep={1} totalSteps={4} />
        </div>
        <InputField
          name="name"
          control={control}
          label="Nome completo"
          type="text"
          placeholder="Digite seu nome"
          required
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <InputField
          name="email"
          control={control}
          label="E-mail"
          type="text"
          placeholder="seu@email.com"
          required
          disabled={isLoading || isAuthenticated || isEmailPrefilled}
          className="transition-all duration-200"
        />
        {isEmailPrefilled && (
          <p className="-mt-2 text-xs text-gray-500">
            Este e-mail foi fornecido pelo convite e não pode ser alterado.
          </p>
        )}

        <InputField
          name="password"
          control={control}
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          required
          disabled={isLoading || isAuthenticated}
          className="transition-all duration-200"
        />

        <InputField
          name="confirmPassword"
          control={control}
          label="Confirmar senha"
          type="password"
          placeholder="Digite sua senha novamente"
          required
          disabled={isLoading || isAuthenticated}
          className="transition-all duration-200"
        />

        <div className="flex min-w-0 flex-wrap gap-3 pt-4">
          {onPrevious && (
            <Button
              type="button"
              variant="secondary-gray"
              size="lg"
              onClick={onPrevious}
              disabled={isLoading}
              className="min-w-0 flex-1"
            >
              ← Voltar
            </Button>
          )}

          <Button
            type="submit"
            size="lg"
            className="min-w-0 flex-1 font-semibold"
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
