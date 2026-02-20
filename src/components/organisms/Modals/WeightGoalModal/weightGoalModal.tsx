/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { Label } from '@/components/atoms/Label/label'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCreateLifestyleCategory,
  useUpdateLifestyleCategory,
} from '@/hooks/queries/useHealthPillarLifestyleCategories'
import useUser from '@/hooks/useUser'
import { LifestyleCategoryEntity } from '@/types/entities/healthPillar'

interface WeightGoalModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  category?: LifestyleCategoryEntity | null
  onSuccess?: () => void
}

const objectiveOptions = [
  { value: 'Ganhar', label: 'Ganhar' },
  { value: 'Perder', label: 'Perder' },
]

const deadlineUnitOptions = [
  { value: 'Dias', label: 'Dias' },
  { value: 'Semanas', label: 'Semanas' },
  { value: 'Meses', label: 'Meses' },
]

const statusOptions = [
  { value: 'Ativa', label: 'Ativa' },
  { value: 'Atingida', label: 'Atingida' },
  { value: 'Desativada', label: 'Desativada' },
]

const weightGoalSchema = z.object({
  currentWeight: z.string().min(1, 'O peso atual é obrigatório'),
  objective: z.enum(['Ganhar', 'Perder'], {
    required_error: 'O objetivo é obrigatório',
  }),
  quantity: z.string().min(1, 'A quantidade é obrigatória'),
  deadline: z.string().min(1, 'O prazo é obrigatório'),
  deadlineUnit: z.enum(['Dias', 'Semanas', 'Meses'], {
    required_error: 'A unidade do prazo é obrigatória',
  }),
  patientGuidelines: z.string().optional(),
  status: z.enum(['Ativa', 'Atingida', 'Desativada'], {
    required_error: 'O status é obrigatório',
  }),
})

type WeightGoalFormData = z.infer<typeof weightGoalSchema>

interface WeightGoalData {
  currentWeight: number
  objective: 'Ganhar' | 'Perder'
  quantity: number
  deadline: number
  deadlineUnit: 'Dias' | 'Semanas' | 'Meses'
  patientGuidelines?: string
}

export function WeightGoalModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  category,
  onSuccess,
}: WeightGoalModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createCategory, isPending: isCreating } =
    useCreateLifestyleCategory()
  const { mutateAsync: updateCategory, isPending: isUpdating } =
    useUpdateLifestyleCategory()

  const isEditing = !!category

  const { control, handleSubmit, reset } = useForm<WeightGoalFormData>({
    resolver: zodResolver(weightGoalSchema),
    defaultValues: {
      currentWeight: '',
      objective: 'Ganhar',
      quantity: '',
      deadline: '',
      deadlineUnit: 'Semanas',
      patientGuidelines: '',
      status: 'Ativa',
    },
  })

  useEffect(() => {
    if (category && isOpen) {
      // Parse desiredParameter para extrair dados
      let weightData: WeightGoalData | null = null
      if (category.desiredParameter) {
        try {
          // Tenta fazer parse como JSON
          if (typeof category.desiredParameter === 'string') {
            weightData = JSON.parse(category.desiredParameter)
          } else if (typeof category.desiredParameter === 'object') {
            weightData = category.desiredParameter as any
          }
        } catch {
          // Se não for JSON válido, tenta como número simples
          if (typeof category.desiredParameter === 'number') {
            weightData = {
              currentWeight: category.desiredParameter,
              objective: 'Ganhar',
              quantity: 0,
              deadline: 0,
              deadlineUnit: 'Semanas',
            }
          } else if (typeof category.desiredParameter === 'string') {
            const numValue = parseFloat(category.desiredParameter)
            if (!isNaN(numValue)) {
              weightData = {
                currentWeight: numValue,
                objective: 'Ganhar',
                quantity: 0,
                deadline: 0,
                deadlineUnit: 'Semanas',
              }
            }
          }
        }
      }

      reset({
        currentWeight: weightData?.currentWeight?.toString() || '',
        objective: weightData?.objective || 'Ganhar',
        quantity: weightData?.quantity?.toString() || '',
        deadline: weightData?.deadline?.toString() || '',
        deadlineUnit: weightData?.deadlineUnit || 'Semanas',
        patientGuidelines: weightData?.patientGuidelines || '',
        status: category.status,
      })
    } else if (!isOpen) {
      reset({
        currentWeight: '',
        objective: 'Ganhar',
        quantity: '',
        deadline: '',
        deadlineUnit: 'Semanas',
        patientGuidelines: '',
        status: 'Ativa',
      })
    }
  }, [category, isOpen, reset])

  const onSubmit = async (data: WeightGoalFormData) => {
    try {
      // Converter strings para números
      const weightData: WeightGoalData = {
        currentWeight: parseFloat(data.currentWeight.replace(',', '.')),
        objective: data.objective,
        quantity: parseFloat(data.quantity.replace(',', '.')),
        deadline: parseInt(data.deadline),
        deadlineUnit: data.deadlineUnit,
        patientGuidelines: data.patientGuidelines || undefined,
      }

      // Salvar como objeto Firestore (atributos separados)
      const desiredParameter = weightData

      if (isEditing && category) {
        await updateCategory({
          patientId,
          planId,
          pillarId,
          categoryId: category.id,
          data: {
            desiredParameter: desiredParameter as any,
            status: data.status,
          },
        })
      } else {
        // Criar nova categoria de Peso
        await createCategory({
          patientId,
          planId,
          pillarId,
          data: {
            type: 'Peso',
            desiredParameter: desiredParameter as any,
            status: data.status,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar meta de peso:', error)
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
          Meta de peso
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="currentWeight"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <div className="flex w-full flex-col">
                <div className="relative">
                  <Label
                    htmlFor="currentWeight"
                    variant={error ? 'error' : 'default'}
                    className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                  >
                    Peso atual (kg)
                  </Label>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Ex: 80"
                    type="number"
                    step="0.1"
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

          <SelectField
            name="objective"
            control={control}
            label="Objetivo"
            options={objectiveOptions}
            placeholder="Selecione o objetivo"
            searchable={false}
          />

          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <div className="flex w-full flex-col">
                <div className="relative">
                  <Label
                    htmlFor="quantity"
                    variant={error ? 'error' : 'default'}
                    className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                  >
                    Quantidade (kg)
                  </Label>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Ex: 5"
                    type="number"
                    step="0.1"
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

          <div className="flex gap-2">
            <Controller
              name="deadline"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <div className="flex w-full flex-col">
                  <div className="relative">
                    <Label
                      htmlFor="deadline"
                      variant={error ? 'error' : 'default'}
                      className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-normal text-gray-700"
                    >
                      Prazo
                    </Label>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Ex: 3"
                      type="number"
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

            <SelectField
              name="deadlineUnit"
              control={control}
              label=""
              options={deadlineUnitOptions}
              placeholder="Unidade"
              searchable={false}
            />
          </div>

          <Controller
            name="patientGuidelines"
            control={control}
            render={({ field }) => (
              <TextareaField
                {...field}
                control={control}
                label="Orientações ao paciente"
                placeholder="Ex: Seguir as orientações de exercícios e de alimentação"
              />
            )}
          />

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
              {isEditing ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
