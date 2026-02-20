'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft as ArrowLeftIcon } from '@mui/icons-material'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { StepIndicator } from '@/components/atoms/StepIndicator/stepIndicator'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import signUpStep4Schema, { SignUpStep4Data } from '@/validations/signUpStep4'

interface Step4Props {
  initialData?: Partial<SignUpStep4Data>
  onSubmit: (data: SignUpStep4Data) => void
  onPrevious?: () => void
  isLoading?: boolean
  currentStep: number
  totalSteps: number
}

const brazilianStates = [
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

export function Step4({
  initialData,
  onSubmit,
  onPrevious,
  isLoading = false,
  currentStep,
  totalSteps,
}: Step4Props) {
  const {
    handleSubmit,
    control,
    formState: { isValid },
    setValue,
    watch,
  } = useForm<SignUpStep4Data>({
    mode: 'onChange',
    resolver: zodResolver(signUpStep4Schema),
    defaultValues: initialData,
  })

  const cepValue = watch('office.cep')

  // Observar mudanças no CEP e fazer a busca
  useEffect(() => {
    const fetchAddressByCep = async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '')

      if (cleanCep.length === 8) {
        try {
          const response = await fetch(
            `https://viacep.com.br/ws/${cleanCep}/json/`,
          )
          const data = await response.json()

          if (!data.erro) {
            setValue('office.city', data.localidade)
            setValue('office.state', data.uf)
            setValue('office.neighborhood', data.bairro)
            setValue('office.address', data.logradouro)
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error)
        }
      }
    }

    if (cepValue) {
      fetchAddressByCep(cepValue)
    }
  }, [cepValue, setValue])

  const handleSubmitForm = (data: SignUpStep4Data) => {
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

          <SelectField
            name="office.state"
            control={control}
            placeholder="Estado"
            options={brazilianStates}
            disabled={isLoading}
            className="text-gray-700 transition-all duration-200"
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
            Concluir Cadastro
          </Button>
        </div>
      </form>
    </div>
  )
}
