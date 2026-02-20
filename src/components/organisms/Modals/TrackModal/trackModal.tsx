import { zodResolver } from '@hookform/resolvers/zod'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import { CreateActivityStyleModal } from '@/components/organisms/Modals/CreateActivityStyleModal/createActivityStyleModal'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateExercise } from '@/hooks/queries/useHealthPillarExercises'
import {
  useCreateTrack,
  useUpdateTrack,
} from '@/hooks/queries/useHealthPillarTracks'
import useUser from '@/hooks/useUser'
import { ExerciseType } from '@/types/entities/healthPillar'
import { trackSchema, TrackFormData } from '@/validations/healthPillar'

import { TrackModalProps } from './types'

const exerciseTypeOptions: Array<{ value: ExerciseType; label: string }> = [
  { value: 'Exercícios de respiração', label: 'Exercício de Respiração' },
  { value: 'Cartas de gratidão', label: 'Cartas de Gratidão' },
  { value: 'Microreflexões', label: 'Microrreflexões' },
  { value: 'Exercícios de autoestima', label: 'Exercício de Autoestima' },
  { value: 'Meditação guiada', label: 'Meditação Guiada' },
  {
    value: 'Autoreflexões de melhorias',
    label: 'Autorreflexão de Melhoria',
  },
]

interface ExerciseFormData {
  type: ExerciseType
  name: string
  description?: string
}

