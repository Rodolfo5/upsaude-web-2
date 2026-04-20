/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { Info as InfoIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { Label } from '@/components/atoms/Label/label'
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

interface CaloricIntakeGoalModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  pillarId: string
  category?: LifestyleCategoryEntity | null
  onSuccess?: () => void
}

const caloricIntakeGoalSchema = z.object({
  quantity: z.string().min(1, 'A quantidade é obrigatória'),
})

type CaloricIntakeGoalFormData = z.infer<typeof caloricIntakeGoalSchema>

export function CaloricIntakeGoalModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  category,
  onSuccess,
}: CaloricIntakeGoalModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: createCategory, isPending: isCreating } =
    useCreateLifestyleCategory()
  const { mutateAsync: updateCategory, isPending: isUpdating } =
    useUpdateLifestyleCategory()

  const isEditing = !!category

  const { control, handleSubmit, reset } = useForm<CaloricIntakeGoalFormData>({
    resolver: zodResolver(caloricIntakeGoalSchema),
    defaultValues: {
      quantity: '',
    },
  })

  useEffect(() => {
    if (category && isOpen) {
      // Parse desiredParameter para extrair quantity
      let quantity = ''
      if (category.desiredParameter) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parsed: any
          if (typeof category.desiredParameter === 'string') {
            // Tenta fazer parse como JSON (para compatibilidade com dados antigos)
            parsed = JSON.parse(category.desiredParameter)
          } else if (typeof category.desiredParameter === 'object') {
            // Se já for objeto, usar diretamente
            parsed = category.desiredParameter
          } else if (typeof category.desiredParameter === 'number') {
            // Se for número, formatar diretamente
            quantity = new Intl.NumberFormat('pt-BR').format(
              category.desiredParameter,
            )
            reset({
              quantity,
            })
            return
          } else {
            reset({
              quantity: '',
            })
            return
          }

          if (parsed && parsed.quantity) {
            quantity = new Intl.NumberFormat('pt-BR').format(parsed.quantity)
          }
        } catch {
          // Se não for JSON ou objeto, tenta como número simples
          if (typeof category.desiredParameter === 'number') {
            quantity = new Intl.NumberFormat('pt-BR').format(
              category.desiredParameter,
            )
          } else if (typeof category.desiredParameter === 'string') {
            const numValue = parseFloat(category.desiredParameter)
            if (!isNaN(numValue)) {
              quantity = new Intl.NumberFormat('pt-BR').format(numValue)
            }
          }
        }
      }
      reset({
        quantity,
      })
    } else if (!isOpen) {
      reset({
        quantity: '',
      })
    }
  }, [category, isOpen, reset])

  const onSubmit = async (data: CaloricIntakeGoalFormData) => {
    try {
      // Converter quantidade formatada para número
      const quantityValue = parseFloat(
        data.quantity.replace(/\./g, '').replace(',', '.'),
      )

      // Salvar apenas a quantidade como string
      const desiredParameter = quantityValue.toString()

      if (isEditing && category) {
        await updateCategory({
          patientId,
          planId,
          pillarId,
          categoryId: category.id,
          data: {
            desiredParameter,
          },
        })
      } else {
        // Criar nova categoria de Alimentação
        await createCategory({
          patientId,
          planId,
          pillarId,
          data: {
            type: 'Alimentação',
            desiredParameter,
            status: 'Ativa',
            doctorId: currentUser?.id || '',
          },
        })
      }
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar meta de consumo calórico:', error)
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
          Meta de consumo calórico
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState: { error } }) => {
              const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              Confirme se o paciente possui meios de monitoramento (ex: relógio,
              aplicativo ou outro recurso). Isso garante que as metas sejam
              acompanhadas de forma realista e segura.
            </p>
          </div>

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
