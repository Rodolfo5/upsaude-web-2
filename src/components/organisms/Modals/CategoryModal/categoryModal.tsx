/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
  useCreateLifestyleCategory,
  useUpdateLifestyleCategory,
} from '@/hooks/queries/useHealthPillarLifestyleCategories'
import useUser from '@/hooks/useUser'
import { LifestyleCategoryEntity } from '@/types/entities/healthPillar'

interface CategoryModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  category?: LifestyleCategoryEntity | null
  defaultCategoryType?: string
  onSuccess?: () => void
}

const statusOptions = [
  { value: 'Ativa', label: 'Ativa' },
  { value: 'Atingida', label: 'Atingida' },
  { value: 'Desativada', label: 'Desativada' },
]

const unitOptions = [
  { value: 'Passos', label: 'Passos' },
  { value: 'Km', label: 'Km' },
]

const categorySchema = z.object({
  unit: z.enum(['Passos', 'Km']).optional(),
  desiredParameter: z.union([z.string(), z.number()]).optional(),
  status: z.enum(['Ativa', 'Atingida', 'Desativada'], {
    required_error: 'O status é obrigatório',
  }),
})

type CategoryFormData = z.infer<typeof categorySchema>

export function CategoryModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  category,
  defaultCategoryType,
  onSuccess,
}: CategoryModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createCategory, isPending: isCreating } =
    useCreateLifestyleCategory()
  const { mutateAsync: updateCategory, isPending: isUpdating } =
    useUpdateLifestyleCategory()

  const isEditing = !!category

  const isStepsGoal =
    category?.type === 'Movimentos - Passos' ||
    defaultCategoryType === 'Movimentos - Passos'

  const { control, handleSubmit, reset } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      unit: 'Passos',
      desiredParameter: undefined,
      status: 'Ativa',
    },
  })

  useEffect(() => {
    if (category && isOpen) {
      // Para metas de passos, tentar extrair unit do desiredParameter
      let unit: 'Passos' | 'Km' = 'Passos'
      let desiredParam = category.desiredParameter

      if (
        category.type === 'Movimentos - Passos' &&
        category.desiredParameter
      ) {
        // Se for objeto (novo formato), extrair diretamente
        if (
          typeof category.desiredParameter === 'object' &&
          category.desiredParameter !== null &&
          !Array.isArray(category.desiredParameter)
        ) {
          const paramObj = category.desiredParameter as any
          if (paramObj.unit) {
            unit = paramObj.unit
            desiredParam = paramObj.quantity || paramObj.desiredParameter
          }
        } else if (typeof category.desiredParameter === 'string') {
          // Compatibilidade com dados antigos em formato JSON string
          try {
            const parsed = JSON.parse(category.desiredParameter)
            if (parsed.unit) {
              unit = parsed.unit
              desiredParam = parsed.quantity || parsed.desiredParameter
            }
          } catch {
            // Se não for JSON, mantém o valor original
          }
        }
      }

      reset({
        unit: isStepsGoal ? unit : undefined,
        desiredParameter:
          typeof desiredParam === 'object'
            ? (desiredParam as any).quantity || (desiredParam as any).value
            : desiredParam,
        status: category.status,
      })
    } else if (!isOpen) {
      reset({
        unit: isStepsGoal ? 'Passos' : undefined,
        desiredParameter: undefined,
        status: 'Ativa',
      })
    }
  }, [category, isOpen, reset, isStepsGoal])

  const onSubmit = async (data: CategoryFormData) => {
    try {
      // Converter desiredParameter de string para número se necessário
      let desiredParam: number | object | undefined
      if (data.desiredParameter !== undefined && data.desiredParameter !== '') {
        const numValue =
          typeof data.desiredParameter === 'string'
            ? parseFloat(data.desiredParameter)
            : data.desiredParameter
        if (!isNaN(numValue)) {
          // Para metas de passos, salvar como objeto Firestore com atributos separados
          if (isStepsGoal && data.unit) {
            desiredParam = {
              quantity: numValue,
              unit: data.unit,
            }
          } else {
            desiredParam = numValue
          }
        }
      }

      if (isEditing && category) {
        await updateCategory({
          patientId,
          planId,
          pillarId,
          categoryId: category.id,
          data: {
            desiredParameter: desiredParam as any,
            status: data.status,
          },
        })
      } else {
        // Criar nova categoria
        const categoryType =
          (category as LifestyleCategoryEntity | null)?.type ||
          defaultCategoryType
        if (!categoryType) {
          console.error('Tipo de categoria não definido')
          return
        }

        await createCategory({
          patientId,
          planId,
          pillarId,
          data: {
            type: categoryType as any,
            desiredParameter: desiredParam as any,

            status: data.status,
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
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
          {category?.type === 'Movimentos - Passos' ||
          defaultCategoryType === 'Movimentos - Passos'
            ? 'Meta de passos diários'
            : isEditing
              ? 'Editar categoria'
              : 'Cadastrar categoria'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(category || defaultCategoryType) && (
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">
                {category?.type || defaultCategoryType}
              </p>
            </div>
          )}

          {isStepsGoal && (
            <SelectField
              name="unit"
              control={control}
              label="Unidade"
              options={unitOptions}
              placeholder="Selecione a unidade"
              searchable={false}
            />
          )}

          <InputField
            name="desiredParameter"
            control={control}
            label={isStepsGoal ? 'Quantidade' : 'Parâmetro desejável'}
            placeholder={isStepsGoal ? 'Ex: 3.000' : 'Ex: 12000'}
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
              {isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
