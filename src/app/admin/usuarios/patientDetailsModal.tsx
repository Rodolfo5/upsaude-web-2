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
import { PatientEntity } from '@/types/entities/user'
import cpfSchema from '@/validations/cpf'
import nameSchema from '@/validations/name'

interface PatientDetailsModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  patient: PatientEntity
}

const editPatientSchema = z.object({
  name: nameSchema,
  email: z.string().email('E-mail inválido'),
  cpf: cpfSchema,
  birthDate: z.date().optional(),
  profileImage: z.string().optional(),
  gender: z.string().optional(),
  bloodType: z.string().optional(),
  height: z.string().optional(),
  phoneNumber: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

type EditPatientFormData = z.infer<typeof editPatientSchema>

const getValidDate = (date: Date | string | undefined): Date | undefined => {
  if (!date) return undefined
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? undefined : date
  }
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

export function PatientDetailsModal({
  isOpen,
  setIsOpen,
  patient,
}: PatientDetailsModalProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo(
    () => ({
      name: patient.name,
      email: patient.email,
      cpf: patient.cpf || '',
      birthDate: getValidDate(patient.birthDate),
      profileImage: patient.profileImage || '',
      gender: patient.gender || '',
      bloodType: patient.bloodType || '',
      height: patient.height || '',
      phoneNumber: patient.phoneNumber || '',
      cep: patient.cep || '',
      address: patient.address || '',
      number: patient.number || '',
      complement: patient.complement || '',
      neighborhood: patient.neighborhood || '',
      city: patient.city || '',
      state: patient.state || '',
    }),
    [patient],
  )

  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty, isValid },
  } = useForm<EditPatientFormData>({
    mode: 'onChange',
    resolver: zodResolver(editPatientSchema),
    values: defaultValues,
  })

  const onSubmit = useCallback(
    async (data: EditPatientFormData) => {
      setIsSubmitting(true)
      try {
        const updates: Record<string, unknown> = {
          name: data.name,
          email: data.email,
        }
        if (data.cpf) updates.cpf = data.cpf
        if (data.birthDate) updates.birthDate = data.birthDate
        if (data.profileImage) updates.profileImage = data.profileImage
        if (data.gender) updates.gender = data.gender
        if (data.bloodType) updates.bloodType = data.bloodType
        if (data.height) updates.height = data.height
        if (data.phoneNumber) updates.phoneNumber = data.phoneNumber
        if (data.cep) updates.cep = data.cep
        if (data.address) updates.address = data.address
        if (data.number) updates.number = data.number
        if (data.complement) updates.complement = data.complement
        if (data.neighborhood) updates.neighborhood = data.neighborhood
        if (data.city) updates.city = data.city
        if (data.state) updates.state = data.state

        const { error } = await updateUserDoc(patient.id, updates)

        if (error) {
          errorToast('Erro ao atualizar paciente')
          return
        }

        await queryClient.invalidateQueries({
          queryKey: getAllUsersQueryKey(),
        })

        successToast('Paciente atualizado com sucesso!')
        setIsEditing(false)
      } catch (error) {
        console.error('Erro ao atualizar paciente:', error)
        errorToast('Erro ao atualizar paciente')
      } finally {
        setIsSubmitting(false)
      }
    },
    [patient.id, queryClient],
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-3xl">
        <DialogHeader className="items-start text-left">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            {patient.profileImage && (
              <Image
                src={patient.profileImage}
                alt="Foto de Perfil"
                width={48}
                height={48}
              />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Dados do Paciente' : 'Detalhes do Paciente'}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {isEditing
              ? 'Atualize as informações do paciente abaixo.'
              : 'Visualize todas as informações do paciente.'}
          </DialogDescription>
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
              placeholder="Nome completo do paciente"
              required
              disabled={!isEditing}
            />

            <InputField
              name="email"
              control={control}
              label="E-mail"
              placeholder="paciente@example.com"
              required
              disabled={!isEditing}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputField
              name="gender"
              control={control}
              label="Gênero"
              placeholder="Gênero"
              disabled={!isEditing}
            />
            <InputField
              name="bloodType"
              control={control}
              label="Tipo Sanguíneo"
              placeholder="Ex: A+"
              disabled={!isEditing}
            />
            <InputField
              name="height"
              control={control}
              label="Altura (m)"
              placeholder="Ex: 1.75"
              disabled={!isEditing}
            />
          </div>

          <InputField
            name="phoneNumber"
            control={control}
            label="Telefone"
            placeholder="(00) 00000-0000"
            disabled={!isEditing}
          />

          <div className="border-t pt-4">
            <h3 className="mb-3 text-base font-semibold text-gray-900">
              Endereço
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField
                  name="cep"
                  control={control}
                  label="CEP"
                  maskType="cep"
                  placeholder="00000-000"
                  disabled={!isEditing}
                />
                <InputField
                  name="address"
                  control={control}
                  label="Logradouro"
                  placeholder="Rua, Av., etc."
                  disabled={!isEditing}
                />
                <InputField
                  name="number"
                  control={control}
                  label="Número"
                  placeholder="Número"
                  disabled={!isEditing}
                />
              </div>
              <InputField
                name="complement"
                control={control}
                label="Complemento"
                placeholder="Apt, Bloco, etc."
                disabled={!isEditing}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="neighborhood"
                  control={control}
                  label="Bairro"
                  placeholder="Bairro"
                  disabled={!isEditing}
                />
                <InputField
                  name="city"
                  control={control}
                  label="Cidade"
                  placeholder="Cidade"
                  disabled={!isEditing}
                />
              </div>
              <InputField
                name="state"
                control={control}
                label="Estado"
                placeholder="Estado"
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
                  Editar Dados do Paciente
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
