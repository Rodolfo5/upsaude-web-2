'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Edit, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import BirthDatePickerField from '@/components/molecules/BirthDatePickerField/birthDatePickerField'
import InputField from '@/components/molecules/InputField/inputField'
import ProfileImageField from '@/components/molecules/ProfileImageField/profileImageField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import { brazilianStates } from '@/components/organisms/Forms/SignUpForm/Step2/step2'
import { getSpecialtiesForCredential } from '@/utils/specialtyHelpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAllUsersQueryKey } from '@/hooks/queries/useAllUsers'
import { errorToast, successToast } from '@/hooks/useAppToast'
import { updateUserDoc } from '@/services/user'
import { DoctorEntity } from '@/types/entities/user'
import cpfSchema from '@/validations/cpf'
import nameSchema from '@/validations/name'

interface DoctorDetailsModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  doctor: DoctorEntity
}

const editDoctorSchema = z.object({
  name: nameSchema,
  email: z.string().email('E-mail inválido'),
  cpf: cpfSchema,
  birthDate: z.date().optional(),
  profileImage: z.string().optional(),
  state: z.string().optional(),
  typeOfCredential: z.string().optional(),
  credential: z.string().optional(),
  specialty: z.string().optional(),
  credentialDocument: z.string().optional(),
  office: z
    .object({
      cep: z.string().optional(),
      address: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    })
    .optional(),
})

type EditDoctorFormData = z.infer<typeof editDoctorSchema>

const getValidDate = (date: Date | string | undefined): Date | undefined => {
  if (!date) return undefined
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? undefined : date
  }
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

