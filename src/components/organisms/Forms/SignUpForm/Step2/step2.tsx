'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { StepIndicator } from '@/components/atoms/StepIndicator/stepIndicator'
import BirthDatePickerField from '@/components/molecules/BirthDatePickerField/birthDatePickerField'
import InputField from '@/components/molecules/InputField/inputField'
import ProfileImageField from '@/components/molecules/ProfileImageField/profileImageField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import { logout } from '@/services/firebase/auth'
import signUpStep2Schema, { SignUpStep2Data } from '@/validations/signUpStep2'

interface Step2Props {
  initialData?: Partial<SignUpStep2Data>
  onNext: (data: SignUpStep2Data) => void
  onPrevious?: () => void
  isLoading?: boolean
  currentStep: number
  totalSteps: number
}

export const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

export function Step2({
  initialData,
  onNext,
  onPrevious,
  isLoading = false,
  currentStep,
  totalSteps,
}: Step2Props) {
  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid },
  } = useForm<SignUpStep2Data>({
    mode: 'onChange',
    resolver: zodResolver(signUpStep2Schema),
    defaultValues: initialData,
  })

  const minibioValue = watch('minibio') || ''

  const handleSubmitForm = (data: SignUpStep2Data) => {
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
              onClick={logout}
              className="cursor-pointer text-lg text-purple-600 transition-colors hover:text-purple-600"
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
        <ProfileImageField
          name="profileImage"
          control={control}
          label="Foto de perfil"
          disabled={isLoading}
          className="transition-all duration-200"
        />
        <div className="flex flex-col gap-1">
          <TextareaField
            name="minibio"
            control={control}
            label="Minibio"
            placeholder="Escreva uma breve descrição sobre você"
            disabled={isLoading}
            maxLength={200}
            rows={4}
            className="transition-all duration-200"
          />
          <span className="text-xs text-gray-500">
            {minibioValue.length}/200 caracteres
          </span>
        </div>
        <InputField
          name="cpf"
          control={control}
          label="CPF"
          type="text"
          placeholder="000.000.000-00"
          maskType="cpf"
          required
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <BirthDatePickerField
          name="birthDate"
          control={control}
          label="Data de nascimento"
          placeholder="Selecione sua data de nascimento"
          required
          disabled={isLoading}
          className="transition-all duration-200"
        />

        <SelectField
          name="state"
          control={control}
          placeholder="Selecione seu estado"
          options={brazilianStates}
          label="Estado"
          disabled={isLoading}
          className="text-gray-700 transition-all duration-200"
        />

        <div className="flex gap-3 pt-4">
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
