'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreatePatient } from '@/hooks/queries/useCreatePatient'
import { successToast } from '@/hooks/useAppToast'
import useUser from '@/hooks/useUser'
import emailSchema from '@/validations/email'
import nameSchema from '@/validations/name'
import phoneSchema from '@/validations/phone'

import { AddNewPatientModalProps } from './types'

const addPatientSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  name: nameSchema,
})

type AddPatientFormData = z.infer<typeof addPatientSchema>

export function AddNewPatientForm({
  isOpen,
  setIsOpen,
}: AddNewPatientModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync, isPending, isSuccess } = useCreatePatient()

  const { handleSubmit, control, formState, reset } =
    useForm<AddPatientFormData>({
      mode: 'onChange',
      resolver: zodResolver(addPatientSchema),
    })

  const onSubmit = async (data: AddPatientFormData) => {
    if (!currentUser?.id) {
      successToast('Erro: Usuário não logado')
      return
    }

    try {
      await mutateAsync({
        ...data,
        doctorId: currentUser.id,
        steps: 'step1',
      })

      successToast('Paciente cadastrado com sucesso!')
      reset()
    } catch (error: unknown) {
      console.error('Erro ao criar paciente:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido'
      successToast(`Erro ao cadastrar paciente: ${errorMessage}`)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-xl">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Image
              src="/ilustra-sucesso-paciente.png"
              alt="Sucesso ao cadastrar paciente"
              width={200}
              height={200}
            />
            <p className="text-center text-lg font-semibold text-gray-900">
              Seu paciente foi cadastrado com sucesso!
            </p>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary-gray"
                className="flex-1"
              >
                Voltar para os meus pacientes
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader className="mb-8 items-start text-left">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Cadastrar Paciente
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <InputField
                name="name"
                control={control}
                label="Nome Completo*"
                type="text"
                placeholder="Nome Sobrenome"
                required
              />
              <InputField
                name="email"
                control={control}
                label="E-mail do Paciente*"
                type="text"
                placeholder="paciente@example.com"
                required
              />
              <InputField
                name="phone"
                control={control}
                label="Telefone*"
                type="text"
                placeholder="99999999999"
                required
              />

              <div className="flex rounded-md bg-info-light p-2 text-info-dark">
                <Info className="mr-4 h-8 w-8" />
                <p className="text-sm text-info-dark">
                  Ao cadastrar um paciente na plataforma, ele será
                  automaticamente vinculado a você como coordenador do cuidado
                </p>
              </div>

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
                  disabled={!formState.isValid || isPending}
                  className="flex-1"
                >
                  {isPending ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
