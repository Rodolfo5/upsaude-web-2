import { zodResolver } from '@hookform/resolvers/zod'
import InfoIcon from '@mui/icons-material/Info'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { Label } from '@/components/atoms/Label/label'
import DatePickerField from '@/components/molecules/DatePickerField/datePickerField'
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
  useCreateActivity,
  useUpdateActivity,
} from '@/hooks/queries/useHealthPillarActivities'
import useUser from '@/hooks/useUser'
import { ActivityEntity } from '@/types/entities/healthPillar'
import { activitySchema, ActivityFormData } from '@/validations/healthPillar'

import { ActivityModalProps } from './types'

const frequencyOptions = [
  { value: 'Diariamente', label: 'Diariamente' },
  { value: 'Semanalmente', label: 'Semanalmente' },
  { value: 'Quinzenalmente', label: 'Quinzenalmente' },
  { value: 'Mensalmente', label: 'Mensalmente' },
]

const frequencyValueOptions = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
  { value: '4', label: '4x' },
  { value: '5', label: '5x' },
  { value: '6', label: '6x' },
  { value: '7', label: '7x' },
]

const frequencyUnitOptions = [
  { value: 'Dia', label: 'Dia' },
  { value: 'Semana', label: 'Semana' },
  { value: 'Mês', label: 'Mês' },
]

const deadlineValueOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
]

const deadlineUnitOptions = [
  { value: 'Dia', label: 'Dia' },
  { value: 'Semana', label: 'Semana' },
  { value: 'Mês', label: 'Mês' },
]

const unitOptions = [{ value: 'Passos', label: 'Passos' }]

const statusOptions = [
  { value: 'Ativa', label: 'Ativa' },
  { value: 'Desativada', label: 'Desativada' },
  { value: 'Realizada', label: 'Realizada' },
]

// Removido: tipos pré-definidos de atividades - atividades agora têm nome livre