export function DoctorDetailsModal({
  isOpen,
  setIsOpen,
  doctor,
}: DoctorDetailsModalProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegisteringMemed, setIsRegisteringMemed] = useState(false)

  const specialtyOptions = useMemo(
    () => getSpecialtiesForCredential(doctor.typeOfCredential),
    [doctor.typeOfCredential],
  )

  const defaultValues = useMemo(
    () => ({
      name: doctor.name,
      email: doctor.email,
      cpf: doctor.cpf || '',
      birthDate: getValidDate(doctor.birthDate),
      profileImage: doctor.profileImage || '',
      state: doctor.state || '',
      typeOfCredential: doctor.typeOfCredential || '',
      credential: doctor.credential || '',
      specialty: doctor.specialty || '',
      credentialDocument: doctor.credentialDocument || '',
      office: {
        cep: doctor.office?.cep || '',
        address: doctor.office?.address || '',
        complement: doctor.office?.complement || '',
        neighborhood: doctor.office?.neighborhood || '',
        city: doctor.office?.city || '',
        state: doctor.office?.state || '',
      },
    }),
    [doctor],
  )

  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty, isValid },
  } = useForm<EditDoctorFormData>({
    mode: 'onChange',
    resolver: zodResolver(editDoctorSchema),
    values: defaultValues,
  })

  const onSubmit = useCallback(
    async (data: EditDoctorFormData) => {
      setIsSubmitting(true)
      try {
        const updates: Record<string, unknown> = {
          name: data.name,
        }
        if (data.cpf) updates.cpf = data.cpf
        if (data.birthDate) updates.birthDate = data.birthDate
        if (data.profileImage) updates.profileImage = data.profileImage
        if (data.state) updates.state = data.state
        if (data.typeOfCredential)
          updates.typeOfCredential = data.typeOfCredential
        if (data.credential) updates.credential = data.credential
        if (data.specialty) updates.specialty = data.specialty
        if (data.credentialDocument)
          updates.credentialDocument = data.credentialDocument
        if (data.office) updates.office = data.office

        const { error } = await updateUserDoc(doctor.id, updates)

        if (error) {
          errorToast('Erro ao atualizar médico')
          return
        }

        await queryClient.invalidateQueries({
          queryKey: getAllUsersQueryKey(),
        })

        successToast('Médico atualizado com sucesso!')
        setIsEditing(false)
      } catch (error) {
        console.error('Erro ao atualizar médico:', error)
        errorToast('Erro ao atualizar médico')
      } finally {
        setIsSubmitting(false)
      }
    },
    [doctor.id, queryClient],
  )

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setIsEditing(false)
    reset()
  }, [setIsOpen, reset])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    reset()
  }, [reset])

  const handleStartEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleRegisterInMemed = useCallback(async () => {
    setIsRegisteringMemed(true)
    try {
      const response = await fetch('/api/memed/register-existing-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorId: doctor.id }),
      })

      const result = await response.json()

      if (result.success) {
        successToast(
          result.message || 'Médico registrado na Memed com sucesso!',
        )

        // Atualizar a lista de médicos
        await queryClient.invalidateQueries({
          queryKey: getAllUsersQueryKey(),
        })
      } else {
        errorToast(result.error || 'Erro ao registrar médico na Memed')
      }
    } catch (error) {
      console.error('Erro ao registrar médico na Memed:', error)
      errorToast('Erro ao registrar médico na Memed')
    } finally {
      setIsRegisteringMemed(false)
    }
  }, [doctor.id, queryClient])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-3xl">
        <DialogHeader className="items-start text-left">
          <div className="mb-2 flex items-center justify-center rounded-full bg-purple-100">
            {doctor.profileImage && (
              <Image
                src={doctor.profileImage}
                alt="Foto de Perfil"
                width={70}
                height={70}
                className="mx-auto h-20 w-20 rounded-full"
              />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Dados do Médico' : 'Detalhes do Médico'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {isEditing
              ? 'Atualize as informações do médico abaixo.'
              : 'Visualize todas as informações do médico.'}
          </DialogDescription>

          {/* Status de registro na Memed */}
          {!isEditing && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Status Memed:
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  doctor.memedRegistered || doctor.memedId
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {doctor.memedRegistered || doctor.memedId
                  ? `Registrado${doctor.memedId ? ` (ID: ${doctor.memedId})` : ''}`
                  : 'Não registrado'}
              </span>
              {!doctor.memedRegistered &&
                !doctor.memedId &&
                doctor.typeOfCredential === 'CRM' && (
                  <Button
                    onClick={handleRegisterInMemed}
                    variant="success"
                    size="sm"
                    loading={isRegisteringMemed}
                    disabled={isRegisteringMemed}
                    className="ml-2"
                  >
                    Registrar na Memed
                  </Button>
                )}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ProfileImageField
            name="profileImage"
            control={control}
            label="Foto de Perfil"
            disabled={!isEditing}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              name="name"
              control={control}
              label="Nome Completo"
              placeholder="Nome completo do médico"
              required
              disabled={!isEditing}
            />

            <InputField
              name="email"
              control={control}
              label="E-mail"
              placeholder="medico@example.com"
              required
              disabled={true} // Email não editável
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              name="cpf"
              control={control}
              label="CPF"
              maskType="cpf"
              placeholder="000.000.000-00"
              disabled={!isEditing}
            />

            <BirthDatePickerField
              name="birthDate"
              control={control}
              label="Data de Nascimento"
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              name="state"
              control={control}
              placeholder="Selecione o estado"
              options={brazilianStates}
              label="Estado"
              disabled={!isEditing}
            />
            <SelectField
              name="specialty"
              control={control}
              label="Especialidade"
              placeholder="Especialidade"
              options={specialtyOptions}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              name="typeOfCredential"
              control={control}
              label="Tipo de Credencial"
              placeholder="Tipo de Credencial"
              disabled={!isEditing}
            />
            <InputField
              name="credential"
              control={control}
              label="Credencial"
              placeholder="Número da Credencial"
              disabled={!isEditing}
            />
          </div>

          <InputField
            name="credentialDocument"
            control={control}
            label="Documento da Credencial"
            placeholder="URL ou caminho do documento"
            disabled={!isEditing}
          />

          <div className="border-t pt-4">
            <h3 className="mb-3 text-base font-semibold text-gray-900">
              Endereço do Consultório
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="office.cep"
                  control={control}
                  label="CEP"
                  maskType="cep"
                  placeholder="00000-000"
                  disabled={!isEditing}
                />
                <InputField
                  name="office.address"
                  control={control}
                  label="Logradouro"
                  placeholder="Rua, Av., etc."
                  disabled={!isEditing}
                />
              </div>
              <InputField
                name="office.complement"
                control={control}
                label="Complemento"
                placeholder="Apt, Bloco, etc."
                disabled={!isEditing}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="office.neighborhood"
                  control={control}
                  label="Bairro"
                  placeholder="Bairro"
                  disabled={!isEditing}
                />
                <InputField
                  name="office.city"
                  control={control}
                  label="Cidade"
                  placeholder="Cidade"
                  disabled={!isEditing}
                />
              </div>
              <SelectField
                name="office.state"
                control={control}
                label="Estado"
                placeholder="Selecione o estado"
                options={brazilianStates}
                disabled={!isEditing}
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  onClick={handleCancelEdit}
                  variant="secondary-gray"
                  className="flex-1 text-[#792EBD]"
                  disabled={isSubmitting}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  className="flex-1"
                  disabled={!isValid || isSubmitting || !isDirty}
                  loading={isSubmitting}
                >
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleClose}
                  variant="secondary-gray"
                  className="flex-1 text-[#792EBD]"
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleStartEdit}
                  variant="success"
                  className="flex-1"
                  icon={<Edit className="h-4 w-4" />}
                >
                  Editar Dados do Médico
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
