/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCreateGoal,
  useUpdateGoal,
} from '@/hooks/queries/useHealthPillarGoals'
import useUser from '@/hooks/useUser'
import { goalSchema, GoalFormData } from '@/validations/healthPillar'

import { GoalModalProps } from './types'

const mentalHealthGoalOptions = [
  { value: 'Qualidade de Sono', label: 'Qualidade de Sono' },
  { value: 'Estresse', label: 'Estresse' },
  { value: 'Humor', label: 'Humor' },
  { value: 'Outros', label: 'Outros' },
]

const statusOptions = [
  { value: 'Ativa', label: 'Ativa' },
  { value: 'Atingida', label: 'Atingida' },
  { value: 'Desativada', label: 'Desativada' },
]

const stressOptions = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'alto', label: 'Alto' },
]

const moodOptions = [
  { value: 'ruim', label: 'Ruim' },
  { value: 'intermediário', label: 'Intermediário' },
  { value: 'bom', label: 'Bom' },
]

export function GoalModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  pillarType,
  goal,
  defaultType,
  onSuccess,
}: GoalModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createGoal, isPending: isCreating } = useCreateGoal()
  const { mutateAsync: updateGoal, isPending: isUpdating } = useUpdateGoal()

  const isEditing = !!goal
  const isMentalHealth = pillarType === 'Saúde Mental'

  const { control, handleSubmit, reset, setValue } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      type: undefined,
      name: '',
      customTitle: '',
      desiredParameter: undefined,
      status: 'Ativa',
    },
  })

  const selectedType = useWatch({
    control,
    name: 'type',
    defaultValue: goal?.type || defaultType,
  })

  useEffect(() => {
    if (goal && isOpen) {
      reset({
        type: goal.type,
        name: goal.name,
        customTitle: goal.customTitle || '',
        desiredParameter: goal.desiredParameter,
        status: goal.status,
      })
    } else if (isOpen && !goal && defaultType) {
      // Criação com tipo pré-selecionado
      reset({
        type: defaultType,
        name: '',
        customTitle: '',
        desiredParameter: undefined,
        status: 'Ativa',
      })
    } else if (!isOpen) {
      reset({
        type: undefined,
        name: '',
        customTitle: '',
        desiredParameter: undefined,
        status: 'Ativa',
      })
    }
  }, [goal, isOpen, reset, defaultType])

  // Resetar parâmetro quando o tipo mudar
  useEffect(() => {
    if (isOpen && !goal && selectedType) {
      setValue('desiredParameter', undefined)
    }
  }, [selectedType, isOpen, goal, setValue])

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (isEditing && goal) {
        await updateGoal({
          patientId,
          planId,
          pillarId,
          goalId: goal.id,
          data: {
            type: isMentalHealth ? (data.type as any) : undefined,
            name: isMentalHealth ? undefined : data.name,
            customTitle: data.type === 'Outros' ? data.customTitle : undefined,
            desiredParameter:
              data.type !== 'Outros' ? data.desiredParameter : undefined,
            status: data.status,
          },
        })
      } else {
        await createGoal({
          patientId,
          planId,
          pillarId,
          data: {
            type: isMentalHealth ? (data.type as any) : undefined,
            name: isMentalHealth ? undefined : data.name,
            customTitle: data.type === 'Outros' ? data.customTitle : undefined,
            desiredParameter:
              data.type !== 'Outros' ? data.desiredParameter : undefined,
            status: data.status,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="text-xl font-normal text-gray-700">
          {isEditing ? 'Editar meta' : 'Cadastrar meta'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isMentalHealth ? (
            <SelectField
              name="type"
              control={control}
              label="Tipo de meta"
              options={mentalHealthGoalOptions}
              placeholder="Selecione o tipo"
              searchable={false}
            />
          ) : (
            <InputField
              name="name"
              control={control}
              label="Nome da meta"
              placeholder="Digite o nome da meta"
            />
          )}

          {isMentalHealth ? (
            <>
              {selectedType === 'Outros' ? (
                <InputField
                  name="customTitle"
                  control={control}
                  label="Título da meta"
                  placeholder="Digite o título da meta"
                  maxLength={50}
                />
              ) : (
                <>
                  {selectedType === 'Qualidade de Sono' && (
                    <Controller
                      name="desiredParameter"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <div className="flex w-full flex-col">
                          <div className="relative">
                            <label className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700">
                              Horas
                            </label>
                            <input
                              type="number"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(
                                  value === '' ? undefined : Number(value),
                                )
                              }}
                              placeholder="Ex: 8"
                              className="w-full rounded-md border border-[#530570] px-3 py-2 text-gray-700 focus:border-purple-600 focus:ring-0"
                            />
                          </div>
                          {error && (
                            <p className="mt-1 text-xs text-red-600">
                              {error.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  )}
                  {selectedType === 'Estresse' && (
                    <SelectField
                      name="desiredParameter"
                      control={control}
                      label="Nível de estresse"
                      options={stressOptions}
                      placeholder="Selecione o nível"
                      searchable={false}
                    />
                  )}
                  {selectedType === 'Humor' && (
                    <SelectField
                      name="desiredParameter"
                      control={control}
                      label="Nível de humor"
                      options={moodOptions}
                      placeholder="Selecione o nível"
                      searchable={false}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <InputField
              name="desiredParameter"
              control={control}
              label="Parâmetro desejável"
              placeholder="Bom"
            />
          )}

          <SelectField
            name="status"
            control={control}
            label="Status"
            options={statusOptions}
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
