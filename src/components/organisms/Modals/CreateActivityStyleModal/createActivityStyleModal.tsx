import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import FileUploadField from '@/components/molecules/FileUploadField/fileUploadField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateActivity } from '@/hooks/queries/useHealthPillarActivities'
import useUser from '@/hooks/useUser'

import { CreateActivityStyleModalProps } from './types'

const mentalHealthActivityOptions = [
  { value: 'Exercício de Respiração', label: 'Exercício de Respiração' },
  { value: 'Cartas de Gratidão', label: 'Cartas de Gratidão' },
  { value: 'Microrreflexões', label: 'Microrreflexões' },
  { value: 'Exercício de Autoestima', label: 'Exercício de Autoestima' },
  { value: 'Meditação Guiada', label: 'Meditação Guiada' },
  { value: 'Autorreflexão de Melhoria', label: 'Autorreflexão de Melhoria' },
]

const activityStyleSchema = z.object({
  name: z
    .string()
    .min(1, 'O título é obrigatório')
    .min(2, 'O título deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  steps: z
    .string()
    .min(1, 'As etapas são obrigatórias')
    .min(10, 'Descreva as etapas com mais detalhes'),
  image: z.string().optional(),
})

type ActivityStyleFormData = z.infer<typeof activityStyleSchema>

export function CreateActivityStyleModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  goalId,
  onSuccess,
}: CreateActivityStyleModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createActivity, isPending: isCreating } =
    useCreateActivity()

  const { control, handleSubmit, reset, setValue, watch } = useForm<
    ActivityStyleFormData & { activitySelect?: string }
  >({
    resolver: zodResolver(
      activityStyleSchema.extend({
        activitySelect: z.string().optional(),
      }),
    ),
    defaultValues: {
      name: '',
      description: '',
      steps: '',
      image: '',
      activitySelect: '',
    },
  })

  const selectedActivityName = watch('activitySelect')

  // Atualizar nome quando atividade for selecionada
  useEffect(() => {
    if (selectedActivityName) {
      setValue('name', selectedActivityName)
    }
  }, [selectedActivityName, setValue])

  const onSubmit = async (data: ActivityStyleFormData) => {
    try {
      const description = data.steps
        ? `${data.description || ''}\n\nEtapas:\n${data.steps}`
        : data.description || ''

      const result = await createActivity({
        patientId,
        planId,
        pillarId,
        goalId,
        data: {
          name: data.name,
          description,
          status: 'Ativa',
          doctorId: currentUser?.id || '',
        },
      })

      setIsOpen(false)
      reset({
        name: '',
        description: '',
        steps: '',
        image: '',
        activitySelect: '',
      })
      if (onSuccess && result) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('Erro ao criar estilo de exercício:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset({
      name: '',
      description: '',
      steps: '',
      image: '',
      activitySelect: '',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-2xl">
        <DialogTitle className="text-xl font-normal text-gray-700">
          Criar novo estilo de exercício
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField
            name="activitySelect"
            control={control}
            label="Título"
            options={mentalHealthActivityOptions}
            placeholder="Selecione o tipo de atividade"
            searchable={false}
          />

          <TextareaField
            name="description"
            control={control}
            label="Descrição"
            placeholder="Ex: Ideal para registrar ideias, eventos e emoções"
            rows={3}
          />

          <TextareaField
            name="steps"
            control={control}
            label="Etapas"
            placeholder="Descreva as etapas do exercício...&#10;&#10;Ex:&#10;Abrir o caderno – escolha a página em branco ou continue de onde parou.&#10;Definir o objetivo da anotação – registrar ideias, planejar atividades, anotar lembretes ou organizar informações."
            rows={8}
          />

          <FileUploadField
            name="image"
            control={control}
            label="Imagem"
            accept="image/*"
            maxSize={5}
            onFileSelect={(value) => {
              setValue('image', value as string)
            }}
            loading={isCreating}
            disabled={isCreating}
            helpText="Faça upload de uma imagem para o exercício (máx. 5MB)"
          />

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="link"
              disabled={isCreating}
              className="hover:no-underline"
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isCreating} disabled={isCreating}>
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
