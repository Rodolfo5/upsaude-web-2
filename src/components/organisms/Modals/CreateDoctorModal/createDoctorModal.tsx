'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import BirthDatePickerField from '@/components/molecules/BirthDatePickerField/birthDatePickerField'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateDoctor } from '@/hooks/queries/useCreateDoctor'
import { useMemedValidateCrm } from '@/hooks/queries/useMemedValidateCrm'
import { errorToast, successToast, warningToast } from '@/hooks/useAppToast'
import birthDateSchema from '@/validations/birthDate'
import cpfSchema from '@/validations/cpf'
import emailSchema from '@/validations/email'
import name from '@/validations/name'

import { brazilianStates } from '../../Forms/SignUpForm/Step2/step2'

import { InviteDoctorModalProps } from './types'

const createDoctorSchema = z.object({
  name,
  email: emailSchema,
  cpf: cpfSchema,
  birthDate: birthDateSchema,
  state: z.string().min(1, 'Estado é obrigatório'),
  crm: z
    .string()
    .min(1, 'CRM é obrigatório')
    .regex(/^\d+$/, 'CRM deve conter apenas números'),
  crmState: z
    .string()
    .min(2, 'Estado do CRM é obrigatório')
    .max(2, 'Estado do CRM deve ter 2 caracteres'),
  specialty: z.string().optional(),
})

type CreateDoctorFormData = z.infer<typeof createDoctorSchema>

