import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
  useCreateOrientation,
  useUpdateOrientation,
} from '@/hooks/queries/useHealthPillarOrientations'
import useUser from '@/hooks/useUser'
import { OrientationEntity } from '@/types/entities/healthPillar'

interface NutritionalRecommendationModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  orientation?: OrientationEntity | null
  onSuccess?: () => void
}

const nutritionalRecommendationSchema = z.object({
  title: z
    .string()
    .min(1, 'O título é obrigatório')
    .min(2, 'O título deve ter pelo menos 2 caracteres'),
  description: z
    .string()
    .min(1, 'A recomendação é obrigatória')
    .min(2, 'A recomendação deve ter pelo menos 2 caracteres'),
})

type NutritionalRecommendationFormData = z.infer<
  typeof nutritionalRecommendationSchema
>

export function NutritionalRecommendationModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  orientation,
  onSuccess,
}: NutritionalRecommendationModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createOrientation, isPending: isCreating } =
    useCreateOrientation()
  const { mutateAsync: updateOrientation, isPending: isUpdating } =
    useUpdateOrientation()

  const isEditing = !!orientation

  const { control, handleSubmit, reset } =
    useForm<NutritionalRecommendationFormData>({
      resolver: zodResolver(nutritionalRecommendationSchema),
      defaultValues: {
        title: '',
        description: '',
      },
    })

  useEffect(() => {
    if (orientation && isOpen) {
      reset({
        title: orientation.title,
        description: orientation.description || '',
      })
    } else if (!isOpen) {
      reset({
        title: '',
        description: '',
      })
    }
  }, [orientation, isOpen, reset])

  const onSubmit = async (data: NutritionalRecommendationFormData) => {
    try {
      const orientationData: any = {
        title: data.title,
        description: data.description,
        status: 'Ativa',
        area: 'Alimentação',
      }

      if (isEditing && orientation) {
        await updateOrientation({
          patientId,
          planId,
          pillarId,
          goalId: orientation.goalId || '',
          orientationId: orientation.id,
          data: orientationData,
        })
      } else {
        await createOrientation({
          patientId,
          planId,
          pillarId,
          goalId: '',
          isRead: false,
          data: {
            ...orientationData,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset({
        title: '',
        description: '',
      })
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar recomendação nutricional:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset({
      title: '',
      description: '',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="text-xl font-normal text-gray-700">
          Recomendação nutricional
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            name="title"
            control={control}
            label="Título"
            placeholder="Dieta Rash"
          />

          <TextareaField
            name="description"
            control={control}
            label="Recomendação"
            placeholder="Evitar ultraprocessados, aumentar fibras solúveis..."
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
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