export function ActivityModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  pillarType,
  goals,
  activity,
  defaultGoalId,
  defaultActivityName,
  onSuccess,
}: ActivityModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createActivity, isPending: isCreating } =
    useCreateActivity()
  const { mutateAsync: updateActivity, isPending: isUpdating } =
    useUpdateActivity()

  const isEditing = !!activity
  const isBiomarkerPillar = pillarType === 'Biomarcadores de Saúde'

  const goalOptions = goals.map((goal) => ({
    value: goal.id,
    label: goal.type === 'Outros' 
      ? goal.customTitle || 'Meta Customizada' 
      : goal.type || goal.name || 'Meta',
  }))

  const isLifestylePillar = pillarType === 'Estilo de Vida'
  const isWeighingActivity =
    defaultActivityName === 'Atividade de pesagem' ||
    activity?.name === 'Atividade de pesagem'
  const isStepsGoalActivity =
    defaultActivityName === 'Meta de passos' ||
    activity?.name === 'Meta de passos'
  const isCalorieExpenditureGoalActivity =
    defaultActivityName === 'Meta de gasto calórico' ||
    activity?.name === 'Meta de gasto calórico'

  const formSchema = isLifestylePillar
    ? activitySchema.extend({
        goalId: z.string(),
        activitySelect: z.string().optional(),
        frequencyValue: z.string().optional(),
        frequencyUnit: z.string().optional(),
        unit: z.string().optional(),
        quantity: z.string().optional(),
      })
    : activitySchema.extend({
        goalId: z.string().min(1),
        activitySelect: z.string().optional(),
        frequencyValue: z.string().optional(),
        frequencyUnit: z.string().optional(),
        deadlineValue: z.string().optional(),
        deadlineUnit: z.string().optional(),
        unit: z.string().optional(),
        quantity: z.string().optional(),
      })

  const { control, handleSubmit, reset, watch, setValue } = useForm<
    ActivityFormData & {
      goalId: string
      activitySelect?: string
      frequencyValue?: string
      frequencyUnit?: string
      deadlineValue?: string
      deadlineUnit?: string
      unit?: string
      quantity?: string
    }
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalId: defaultGoalId || '',
      name: '',
      description: '',
      frequency: 'Diariamente',
      endDate: undefined,
      status: 'Ativa',
      activitySelect: '',
      frequencyValue: '',
      frequencyUnit: '',
      deadlineValue: '',
      deadlineUnit: '',
      unit: 'Passos',
      quantity: '',
    },
  })

  const selectedGoalId = watch('goalId')

  // Preencher formulário ao editar ou criar
  useEffect(() => {
    if (activity && isOpen) {
      // Edição: manter o nome atual da atividade
      // Parse frequency se for formato "3x Semana"
      let frequencyValue = ''
      let frequencyUnit = ''
      if ((isWeighingActivity || isBiomarkerPillar) && activity.frequency) {
        const match = activity.frequency.match(/^(\d+)x\s*(.+)$/)
        if (match) {
          frequencyValue = match[1]
          frequencyUnit = match[2]
        }
      }

      // Para biomarcadores, usar campos específicos se disponíveis
      let deadlineValue = ''
      let deadlineUnit = ''
      if (isBiomarkerPillar) {
        frequencyValue = activity.frequencyValue || frequencyValue
        frequencyUnit = activity.frequencyUnit || frequencyUnit
        deadlineValue = activity.deadlineValue || ''
        deadlineUnit = activity.deadlineUnit || ''
      }

      // Parse description para meta de passos e meta de gasto calórico (formato JSON)
      let unit = 'Passos'
      let quantity = ''
      if (
        (isStepsGoalActivity || isCalorieExpenditureGoalActivity) &&
        activity.description
      ) {
        try {
          const parsed = JSON.parse(activity.description)
          if (parsed.unit) unit = parsed.unit
          if (parsed.quantity) {
            quantity = new Intl.NumberFormat('pt-BR').format(parsed.quantity)
          }
        } catch {
          // Se não for JSON, manter valores padrão
        }
      }

      reset({
        goalId: activity.goalId,
        name: activity.name,
        description: activity.description || '',
        frequency: activity.frequency || 'Diariamente',
        endDate: activity.endDate
          ? typeof activity.endDate === 'string'
            ? new Date(activity.endDate)
            : activity.endDate
          : undefined,
        status: activity.status,
        activitySelect: '',
        frequencyValue,
        frequencyUnit,
        deadlineValue,
        deadlineUnit,
        unit,
        quantity,
      })
    } else if (!isOpen) {
      // Reset padrão ao fechar
      reset({
        goalId: defaultGoalId || '',
        name: '',
        description: '',
        frequency: 'Diariamente',
        endDate: undefined,
        status: 'Ativa',
        activitySelect: '',
        frequencyValue: '',
        frequencyUnit: '',
        deadlineValue: '',
        deadlineUnit: '',
        unit: isStepsGoalActivity ? 'Passos' : '',
        quantity: '',
      })
    } else if (isOpen && defaultGoalId && !activity) {
      // Criação com goal pré-selecionado
      const selectedGoal = goals.find((g) => g.id === defaultGoalId)
      const goalName = selectedGoal?.name || ''
      // Apenas para biomarcadores: preencher "Medir [Biomarcador]"
      // Ou usar defaultActivityName se fornecido
      const activityName =
        defaultActivityName ||
        (isBiomarkerPillar && goalName ? `Medir ${goalName}` : '')
      reset({
        goalId: defaultGoalId,
        name: activityName,
        description: '',
        frequency: 'Diariamente',
        endDate: undefined,
        status: 'Ativa',
        activitySelect: '',
        frequencyValue: '',
        frequencyUnit: '',
        deadlineValue: '',
        deadlineUnit: '',
        unit: 'Passos',
        quantity: '',
      })
    } else if (isOpen && !activity && defaultActivityName) {
      // Criação sem goal pré-selecionado mas com nome padrão
      reset({
        goalId: defaultGoalId || '',
        name: defaultActivityName,
        description: '',
        frequency: 'Diariamente',
        endDate: undefined,
        status: 'Ativa',
        activitySelect: '',
        frequencyValue: '',
        frequencyUnit: '',
        deadlineValue: '',
        deadlineUnit: '',
        unit: isStepsGoalActivity ? 'Passos' : '',
        quantity: '',
      })
    }
  }, [
    activity,
    isOpen,
    reset,
    defaultGoalId,
    goals,
    isBiomarkerPillar,
    defaultActivityName,
    isWeighingActivity,
    isStepsGoalActivity,
    isCalorieExpenditureGoalActivity,
  ])

  // Atualizar nome quando goalId for selecionado manualmente no dropdown
  useEffect(() => {
    if (
      !isEditing &&
      isOpen &&
      selectedGoalId &&
      !activity &&
      isBiomarkerPillar
    ) {
      // Apenas para biomarcadores: preencher "Medir [Biomarcador]"
      const selectedGoal = goals.find((g) => g.id === selectedGoalId)
      const goalName = selectedGoal?.name || ''
      if (goalName) {
        setValue('name', `Aferir ${goalName}`)
      }
    }
  }, [
    selectedGoalId,
    isEditing,
    isOpen,
    activity,
    goals,
    setValue,
    isBiomarkerPillar,
  ])

  const onSubmit = async (
    data: ActivityFormData & {
      goalId: string
      frequencyValue?: string
      frequencyUnit?: string
      deadlineValue?: string
      deadlineUnit?: string
      unit?: string
      quantity?: string
    },
  ) => {
    try {
      const goalId = data.goalId || ''
      // Para atividade de pesagem ou biomarcadores, combinar frequencyValue e frequencyUnit
      let frequency = data.frequency
      if (
        (isWeighingActivity || isBiomarkerPillar) &&
        data.frequencyValue &&
        data.frequencyUnit
      ) {
        frequency = `${data.frequencyValue}x ${data.frequencyUnit}`
      }

      // Para biomarcadores, calcular endDate baseado no prazo
      let endDate = data.endDate
      if (
        isBiomarkerPillar &&
        data.deadlineValue &&
        data.deadlineUnit &&
        !isEditing
      ) {
        const deadlineValue = parseInt(data.deadlineValue)
        const now = new Date()
        if (data.deadlineUnit === 'Dia') {
          endDate = new Date(
            now.getTime() + deadlineValue * 24 * 60 * 60 * 1000,
          )
        } else if (data.deadlineUnit === 'Semana') {
          endDate = new Date(
            now.getTime() + deadlineValue * 7 * 24 * 60 * 60 * 1000,
          )
        } else if (data.deadlineUnit === 'Mês') {
          endDate = new Date(now)
          endDate.setMonth(endDate.getMonth() + deadlineValue)
        }
      }

      // Para meta de passos e meta de gasto calórico, criar description como JSON
      let description = data.description
      if (isStepsGoalActivity && data.unit && data.quantity) {
        description = JSON.stringify({
          unit: data.unit,
          quantity: parseFloat(
            data.quantity.replace(/\./g, '').replace(',', '.'),
          ),
        })
      } else if (isCalorieExpenditureGoalActivity && data.quantity) {
        description = JSON.stringify({
          unit: 'kcal',
          quantity: parseFloat(
            data.quantity.replace(/\./g, '').replace(',', '.'),
          ),
        })
      }

      // Para atividade de pesagem, meta de passos e meta de gasto calórico, usar valores padrão para endDate e status
      const finalEndDate =
        isWeighingActivity ||
        isStepsGoalActivity ||
        isCalorieExpenditureGoalActivity
          ? undefined
          : endDate
      const status =
        isWeighingActivity ||
        isStepsGoalActivity ||
        isCalorieExpenditureGoalActivity ||
        isBiomarkerPillar
          ? 'Ativa'
          : data.status

      // Preparar dados adicionais para biomarcadores
      const additionalData: Partial<ActivityEntity> = {}
      if (isBiomarkerPillar) {
        if (data.deadlineValue)
          additionalData.deadlineValue = data.deadlineValue
        if (data.deadlineUnit) additionalData.deadlineUnit = data.deadlineUnit
        if (data.frequencyValue)
          additionalData.frequencyValue = data.frequencyValue
        if (data.frequencyUnit)
          additionalData.frequencyUnit = data.frequencyUnit
      }

      if (isEditing && activity) {
        await updateActivity({
          patientId,
          planId,
          pillarId,
          goalId: goalId || activity.goalId,
          activityId: activity.id,
          data: {
            name: data.name,
            description,
            frequency,
            endDate: finalEndDate,
            status,
            ...additionalData,
          },
        })
      } else {
        await createActivity({
          patientId,
          planId,
          pillarId,
          goalId,
          data: {
            name: data.name,
            description,
            frequency,
            endDate: finalEndDate,
            status,
            doctorId: currentUser?.id || '',
            ...additionalData,
          },
        })
      }
      setIsOpen(false)
      reset({
        goalId: defaultGoalId || '',
        name: '',
        description: '',
        frequency: 'Diariamente',
        endDate: undefined,
        status: 'Ativa',
        activitySelect: '',
        frequencyValue: '',
        frequencyUnit: '',
        deadlineValue: '',
        deadlineUnit: '',
        unit: isStepsGoalActivity ? 'Passos' : '',
        quantity: '',
      })
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar atividade:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset({
      goalId: defaultGoalId || '',
      name: '',
      description: '',
      frequency: 'Diariamente',
      endDate: undefined,
      status: 'Ativa',
      activitySelect: '',
      frequencyValue: '',
      frequencyUnit: '',
      deadlineValue: '',
      deadlineUnit: '',
      unit: isStepsGoalActivity ? 'Passos' : '',
      quantity: '',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="text-xl font-normal text-gray-700">
          {isStepsGoalActivity
            ? 'Meta de passos diários'
            : isCalorieExpenditureGoalActivity
              ? 'Meta de gasto calórico'
              : isWeighingActivity
                ? 'Atividade de pesagem'
                : isBiomarkerPillar
                  ? isEditing
                    ? 'Editar atividade de medição'
                    : 'Criar atividade de medição'
                  : isEditing
                    ? 'Editar atividade'
                    : 'Cadastrar atividade'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isStepsGoalActivity ? (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <SelectField
                    name="unit"
                    control={control}
                    label="Unidade"
                    options={unitOptions}
                    placeholder="Selecione"
                    searchable={false}
                  />
                </div>
                <div className="flex-1">
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field, fieldState: { error } }) => {
                      const handleChange = (
                        e: React.ChangeEvent<HTMLInputElement>,
                      ) => {
                        const value = e.target.value.replace(/\D/g, '')
                        const formatted = value
                          ? new Intl.NumberFormat('pt-BR').format(
                              parseInt(value),
                            )
                          : ''
                        field.onChange(formatted)
                      }
                      return (
                        <div className="flex w-full flex-col">
                          <div className="relative">
                            <Label
                              htmlFor="quantity"
                              variant={error ? 'error' : 'default'}
                              className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                            >
                              Quantidade
                            </Label>
                            <Input
                              {...field}
                              value={field.value || ''}
                              onChange={handleChange}
                              placeholder="0"
                              type="text"
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
                      )
                    }}
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <InfoIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Confirme se o paciente possui meios de monitoramento (ex:
                  relógio, aplicativo ou outro recurso). Isso garante que as
                  metas sejam acompanhadas de forma realista e segura.
                </p>
              </div>
            </>
          ) : isCalorieExpenditureGoalActivity ? (
            <>
              <Controller
                name="quantity"
                control={control}
                render={({ field, fieldState: { error } }) => {
                  const handleChange = (
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) => {
                    const value = e.target.value.replace(/\D/g, '')
                    const formatted = value
                      ? new Intl.NumberFormat('pt-BR').format(parseInt(value))
                      : ''
                    field.onChange(formatted)
                  }
                  return (
                    <div className="flex w-full flex-col">
                      <div className="relative">
                        <Label
                          htmlFor="quantity"
                          variant={error ? 'error' : 'default'}
                          className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                        >
                          Quantidade (kcal)
                        </Label>
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={handleChange}
                          placeholder="0"
                          type="text"
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
                  )
                }}
              />
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <InfoIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Confirme se o paciente possui meios de monitoramento (ex:
                  relógio, aplicativo ou outro recurso). Isso garante que as
                  metas sejam acompanhadas de forma realista e segura.
                </p>
              </div>
            </>
          ) : isBiomarkerPillar ? (
            <>
              <SelectField
                name="goalId"
                control={control}
                label="Selecione o biomarcador"
                options={goalOptions}
                placeholder="Selecione o biomarcador"
                searchable={false}
              />

              <InputField
                name="name"
                control={control}
                label="Nome"
                placeholder="Digite o nome da atividade"
                disabled={!isEditing && !!selectedGoalId}
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <SelectField
                    name="frequencyValue"
                    control={control}
                    label="Frequência"
                    options={frequencyValueOptions}
                    placeholder="Selecione"
                    searchable={false}
                  />
                </div>
                <div className="flex-1">
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

              <div className="flex gap-3">
                <div className="flex-1">
                  <SelectField
                    name="deadlineValue"
                    control={control}
                    label="Prazo"
                    options={deadlineValueOptions}
                    placeholder="Selecione"
                    searchable={false}
                  />
                </div>
                <div className="flex-1">
                  <SelectField
                    name="deadlineUnit"
                    control={control}
                    label=""
                    options={deadlineUnitOptions}
                    placeholder="Selecione"
                    searchable={false}
                  />
                </div>
              </div>

              <TextareaField
                name="description"
                control={control}
                label="Orientações ao paciente"
                placeholder="Digite as orientações ao paciente..."
                rows={4}
              />
            </>
          ) : (
            <>
              {!isLifestylePillar && (
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
                name="name"
                control={control}
                label="Nome"
                placeholder="Digite o nome da atividade"
                disabled={!isEditing && isBiomarkerPillar && !!selectedGoalId}
              />

              <TextareaField
                name="description"
                control={control}
                label={
                  isWeighingActivity ? 'Orientações ao paciente' : 'Descrição'
                }
                placeholder={
                  isWeighingActivity
                    ? 'Digite as orientações ao paciente...'
                    : 'Descreva a atividade...'
                }
              />
            </>
          )}

          {!isStepsGoalActivity &&
            !isCalorieExpenditureGoalActivity &&
            !isBiomarkerPillar && (
              <>
                {isWeighingActivity ? (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <SelectField
                        name="frequencyValue"
                        control={control}
                        label="Frequência"
                        options={frequencyValueOptions}
                        placeholder="Selecione"
                        searchable={false}
                      />
                    </div>
                    <div className="flex-1">
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
                ) : (
                  <SelectField
                    name="frequency"
                    control={control}
                    label="Frequência"
                    options={frequencyOptions}
                    placeholder="Selecione a frequência"
                    searchable={false}
                  />
                )}

                {!isWeighingActivity && (
                  <>
                    <DatePickerField
                      name="endDate"
                      control={control}
                      label="Data de término"
                      placeholder="Selecione a data"
                    />

                    <SelectField
                      name="status"
                      control={control}
                      label="Status"
                      options={statusOptions}
                      placeholder="Selecione o status"
                      searchable={false}
                    />
                  </>
                )}
              </>
            )}

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
              {isStepsGoalActivity || isCalorieExpenditureGoalActivity
                ? 'Salvar'
                : isBiomarkerPillar
                  ? isEditing
                    ? 'Atualizar'
                    : 'Adicionar'
                  : isEditing
                    ? 'Atualizar'
                    : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
