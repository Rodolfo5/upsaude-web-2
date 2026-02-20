import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCreateTrainingPrescription,
  useUpdateTrainingPrescription,
  useTrainingPrescriptions,
} from '@/hooks/queries/useHealthPillarTrainingPrescriptions'
import useUser from '@/hooks/useUser'
import {
  trainingPrescriptionSchema,
  TrainingPrescriptionFormData,
} from '@/validations/healthPillar'

import { TrainingPrescriptionModalProps } from './types'

export function TrainingPrescriptionModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  activityId,
  prescription,
  onSuccess,
}: TrainingPrescriptionModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createPrescription, isPending: isCreating } =
    useCreateTrainingPrescription()
  const { mutateAsync: updatePrescription, isPending: isUpdating } =
    useUpdateTrainingPrescription()
  const { data: existingPrescriptions = [] } = useTrainingPrescriptions(
    patientId,
    planId,
    pillarId,
    activityId,
  )

  const isEditing = !!prescription

  const { control, handleSubmit, reset } =
    useForm<TrainingPrescriptionFormData>({
      resolver: zodResolver(trainingPrescriptionSchema),
      defaultValues: {
        title: '',
        description: '',
        order: undefined,
      },
    })

  // Preencher formulário ao editar
  useEffect(() => {
    if (prescription && isOpen) {
      reset({
        title: prescription.title,
        description: prescription.description || '',
        order: prescription.order,
      })
    } else if (!isOpen) {
      reset({
        title: '',
        description: '',
        order: undefined,
      })
    }
  }, [prescription, isOpen, reset])

  const onSubmit = async (data: TrainingPrescriptionFormData) => {
    try {
      if (isEditing && prescription) {
        await updatePrescription({
          patientId,
          planId,
          pillarId,
          activityId,
          prescriptionId: prescription.id,
          data: {
            ...data,
            doctorId: currentUser?.id || '',
          },
        })
      } else {
        // Definir order baseado no número de prescrições existentes
        const order = existingPrescriptions.length + 1
        await createPrescription({
          patientId,
          planId,
          pillarId,
          activityId,
          data: {
            ...data,
            order,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset({
        title: '',
        description: '',
        order: undefined,
      })
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar prescrição de treino:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset({
      title: '',
      description: '',
      order: undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-xl">
        <DialogTitle className="text-xl font-normal text-gray-700">
          {isEditing
            ? 'Editar prescrição de treino'
            : 'Criar prescrição de treino'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            name="title"
            control={control}
            label="Título"
            placeholder="Treino com a bola parada"
          />

          <TextareaField
            name="description"
            control={control}
            label="Descrição"
            placeholder="Descreva os exercícios e orientações do treino..."
            rows={6}
          />

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="link"
              disabled={isCreating || isUpdating}
              className="hover:no-underline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isCreating || isUpdating}
              disabled={isCreating || isUpdating}
            >
              {isEditing ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
