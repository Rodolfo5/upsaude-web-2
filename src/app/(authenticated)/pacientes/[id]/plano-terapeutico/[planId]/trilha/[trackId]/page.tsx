'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

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
import firebaseApp from '@/config/firebase/firebase'
import {
  useExercisesByTrack,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from '@/hooks/queries/useHealthPillarExercises'
import {
  useCreateTrack,
  useUpdateTrack,
  useTrack,
} from '@/hooks/queries/useHealthPillarTracks'
import { usePatient } from '@/hooks/usePatient'
import useUser from '@/hooks/useUser'
import {
  ExerciseEntity,
  ExerciseType,
  TrackStatus,
  HealthPillarEntity,
} from '@/types/entities/healthPillar'
import { trackSchema } from '@/validations/healthPillar'

interface Props {
  params: Promise<{
    id: string
    planId: string
    trackId: string
  }>
}

const exerciseTypeOptions: Array<{ value: ExerciseType; label: string }> = [
  { value: 'Cartas de gratidão', label: 'Cartas de gratidão' },
  { value: 'Exercícios de respiração', label: 'Exercícios de respiração' },
  { value: 'Meditação guiada', label: 'Meditação guiada' },
  { value: 'Microreflexões', label: 'Microreflexões' },
  { value: 'Exercícios de autoestima', label: 'Exercícios de autoestima' },
  {
    value: 'Autoreflexões de melhorias',
    label: 'Autoreflexões de melhorias',
  },
]

export default function TrackPage({ params }: Props) {
  const { id: patientId, planId, trackId } = use(params)
  const router = useRouter()
  const { currentUser } = useUser()
  const { patient } = usePatient(patientId)

  const isNewTrack = trackId === 'new'

  // Buscar pilar de Saúde Mental
  const [pillarId, setPillarId] = useState<string>('')
  const { data: existingTrack } = useTrack(
    patientId,
    planId,
    pillarId,
    undefined, // goalId não é necessário quando temos trackId
    trackId,
  )
  const { data: exercises = [] } = useExercisesByTrack(
    patientId,
    planId,
    pillarId,
    trackId,
  )

  const { mutateAsync: createTrack, isPending: isCreating } = useCreateTrack()
  const { mutateAsync: updateTrack, isPending: isUpdating } = useUpdateTrack()
  const { mutateAsync: createExercise } = useCreateExercise()
  const { mutateAsync: updateExercise } = useUpdateExercise()
  const { mutateAsync: deleteExercise } = useDeleteExercise()

  const [selectedExercises, setSelectedExercises] = useState<
    Array<{
      type: ExerciseType | 'custom'
      name: string
      description?: string
      tempId?: string
    }>
  >([])
  const [isCreateExerciseModalOpen, setIsCreateExerciseModalOpen] =
    useState(false)
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseEntity | null>(null)
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([])
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<
    number | null
  >(null)
  const [dragOverExerciseIndex, setDragOverExerciseIndex] = useState<
    number | null
  >(null)

  // Control separado para o SelectField de exercícios
  const exerciseControl = useForm<{ exerciseSelect: string }>({
    defaultValues: {
      exerciseSelect: '',
    },
  })

  // Buscar pillarId de Saúde Mental
  useEffect(() => {
    const fetchPillarId = async () => {
      if (!patientId || !planId || planId === 'new') return

      try {
        const { collection, getDocs, getFirestore } = await import(
          'firebase/firestore'
        )
        const firestore = getFirestore(firebaseApp)

        const pillarsRef = collection(
          firestore,
          'users',
          patientId,
          'therapeuticPlans',
          planId,
          'healthPillars',
        )
        const snapshot = await getDocs(pillarsRef)

        const pillars: HealthPillarEntity[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            patientId: data.patientId,
            planId: data.planId,
            type: data.type,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : data.createdAt,
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate()
              : data.updatedAt,
          } as HealthPillarEntity
        })

        const mentalHealthPillar = pillars.find(
          (p: HealthPillarEntity) => p.type === 'Saúde Mental',
        )
        if (mentalHealthPillar) {
          setPillarId(mentalHealthPillar.id)
        } else {
          console.warn('Pilar de Saúde Mental não encontrado')
        }
      } catch (error) {
        console.error('Erro ao buscar pilar:', error)
      }
    }
    fetchPillarId()
  }, [patientId, planId])

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      name: '',
      description: '',
      observations: '',
      status: 'Não iniciado' as const,
    },
  })

  // Carregar dados da trilha existente
  useEffect(() => {
    if (existingTrack && !isNewTrack && pillarId) {
      reset({
        name: existingTrack.name || '',
        description: existingTrack.description || '',
        observations: existingTrack.observations || '',
        status: existingTrack.status || 'Não iniciado',
      })
    }
  }, [existingTrack, isNewTrack, reset, pillarId])

  // Carregar ordem dos exercícios
  useEffect(() => {
    if (exercises.length > 0) {
      const sorted = [...exercises].sort((a, b) => {
        const orderA = a.order ?? 999
        const orderB = b.order ?? 999
        return orderA - orderB
      })
      setExerciseOrder(sorted.map((e) => e.id))
    }
  }, [exercises])

  const handleAddExercise = () => {
    if (isNewTrack) {
      setIsCreateExerciseModalOpen(true)
    } else {
      setSelectedExercise(null)
      setIsExerciseModalOpen(true)
    }
  }

  const handleAddExerciseFromSelect = (selectedValue: string) => {
    if (!selectedValue) return

    const exerciseType = exerciseTypeOptions.find(
      (opt) => opt.value === selectedValue,
    )
    if (exerciseType) {
      setSelectedExercises([
        ...selectedExercises,
        {
          type: exerciseType.value,
          name: exerciseType.label,
          description: '',
          tempId: `temp-${Date.now()}`,
        },
      ])
      exerciseControl.reset({ exerciseSelect: '' })
    }
  }

  // Drag and drop para ordenação de exercícios
  const handleExerciseDragStart = (index: number) => {
    setDraggedExerciseIndex(index)
  }

  const handleExerciseDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedExerciseIndex === null || draggedExerciseIndex === index) return
    setDragOverExerciseIndex(index)
  }

  const handleExerciseDragLeave = () => {
    setDragOverExerciseIndex(null)
  }

  const handleExerciseDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedExerciseIndex === null || draggedExerciseIndex === dropIndex) {
      setDraggedExerciseIndex(null)
      setDragOverExerciseIndex(null)
      return
    }

    const newExercises = [...selectedExercises]
    const draggedItem = newExercises[draggedExerciseIndex]
    newExercises.splice(draggedExerciseIndex, 1)
    newExercises.splice(dropIndex, 0, draggedItem)
    setSelectedExercises(newExercises)

    setDraggedExerciseIndex(null)
    setDragOverExerciseIndex(null)
  }

  const handleExerciseDragEnd = () => {
    setDraggedExerciseIndex(null)
    setDragOverExerciseIndex(null)
  }

  const handleCreateCustomExercise = (activity: {
    name: string
    description?: string
  }) => {
    setSelectedExercises([
      ...selectedExercises,
      {
        type: 'custom',
        name: activity.name,
        description: activity.description || '',
        tempId: `temp-${Date.now()}`,
      },
    ])
    setIsCreateExerciseModalOpen(false)
  }

  const handleEditExercise = (exercise: ExerciseEntity) => {
    setSelectedExercise(exercise)
    setIsExerciseModalOpen(true)
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!pillarId || !trackId || isNewTrack) return
    try {
      await deleteExercise({
        patientId,
        planId,
        pillarId,
        trackId,
        exerciseId,
      })
    } catch (error) {
      console.error('Erro ao deletar exercício:', error)
    }
  }

  const handleRemoveExerciseFromList = (tempId: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.tempId !== tempId))
  }

  const handleSaveExercise = async (data: {
    type: ExerciseType
    name: string
    description?: string
  }) => {
    if (!pillarId || !trackId) return

    try {
      if (selectedExercise) {
        // Atualizar exercício existente
        await updateExercise({
          patientId,
          planId,
          pillarId,
          trackId,
          exerciseId: selectedExercise.id,
          data: {
            type: data.type,
            name: data.name,
            description: data.description,
          },
        })
      } else {
        // Criar novo exercício
        const maxOrder =
          exercises.length > 0
            ? Math.max(...exercises.map((e) => e.order ?? 0))
            : 0
        await createExercise({
          patientId,
          planId,
          pillarId,
          trackId,
          data: {
            type: data.type,
            name: data.name,
            description: data.description,
            order: maxOrder + 1,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsExerciseModalOpen(false)
      setSelectedExercise(null)
    } catch (error) {
      console.error('Erro ao salvar exercício:', error)
    }
  }

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (
      draggedIndex === null ||
      draggedIndex === dropIndex ||
      !trackId ||
      isNewTrack
    ) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newOrder = [...exerciseOrder]
    const draggedItem = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, draggedItem)
    setExerciseOrder(newOrder)

    // Atualizar ordem no banco
    try {
      await Promise.all(
        newOrder.map((exerciseId, index) => {
          const exercise = exercises.find((e) => e.id === exerciseId)
          if (exercise && exercise.order !== index + 1) {
            return updateExercise({
              patientId,
              planId,
              pillarId,
              trackId,
              exerciseId,
              data: { order: index + 1 },
            })
          }
          return undefined
        }),
      )
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const onSubmit = async (data: {
    name: string
    description?: string
    observations?: string
    status?: TrackStatus
  }) => {
    try {
      if (!pillarId) {
        alert('Erro ao salvar trilha: pilar não encontrado')
        return
      }

      const trackData = {
        name: data.name,
        description: data.description,
        observations: data.observations,
        status: (data.status || 'Não iniciado') as TrackStatus,
        doctorId: currentUser?.id || '',
      }

      if (isNewTrack) {
        const createdTrack = await createTrack({
          patientId,
          planId,
          pillarId,
          goalId: undefined, // Meta não é mais obrigatória
          data: trackData,
        })

        // Criar exercícios após criar a trilha
        if (selectedExercises.length > 0 && createdTrack.id) {
          await Promise.all(
            selectedExercises.map((exercise, index) =>
              createExercise({
                patientId,
                planId,
                pillarId,
                trackId: createdTrack.id,
                data: {
                  type:
                    exercise.type === 'custom'
                      ? 'Autoreflexões de melhorias'
                      : exercise.type,
                  name: exercise.name,
                  description: exercise.description,
                  order: index + 1,
                  doctorId: currentUser?.id || '',
                },
              }),
            ),
          )
        }

        // Redirecionar para a página de edição da trilha criada
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${planId}/trilha/${createdTrack.id}`,
        )
      } else {
        await updateTrack({
          patientId,
          planId,
          pillarId,
          goalId: existingTrack?.goalId || undefined,
          trackId,
          data: trackData,
        })
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${planId}?tab=pilares`,
        )
      }
    } catch (error) {
      console.error('Erro ao salvar trilha:', error)
    }
  }

  const orderedExercises = exerciseOrder
    .map((id) => exercises.find((e) => e.id === id))
    .filter(Boolean) as ExerciseEntity[]

  return (
    <div className="mt-8 px-4 pb-20 md:px-8 lg:px-20">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="flex cursor-pointer items-center gap-2 text-purple-800 hover:text-purple-600"
            onClick={() =>
              router.push(
                `/pacientes/${patientId}/plano-terapeutico/${planId}?tab=pilares`,
              )
            }
          >
            <ArrowBackOutlinedIcon fontSize="medium" />
            <span className="text-xl font-semibold">
              {isNewTrack ? 'Criar trilha de saúde mental' : 'Editar trilha'}
            </span>
          </Button>
          {!isNewTrack && (
            <Badge
              variant="outline"
              className="border-purple-600 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-800"
            >
              Módulo 2
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-[#792EBD]">Paciente | </span>
          {patient?.name || 'Carregando...'}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section>
          <InputField
            name="name"
            control={control}
            label="Nome da trilha *"
            placeholder="Ex: Trilha 1"
            required
          />
        </section>

        <section>
          <TextareaField
            name="description"
            control={control}
            label="Descrição"
            placeholder="Descreva a trilha..."
            rows={3}
          />
        </section>

        {isNewTrack && (
          <>
            {/* Seção: Adicionar exercício */}
            <section>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                Adicionar exercício
              </h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedExercises.map((exercise) => (
                  <Badge
                    key={exercise.tempId}
                    variant="secondary"
                    className="flex items-center gap-1 bg-purple-100 px-3 py-1 text-sm text-purple-800"
                  >
                    {exercise.name}
                    <Button
                      type="button"
                      variant="ghost"
                      icon={<CloseIcon fontSize="small" />}
                      onClick={() =>
                        handleRemoveExerciseFromList(exercise.tempId || '')
                      }
                      className="ml-1 hover:text-purple-900"
                    >
                      {' '}
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectField
                    name="exerciseSelect"
                    control={exerciseControl.control}
                    label=""
                    placeholder="Selecione um exercício"
                    options={exerciseTypeOptions
                      .filter(
                        (opt) =>
                          !selectedExercises.some(
                            (ex) =>
                              ex.type === opt.value || ex.name === opt.label,
                          ),
                      )
                      .map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                    searchable={true}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const value = exerciseControl.getValues('exerciseSelect')
                    if (value) {
                      handleAddExerciseFromSelect(value)
                    }
                  }}
                  disabled={!exerciseControl.watch('exerciseSelect')}
                  variant="outline"
                  className="mt-6"
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
            </section>

            {/* Seção: Ordem */}
            {selectedExercises.length > 0 && (
              <section>
                <h3 className="mb-2 text-base font-semibold text-gray-900">
                  Ordem
                </h3>
                <div className="flex flex-col gap-2">
                  {selectedExercises.map((exercise, index) => (
                    <div
                      key={exercise.tempId}
                      draggable
                      onDragStart={() => handleExerciseDragStart(index)}
                      onDragOver={(e) => handleExerciseDragOver(e, index)}
                      onDragLeave={handleExerciseDragLeave}
                      onDrop={(e) => handleExerciseDrop(e, index)}
                      onDragEnd={handleExerciseDragEnd}
                      className={`flex cursor-move items-center gap-3 rounded-lg border border-[#792EBD] bg-white p-3 transition-all ${
                        draggedExerciseIndex === index
                          ? 'opacity-50'
                          : dragOverExerciseIndex === index
                            ? 'border-purple-400 bg-purple-50 shadow-md'
                            : 'hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <DragIndicatorIcon className="text-[#792EBD]" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {exercise.name}
                        </span>
                        {exercise.description && (
                          <p className="mt-1 text-xs text-gray-600">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        icon={<CloseIcon fontSize="small" />}
                        onClick={() =>
                          handleRemoveExerciseFromList(exercise.tempId || '')
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        {' '}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!isNewTrack && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Exercícios
              </h3>
              <Button
                type="button"
                variant="link"
                className="text-purple-600 hover:text-purple-800"
                onClick={handleAddExercise}
              >
                <AddOutlinedIcon fontSize="small" />
                Adicionar exercício
              </Button>
            </div>
            {orderedExercises.length > 0 ? (
              <div className="flex flex-col gap-2">
                {orderedExercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex cursor-move items-center gap-3 rounded-lg border border-[#792EBD] bg-white p-3 transition-all ${
                      draggedIndex === index
                        ? 'opacity-50'
                        : dragOverIndex === index
                          ? 'border-purple-400 bg-purple-50 shadow-md'
                          : 'hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <DragIndicatorIcon className="text-[#792EBD]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {exercise.type}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {exercise.name}
                        </span>
                      </div>
                      {exercise.description && (
                        <p className="mt-1 text-xs text-gray-600">
                          {exercise.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => handleEditExercise(exercise)}
                        className="text-purple-600 hover:text-purple-800"
                        variant="ghost"
                        icon={<EditOutlinedIcon fontSize="small" />}
                      >
                        {' '}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        icon={<CloseIcon fontSize="small" />}
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        {' '}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">
                Nenhum exercício adicionado. Clique em &quot;Adicionar
                exercício&quot; para começar.
              </p>
            )}
          </section>
        )}

        <section>
          <TextareaField
            name="observations"
            control={control}
            label="Observações"
            placeholder="Fazer um exercício por dia"
            rows={4}
          />
        </section>

        <div className="flex justify-start">
          <Button
            type="submit"
            loading={isCreating || isUpdating}
            disabled={isCreating || isUpdating}
            className="px-8"
          >
            Salvar
          </Button>
        </div>
      </form>

      {/* Modal de Exercício */}
      <ExerciseModal
        isOpen={isExerciseModalOpen}
        setIsOpen={setIsExerciseModalOpen}
        exercise={selectedExercise}
        onSave={handleSaveExercise}
      />

      {/* Modal para criar exercício customizado */}
      {isCreateExerciseModalOpen && (
        <CreateActivityStyleModal
          isOpen={isCreateExerciseModalOpen}
          setIsOpen={setIsCreateExerciseModalOpen}
          patientId={patientId}
          planId={planId}
          pillarId={pillarId}
          goalId=""
          onSuccess={handleCreateCustomExercise}
        />
      )}
    </div>
  )
}

// Modal simples para criar/editar exercício
function ExerciseModal({
  isOpen,
  setIsOpen,
  exercise,
  onSave,
}: {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  exercise: ExerciseEntity | null
  onSave: (data: {
    type: ExerciseType
    name: string
    description?: string
  }) => void
}) {
  const [type, setType] = useState<ExerciseType | ''>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (exercise) {
      setType(exercise.type)
      setName(exercise.name)
      setDescription(exercise.description || '')
    } else {
      setType('')
      setName('')
      setDescription('')
    }
  }, [exercise, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !name) return
    onSave({ type, name, description: description || undefined })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="text-xl font-normal text-gray-700">
          {exercise ? 'Editar exercício' : 'Adicionar exercício'}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo de exercício *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ExerciseType)}
              className="w-full rounded-md border border-[#530570] px-3 py-2 text-gray-700 focus:border-purple-600 focus:ring-0"
              required
            >
              <option value="">Selecione o tipo</option>
              {exerciseTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[#530570] px-3 py-2 text-gray-700 focus:border-purple-600 focus:ring-0"
              placeholder="Digite o nome do exercício"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[#530570] px-3 py-2 text-gray-700 focus:border-purple-600 focus:ring-0"
              placeholder="Descreva o exercício..."
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="link"
              className="hover:no-underline"
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
