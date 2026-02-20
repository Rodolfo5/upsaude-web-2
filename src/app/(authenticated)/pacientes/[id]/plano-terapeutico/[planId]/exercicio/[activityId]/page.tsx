'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { Label } from '@/components/atoms/Label/label'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import firebaseApp from '@/config/firebase/firebase'
import {
  modalityOptions,
  intensityOptions,
  frequencyValueOptions,
  frequencyUnitOptions,
  getCategoryOptions,
  allowsDistance,
} from '@/constants/exerciseRecommendation'
import {
  useActivity,
  useCreateActivity,
  useUpdateActivity,
} from '@/hooks/queries/useHealthPillarActivities'
import { useLifestyleCategories } from '@/hooks/queries/useHealthPillarLifestyleCategories'
import { useTherapeuticPlanPermissions } from '@/hooks/useTherapeuticPlanPermissions'
import useUser from '@/hooks/useUser'
import {
  ActivityEntity,
  HealthPillarEntity,
  TrainingPrescriptionEntity,
} from '@/types/entities/healthPillar'
import {
  exerciseRecommendationSchema,
  ExerciseRecommendationFormData,
  trainingPrescriptionSchema,
  TrainingPrescriptionFormData,
} from '@/validations/healthPillar'

interface Props {
  params: Promise<{
    id: string
    planId: string
    activityId: string
  }>
}