export function TrackModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  goals,
  track,
  defaultGoalId,
  onSuccess,
}: TrackModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createTrack, isPending: isCreating } = useCreateTrack()
  const { mutateAsync: updateTrack, isPending: isUpdating } = useUpdateTrack()
  const { mutateAsync: createExercise } = useCreateExercise()

  const isEditing = !!track

  const goalOptions = goals.map((goal) => ({
    value: goal.id,
    label: goal.type || goal.name || 'Meta',
  }))

  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseFormData[]
  >([])
  const [isCreateExerciseModalOpen, setIsCreateExerciseModalOpen] =
    useState(false)
  const [exerciseSelect, setExerciseSelect] = useState<string>('')

  const { control, handleSubmit, reset, watch } = useForm<
    TrackFormData & { goalId?: string }
  >({
    resolver: zodResolver(
      trackSchema.extend({
        goalId: z.string().optional(),
      }),
    ),
    defaultValues: {
      goalId: defaultGoalId || '',
      name: '',
      description: '',
      observations: '',
    },
  })

  const selectedGoalId = watch('goalId')

  // Preencher formulário ao editar
  useEffect(() => {
    if (track && isOpen) {
      reset({
        goalId: track.goalId || '',
        name: track.name,
        description: track.description || '',
        observations: track.observations || '',
      })
    } else if (!isOpen) {
      reset({
        goalId: defaultGoalId || '',
        name: '',
        description: '',
        observations: '',
      })
      setSelectedExercises([])
      setExerciseSelect('')
    }
  }, [track, isOpen, reset, defaultGoalId])

  const handleAddExercise = () => {
    if (!exerciseSelect) return

    const exerciseType = exerciseTypeOptions.find(
      (opt) => opt.label === exerciseSelect,
    )
    if (exerciseType) {
      setSelectedExercises([
        ...selectedExercises,
        {
          type: exerciseType.value,
          name: exerciseSelect,
          description: '',
        },
      ])
      setExerciseSelect('')
    }
  }

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index))
  }

  const handleCreateCustomExercise = (activity: {
    name: string
    description?: string
  }) => {
    // Adicionar exercício customizado criado
    // Usar um tipo padrão para exercícios customizados
    setSelectedExercises([
      ...selectedExercises,
      {
        type: 'Autoreflexões de melhorias', // Tipo padrão para customizado
        name: activity.name,
        description: activity.description || '',
      },
    ])
  }

  const onSubmit = async (data: TrackFormData & { goalId?: string }) => {
    try {
      const goalId = data.goalId || (goals.length > 0 ? goals[0].id : '')

      if (isEditing && track) {
        await updateTrack({
          patientId,
          planId,
          pillarId,
          goalId: goalId || track.goalId,
          trackId: track.id,
          data: {
            name: data.name,
            description: data.description,
            observations: data.observations,
          },
        })
      } else {
        // Criar trilha
        const newTrack = await createTrack({
          patientId,
          planId,
          pillarId,
          goalId: goalId || '',
          data: {
            name: data.name,
            description: data.description,
            observations: data.observations,
            doctorId: currentUser?.id || '',
          },
        })

        // Criar exercícios após criar a trilha
        if (selectedExercises.length > 0 && newTrack.id) {
          await Promise.all(
            selectedExercises.map((exercise, index) =>
              createExercise({
                patientId,
                planId,
                pillarId,
                trackId: newTrack.id,
                data: {
                  type: exercise.type,
                  name: exercise.name,
                  description: exercise.description,
                  order: index + 1,
                  doctorId: currentUser?.id || '',
                },
              }),
            ),
          )
        }
      }

      setIsOpen(false)
      reset()
      setSelectedExercises([])
      setExerciseSelect('')
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar trilha:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset({
      goalId: defaultGoalId || '',
      name: '',
      description: '',
      observations: '',
    })
    setSelectedExercises([])
    setExerciseSelect('')
  }

  const availableExerciseOptions = exerciseTypeOptions.filter(
    (opt) =>
      !selectedExercises.some(
        (ex) => ex.type === opt.value || ex.name === opt.label,
      ),
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-2xl">
          <DialogTitle className="text-xl font-normal text-gray-700">
            {isEditing ? 'Editar trilha' : 'Cadastrar trilha'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {goals.length > 0 && (
              <SelectField
                name="goalId"
                control={control}
                label="Meta associada"
                options={goalOptions}
                placeholder="Selecione a meta (opcional)"
                searchable={false}
              />
            )}

            <InputField
              name="name"
              control={control}
              label="Nome da trilha *"
              placeholder="Nome da trilha"
            />

            <TextareaField
              name="description"
              control={control}
              label="Descrição"
              placeholder="Descreva a trilha..."
              rows={3}
            />

            {!isEditing && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Adicionar exercício
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedExercises.map((exercise, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 bg-purple-100 px-3 py-1 text-sm text-purple-800"
                      >
                        {exercise.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(index)}
                          className="ml-1 hover:text-purple-900"
                        >
                          <CloseIcon fontSize="small" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={exerciseSelect}
                      onChange={(e) => setExerciseSelect(e.target.value)}
                      className="flex-1 rounded-md border border-[#530570] px-3 py-2 text-gray-700 focus:border-purple-600 focus:ring-0"
                    >
                      <option value="">Selecione um exercício</option>
                      {availableExerciseOptions.map((opt) => (
                        <option key={opt.value} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={handleAddExercise}
                      disabled={!exerciseSelect}
                      variant="outline"
                    >
                      Adicionar
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 text-purple-600 hover:text-purple-800"
                    onClick={() => setIsCreateExerciseModalOpen(true)}
                  >
                    <AddOutlinedIcon fontSize="small" />
                    Criar novo estilo de exercício
                  </Button>
                </div>
              </>
            )}

            <TextareaField
              name="observations"
              control={control}
              label="Observações"
              placeholder="Fazer um exercício por dia"
              rows={4}
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

      {isCreateExerciseModalOpen && (
        <CreateActivityStyleModal
          isOpen={isCreateExerciseModalOpen}
          setIsOpen={setIsCreateExerciseModalOpen}
          patientId={patientId}
          planId={planId}
          pillarId={pillarId}
          goalId={selectedGoalId || goals[0]?.id || ''}
          onSuccess={handleCreateCustomExercise}
        />
      )}
    </>
  )
}
