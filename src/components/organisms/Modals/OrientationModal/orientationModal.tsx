import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import FileUploadField from '@/components/molecules/FileUploadField/fileUploadField'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
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
import { orientationSchema } from '@/validations/healthPillar'

import { OrientationModalProps } from './types'

const areaOptions = [
  { value: 'Hidratação', label: 'Hidratação' },
  { value: 'Peso', label: 'Peso' },
  { value: 'Movimentos', label: 'Movimentos' },
  { value: 'Alimentação', label: 'Alimentação' },
]

export function OrientationModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  pillarType,
  goals,
  orientation,
  defaultGoalId,
  defaultArea,
  onSuccess,
}: OrientationModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createOrientation, isPending: isCreating } =
    useCreateOrientation()
  const { mutateAsync: updateOrientation, isPending: isUpdating } =
    useUpdateOrientation()

  const isEditing = !!orientation
  const isLifestylePillar = pillarType === 'Estilo de Vida'

  const goalOptions = goals.map((goal) => ({
    value: goal.id,
    label:
      goal.type === 'Outros'
        ? goal.customTitle || 'Meta Customizada'
        : goal.type || goal.name || 'Meta',
  }))

  const formSchema = orientationSchema
    .extend({
      area: z.string().optional(),
      goalId: z.string().optional(),
    })
    .refine(
      (data) => {
        if (isLifestylePillar) {
          return !!data.area && data.area.length > 0
        } else {
          return !!data.goalId && data.goalId.length > 0
        }
      },
      {
        message: isLifestylePillar
          ? 'A área é obrigatória'
          : 'A meta é obrigatória',
        path: [isLifestylePillar ? 'area' : 'goalId'],
      },
    )

  type FormData = z.infer<typeof formSchema>

  const { control, handleSubmit, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalId: defaultGoalId || '',
      area: defaultArea || '',
      title: '',
      description: '',
      supportMaterial: '',
      status: 'Ativa',
    },
  })

  // Preencher formulário ao editar
  useEffect(() => {
    if (orientation && isOpen) {
      reset({
        goalId: orientation.goalId,
        area: orientation.area || '',
        title: orientation.title,
        description: orientation.description || '',
        supportMaterial: orientation.supportMaterial || '',
        status: orientation.status || 'Ativa',
      })
    } else if (!isOpen) {
      reset({
        goalId: defaultGoalId || '',
        area: defaultArea || '',
        title: '',
        description: '',
        supportMaterial: '',
        status: 'Ativa',
      })
    }
  }, [orientation, isOpen, reset, defaultGoalId, defaultArea])

  const onSubmit = async (data: FormData) => {
    try {
      const goalId = isLifestylePillar ? '' : data.goalId || ''
      const orientationData: {
        title: string
        description?: string
        supportMaterial?: string
        status: 'Ativa' | 'Desativada'
        area?: string
      } = {
        title: data.title,
        description: data.description,
        supportMaterial: data.supportMaterial,
        status: data.status,
      }

      if (isLifestylePillar && data.area) {
        orientationData.area = data.area
      }

      if (isEditing && orientation) {
        await updateOrientation({
          patientId,
          planId,
          pillarId,
          goalId: goalId || orientation.goalId,
          orientationId: orientation.id,
          data: orientationData,
        })
      } else {
        await createOrientation({
          patientId,
          planId,
          pillarId,
          goalId,
          isRead: false,
          data: {
            ...orientationData,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset({
        goalId: defaultGoalId || '',
        area: defaultArea || '',
        title: '',
        description: '',
        supportMaterial: '',
        status: 'Ativa',
      })
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar orientação:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset({
      goalId: defaultGoalId || '',
      area: defaultArea || '',
      title: '',
      description: '',
      supportMaterial: '',
      status: 'Ativa',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-xl">
        <DialogTitle className="text-xl font-normal text-gray-700">
          {isEditing ? 'Editar orientação' : 'Cadastrar orientação'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isLifestylePillar ? (
            <SelectField
              name="area"
              control={control}
              label="Área"
              options={areaOptions}
              placeholder="Selecione a área"
              searchable={false}
            />
          ) : (
            <SelectField
              name="goalId"
              control={control}
              label="Meta associada"
              options={goalOptions}
              placeholder="Selecione a meta"
              searchable={false}
            />
          )}

          <InputField
            name="title"
            control={control}
            label="Título"
            placeholder="Superando o estresse"
          />

          <TextareaField
            name="description"
            control={control}
            label="Descrição"
            placeholder="Dicas para uma vida mais tranquila..."
          />

          <FileUploadField
            name="supportMaterial"
            control={control}
            label="Material de Apoio"
            accept="image/*,.pdf,.doc,.docx"
            maxSize={10}
            onFileSelect={(url) => setValue('supportMaterial', url as string)}
            helpText="Faça o Upload de imagens ou documentos (máx. 10MB)"
          />

          <SelectField
            name="status"
            control={control}
            label="Status"
            options={[
              { value: 'Ativa', label: 'Ativa' },
              { value: 'Desativada', label: 'Desativada' },
            ]}
            placeholder="Selecione o status"
            searchable={false}
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
              {isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