export default function ExerciseRecommendationPage({ params }: Props) {
  const { id: patientId, planId, activityId } = use(params)
  const router = useRouter()
  const { currentUser } = useUser()
  const { permissions, isLoading: isLoadingPermissions } =
    useTherapeuticPlanPermissions(planId, patientId)

  const isNewActivity = activityId === 'new'

  // Verificar permissão para editar exercício
  const canEdit = permissions.canEditExercise()

  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (!canEdit && !isLoadingPermissions) {
      router.push(
        `/pacientes/${patientId}/plano-terapeutico/${planId}?tab=pilares`,
      )
    }
  }, [canEdit, isLoadingPermissions, router, patientId, planId])

  // Buscar pilar de Estilo de Vida
  const [pillarId, setPillarId] = useState<string>('')
  const { data: existingActivity } = useActivity(
    patientId,
    planId,
    pillarId,
    activityId,
  )
  const { data: categories = [] } = useLifestyleCategories(
    patientId,
    planId,
    pillarId,
  )
  const { mutateAsync: createActivity, isPending: isCreating } =
    useCreateActivity()
  const { mutateAsync: updateActivity, isPending: isUpdating } =
    useUpdateActivity()

  // Gerenciar prescrições localmente (serão salvas junto com a atividade)
  const [localPrescriptions, setLocalPrescriptions] = useState<
    TrainingPrescriptionEntity[]
  >([])
  const [isCreatingPrescription, setIsCreatingPrescription] = useState(false)
  const [isUpdatingPrescription, setIsUpdatingPrescription] = useState(false)

  const [selectedPrescription, setSelectedPrescription] =
    useState<TrainingPrescriptionEntity | null>(null)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)

  // Buscar pillarId de Estilo de Vida
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

        const lifestylePillar = pillars.find(
          (p: HealthPillarEntity) => p.type === 'Estilo de Vida',
        )
        if (lifestylePillar) {
          setPillarId(lifestylePillar.id)
        } else {
          console.warn('Pilar de Estilo de Vida não encontrado')
        }
      } catch (error) {
        console.error('Erro ao buscar pilar:', error)
      }
    }
    fetchPillarId()
  }, [patientId, planId])

  const movementsCategory =
    categories.find((c) => c.type === 'Movimentos - Passos') ||
    categories.find((c) => c.type === 'Movimentos - Gasto Calórico')
  const defaultGoalId = movementsCategory?.id || ''

  const { control, handleSubmit, reset, watch } =
    useForm<ExerciseRecommendationFormData>({
      resolver: zodResolver(exerciseRecommendationSchema),
      defaultValues: {
        name: 'Recomendação de exercício',
        modality: [],
        category: [],
        intensity: '',
        frequencyValue: '',
        frequencyUnit: '',
        patientGuidelines: '',
        distanceKm: undefined,
        status: 'Ativa',
      },
    })

  const selectedModalities = watch('modality')
  const selectedCategories = watch('category')

  // Converter para array se for string (compatibilidade com dados antigos)
  const modalitiesArray = Array.isArray(selectedModalities)
    ? selectedModalities
    : selectedModalities
      ? [selectedModalities]
      : []

  const categoriesArray = Array.isArray(selectedCategories)
    ? selectedCategories
    : selectedCategories
      ? [selectedCategories]
      : []

  // Verificar se alguma categoria selecionada permite distância
  const showDistanceField = categoriesArray.some((cat) => allowsDistance(cat))

  // Carregar dados da atividade existente
  useEffect(() => {
    if (existingActivity && !isNewActivity && pillarId) {
      // Converter strings para arrays se necessário (compatibilidade)
      const modalityValue = existingActivity.modality
        ? Array.isArray(existingActivity.modality)
          ? existingActivity.modality
          : [existingActivity.modality]
        : []

      const categoryValue = existingActivity.category
        ? Array.isArray(existingActivity.category)
          ? existingActivity.category
          : [existingActivity.category]
        : []

      reset({
        name: existingActivity.name,
        modality: modalityValue,
        category: categoryValue,
        intensity: existingActivity.intensity || '',
        frequencyValue: existingActivity.frequencyValue || '',
        frequencyUnit: existingActivity.frequencyUnit || '',
        patientGuidelines: existingActivity.patientGuidelines || '',
        distanceKm: existingActivity.distanceKm,
        status: existingActivity.status || 'Ativa',
      })
    }
  }, [existingActivity, isNewActivity, reset, pillarId])

  // Carregar prescrições separadamente para garantir que sejam carregadas
  useEffect(() => {
    if (existingActivity && !isNewActivity) {
      // Carregar prescrições da atividade
      const prescriptions =
        existingActivity.trainingPrescriptions &&
          Array.isArray(existingActivity.trainingPrescriptions)
          ? existingActivity.trainingPrescriptions
          : []
      setLocalPrescriptions(prescriptions)
    } else if (isNewActivity) {
      setLocalPrescriptions([])
    }
  }, [existingActivity, isNewActivity])

  const onSubmit = async (data: ExerciseRecommendationFormData) => {
    try {
      // Preparar dados com prescrições incluídas
      const activityData: Partial<ActivityEntity> = {
        name: data.name,
        modality: data.modality,
        category: data.category,
        intensity: data.intensity,
        frequencyValue: data.frequencyValue,
        frequencyUnit: data.frequencyUnit,
        patientGuidelines: data.patientGuidelines,
        distanceKm: data.distanceKm,
        status: data.status,
        trainingPrescriptions: localPrescriptions, // Incluir prescrições
        doctorId: currentUser?.id || '',
      }

      if (isNewActivity) {
        const newActivity = await createActivity({
          patientId,
          planId,
          pillarId,
          goalId: defaultGoalId,
          data: activityData,
        })
        // Redireciona para a página de edição
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${planId}/exercicio/${newActivity.id}`,
        )
      } else {
        await updateActivity({
          patientId,
          planId,
          pillarId,
          goalId: defaultGoalId,
          activityId,
          data: activityData,
        })
        // Volta para a página do plano terapêutico
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${planId}#movimentos`,
        )
      }
    } catch (error) {
      console.error('Erro ao salvar recomendação de exercício:', error)
    }
  }

  const handleAddPrescription = () => {
    setSelectedPrescription(null)
    setShowPrescriptionForm(true)
  }

  const handleEditPrescription = (prescription: TrainingPrescriptionEntity) => {
    setSelectedPrescription(prescription)
    setShowPrescriptionForm(true)
  }

  const handleDeletePrescription = (
    prescription: TrainingPrescriptionEntity,
  ) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a prescrição "${prescription.title}"?`,
      )
    ) {
      return
    }

    // Remover da lista local
    setLocalPrescriptions((prev) =>
      prev.filter((p) => p.id !== prescription.id),
    )
  }

  // Formulário de prescrição de treino
  const {
    control: prescriptionControl,
    handleSubmit: handlePrescriptionSubmit,
    reset: resetPrescription,
  } = useForm<TrainingPrescriptionFormData>({
    resolver: zodResolver(trainingPrescriptionSchema),
    defaultValues: {
      title: '',
      description: '',
      order: undefined,
    },
  })

  // Preencher formulário ao editar
  useEffect(() => {
    if (selectedPrescription && showPrescriptionForm) {
      resetPrescription({
        title: selectedPrescription.title,
        description: selectedPrescription.description || '',
        order: selectedPrescription.order,
      })
    } else if (!showPrescriptionForm) {
      resetPrescription({
        title: '',
        description: '',
        order: undefined,
      })
    }
  }, [selectedPrescription, showPrescriptionForm, resetPrescription])

  const onPrescriptionSubmit = (data: TrainingPrescriptionFormData) => {
    try {
      const isEditing = !!selectedPrescription
      const now = new Date()

      if (isEditing && selectedPrescription) {
        setIsUpdatingPrescription(true)
        // Atualizar prescrição existente na lista local
        setLocalPrescriptions((prev) =>
          prev.map((p) =>
            p.id === selectedPrescription.id
              ? {
                ...p,
                title: data.title,
                description: data.description || '',
                updatedAt: now,
              }
              : p,
          ),
        )
        setIsUpdatingPrescription(false)
      } else {
        setIsCreatingPrescription(true)
        // Adicionar nova prescrição à lista local
        const newPrescription: TrainingPrescriptionEntity = {
          id: `temp-${Date.now()}`, // ID temporário (será substituído quando salvar)
          activityId: activityId || 'temp',
          title: data.title,
          description: data.description || '',
          order: localPrescriptions.length + 1,
          doctorId: currentUser?.id || '',
          createdAt: now,
          updatedAt: now,
        }
        setLocalPrescriptions((prev) => [...prev, newPrescription])
        setIsCreatingPrescription(false)
      }

      setShowPrescriptionForm(false)
      setSelectedPrescription(null)
      resetPrescription({
        title: '',
        description: '',
        order: undefined,
      })
    } catch (error) {
      console.error('Erro ao salvar prescrição de treino:', error)
      setIsCreatingPrescription(false)
      setIsUpdatingPrescription(false)
    }
  }

  const handleCancelPrescription = () => {
    setShowPrescriptionForm(false)
    setSelectedPrescription(null)
    resetPrescription({
      title: '',
      description: '',
      order: undefined,
    })
  }

  const handleBack = () => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}#movimentos`,
    )
  }

  if (!pillarId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto w-[90%]">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="text-gray-700 hover:text-gray-900"
          >
            <ArrowBackOutlinedIcon />
          </Button>
          <h1 className="text-2xl font-semibold text-primary-700">
            Adicionar recomendação de exercício
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                name="modality"
                control={control}
                label="Modalidade"
                options={modalityOptions}
                placeholder="Selecione a(s) modalidade(s)"
                searchable={true}
                multiple={false}
              />

              <SelectField
                name="category"
                control={control}
                label="Categoria / Foco"
                options={getCategoryOptions(modalitiesArray)}
                placeholder="Selecione a(s) categoria(s) / foco(s)"
                searchable={true}
                multiple={true}
                disabled={modalitiesArray.length === 0}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                name="intensity"
                control={control}
                label="Intensidade"
                options={intensityOptions}
                placeholder="Selecione a intensidade"
                searchable={false}
              />

              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  name="frequencyValue"
                  control={control}
                  label="Frequência"
                  options={frequencyValueOptions}
                  placeholder="Selecione"
                  searchable={false}
                />
                <SelectField
                  name="frequencyUnit"
                  control={control}
                  label=""
                  options={frequencyUnitOptions}
                  placeholder="Selecione"
                  searchable={false}
                />
              </div>
            </div>

            {/* Campo de Distância (km) para Caminhada e Corrida */}
            {showDistanceField && (
              <div className="mt-6">
                <Controller
                  name="distanceKm"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <div className="flex w-full flex-col">
                      <div className="relative">
                        <Label
                          htmlFor="distanceKm"
                          variant={error ? 'error' : 'default'}
                          className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                        >
                          Distância (km)
                        </Label>
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(
                              value === '' ? undefined : parseFloat(value),
                            )
                          }}
                          placeholder="Ex: 5"
                          type="number"
                          step="0.1"
                          min="0"
                          variant={error ? 'error' : 'default'}
                          className="rounded-md border border-[#530570] text-gray-700 focus:border-purple-600 focus:ring-0"
                        />
                      </div>
                      {error && (
                        <p className="mt-1 text-xs text-red-600">
                          {error.message?.toString()}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}

            {/* Seção de Prescrições de Treino */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Prescrições de treino
                </h3>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleAddPrescription}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <AddOutlinedIcon fontSize="small" />
                  Prescrever treino
                </Button>
              </div>

              {/* Formulário Inline de Prescrição */}
              {showPrescriptionForm && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
                  <h4 className="mb-4 text-xl font-normal text-gray-700">
                    {selectedPrescription
                      ? 'Editar prescrição de treino'
                      : 'Criar prescrição de treino'}
                  </h4>
                  <div className="space-y-4">
                    <InputField
                      name="title"
                      control={prescriptionControl}
                      label="Título"
                      placeholder="Treino com a bola parada"
                    />

                    <TextareaField
                      name="description"
                      control={prescriptionControl}
                      label="Descrição"
                      placeholder="Descreva os exercícios e orientações do treino..."
                      rows={6}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={handleCancelPrescription}
                        variant="link"
                        disabled={
                          isCreatingPrescription || isUpdatingPrescription
                        }
                        className="hover:no-underline"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handlePrescriptionSubmit(onPrescriptionSubmit)}
                        loading={
                          isCreatingPrescription || isUpdatingPrescription
                        }
                        disabled={
                          isCreatingPrescription || isUpdatingPrescription
                        }
                      >
                        {selectedPrescription ? 'Atualizar' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Prescrições */}
              {localPrescriptions.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white">
                  {localPrescriptions.map((prescription, index) => (
                    <div
                      key={prescription.id}
                      className={`flex items-center justify-between px-4 py-3 ${index < localPrescriptions.length - 1
                          ? 'border-b border-purple-200'
                          : ''
                        }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {index + 1}. {prescription.title}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleEditPrescription(prescription)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDeletePrescription(prescription)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <CloseIcon fontSize="small" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <TextareaField
                name="patientGuidelines"
                control={control}
                label="Orientações ao paciente"
                placeholder="Digite as orientações ao paciente..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isCreating || isUpdating}
              disabled={isCreating || isUpdating}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