export function CreateDoctorModal({
  isOpen,
  setIsOpen,
}: InviteDoctorModalProps) {
  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid },
    reset,
    setError,
    clearErrors,
  } = useForm<CreateDoctorFormData>({
    mode: 'onChange',
    resolver: zodResolver(createDoctorSchema),
  })

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  )
  const [copied, setCopied] = useState(false)
  const [isValidatingCrm, setIsValidatingCrm] = useState(false)
  const [crmValidationStatus, setCrmValidationStatus] = useState<{
    valid: boolean | null
    message?: string
  }>({ valid: null })

  const { mutateAsync, isPending } = useCreateDoctor()
  const { mutateAsync: validateCrm } = useMemedValidateCrm()

  const crm = watch('crm')
  const crmState = watch('crmState')

  // Validar CRM quando ambos campos estiverem preenchidos
  useEffect(() => {
    const cleanCrm = crm?.replace(/\D/g, '')
    if (cleanCrm && cleanCrm.length > 0 && crmState && crmState.length === 2) {
      const timeoutId = setTimeout(async () => {
        setIsValidatingCrm(true)
        setCrmValidationStatus({ valid: null })
        clearErrors('crm')

        try {
          // Validar apenas uso local, pular validação na Memed
          // A validação na Memed será feita durante o cadastro final
          const result = await validateCrm({
            crm: cleanCrm,
            crmState: crmState.toUpperCase(),
            skipMemedValidation: true, // Pula validação na Memed
          })

          // O hook sempre retorna um objeto, nunca lança erro
          // NOVA LÓGICA: Validar apenas formato e uso local
          // O CRM será validado na Memed durante o cadastro final
          if (result && !result.inUse) {
            // Formato OK e não está em uso local = pode prosseguir
            // Não validamos na Memed aqui, será feito no momento do cadastro
            setCrmValidationStatus({
              valid: true,
              message: 'CRM disponível para cadastro',
            })
          } else if (result?.inUse) {
            // Bloquear se está em uso local
            let errorMessage =
              'CRM já está sendo usado por outro médico no sistema'
            if (result.inUseBy) {
              errorMessage = `CRM já está sendo usado por outro médico`
            }
            setCrmValidationStatus({
              valid: false,
              message: errorMessage,
            })
            setError('crm', {
              type: 'manual',
              message: errorMessage,
            })
          } else {
            // Erro na validação (formato ou outro problema)
            const errorMessage = result?.error || 'Erro ao validar CRM'
            setCrmValidationStatus({
              valid: false,
              message: errorMessage,
            })
            setError('crm', {
              type: 'manual',
              message: errorMessage,
            })
          }
        } catch (error) {
          // Fallback caso algo inesperado aconteça
          const errorMessage =
            error instanceof Error ? error.message : 'Erro ao validar CRM'
          setCrmValidationStatus({
            valid: false,
            message: errorMessage,
          })
          setError('crm', {
            type: 'manual',
            message: errorMessage,
          })
        } finally {
          setIsValidatingCrm(false)
        }
      }, 1000) // Debounce de 1 segundo

      return () => clearTimeout(timeoutId)
    } else {
      setCrmValidationStatus({ valid: null })
    }
  }, [crm, crmState, validateCrm, setError, clearErrors])

  const handleCreateDoctor = async (data: CreateDoctorFormData) => {
    // Validar CRM novamente antes de criar
    if (crmValidationStatus.valid === false) {
      errorToast('Por favor, corrija o CRM antes de continuar')
      return
    }

    if (isValidatingCrm) {
      errorToast('Aguarde a validação do CRM')
      return
    }

    try {
      const { password, warnings } = await mutateAsync({
        ...data,
        crm: data.crm.replace(/\D/g, ''),
        crmState: data.crmState.toUpperCase(),
      })

      setGeneratedPassword(password)
      successToast('Médico criado com sucesso!')

      if (warnings.length > 0) {
        warningToast(`Medico criado com alertas: ${warnings.join(' | ')}`)
      }
    } catch (error) {
      console.error('Erro ao criar médico:', error)
      errorToast(
        error instanceof Error ? error.message : 'Erro ao criar médico',
      )
    }
  }

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      successToast('Senha copiada!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
    setGeneratedPassword(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="items-start text-left">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <AddOutlinedIcon className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Cadastrar Novo Médico
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {generatedPassword
              ? 'Médico criado com sucesso! Copie a senha temporária.'
              : 'Digite as informações do médico para cadastrá-lo.'}
          </DialogDescription>
        </DialogHeader>

        {!generatedPassword ? (
          <form
            onSubmit={handleSubmit(handleCreateDoctor)}
            className="space-y-4"
          >
            <InputField
              name="name"
              control={control}
              label="Nome Completo"
              type="text"
              placeholder="Digite o nome completo"
              required
              className="transition-all duration-200"
            />

            <InputField
              name="email"
              control={control}
              label="E-mail do Médico"
              type="text"
              placeholder="medico@example.com"
              required
              className="transition-all duration-200"
            />

            <InputField
              name="cpf"
              control={control}
              label="CPF"
              type="text"
              placeholder="000.000.000-00"
              maskType="cpf"
              required
              className="transition-all duration-200"
            />

            <BirthDatePickerField
              name="birthDate"
              control={control}
              label="Data de nascimento"
              placeholder="Selecione a data de nascimento"
              required
              className="transition-all duration-200"
            />

            <SelectField
              name="state"
              control={control}
              placeholder="Selecione o estado"
              options={brazilianStates}
              className="text-gray-700 transition-all duration-200"
              label="Estado"
            />

            <div className="relative">
              <InputField
                name="crm"
                control={control}
                label="CRM"
                type="text"
                placeholder="000000"
                required
                className="transition-all duration-200"
                variant={
                  crmValidationStatus.valid === true
                    ? 'success'
                    : crmValidationStatus.valid === false
                      ? 'error'
                      : 'default'
                }
              />
              {isValidatingCrm && (
                <p className="mt-1 text-xs text-gray-500">Validando CRM...</p>
              )}
              {crmValidationStatus.valid === true && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ {crmValidationStatus.message}
                </p>
              )}
              {crmValidationStatus.valid === false && (
                <p className="mt-1 text-xs text-red-600">
                  ✗ {crmValidationStatus.message}
                </p>
              )}
            </div>

            <SelectField
              name="crmState"
              control={control}
              placeholder="UF"
              options={brazilianStates.map((s) => ({
                value: s.value,
                label: `${s.value} - ${s.label}`,
              }))}
              className="text-gray-700 transition-all duration-200"
              label="Estado do CRM"
            />

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary-gray"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={
                  !isValid ||
                  isPending ||
                  isValidatingCrm ||
                  crmValidationStatus.valid === false
                }
                loading={isPending || isValidatingCrm}
                className="flex-1"
              >
                Cadastrar Médico
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="break-all text-sm text-gray-700">
                {generatedPassword}
              </p>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary-gray"
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={handleCopyPassword}
                variant="success"
                className="flex-1"
                icon={
                  copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ContentCopyOutlinedIcon className="h-4 w-4" />
                  )
                }
              >
                {copied ? 'Copiada!' : 'Copiar Senha'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
