/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import DatePickerField from '@/components/molecules/DatePickerField/datePickerField'
import InputField from '@/components/molecules/InputField/inputField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  intervalUnitOptions,
  usageClassificationOptions,
} from '@/constants/medication'
import { updateMedicationSchema } from '@/validations/updateMedication'

import { EditMedicationModalProps } from './types'

type UpdateMedicationFormData = {
  usageClassification: 'Uso contínuo' | 'Tratamento' | 'Sintomático'
  interval?: number
  intervalUnit?: 'Horas' | 'Dias'
  endDate?: Date
}

export function EditMedicationModal({
  isOpen,
  onClose,
  medication,
  onSave,
  isSaving = false,
}: EditMedicationModalProps) {
  const defaultValues = useMemo<UpdateMedicationFormData>(
    () => ({
      usageClassification: (medication?.usageClassification ||
        'Sintomático') as 'Uso contínuo' | 'Tratamento' | 'Sintomático',
      interval: medication?.interval,
      intervalUnit: medication?.intervalUnit as 'Horas' | 'Dias' | undefined,
      endDate: medication?.endDate ? new Date(medication.endDate) : undefined,
    }),
    [medication],
  )

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isValid },
  } = useForm<UpdateMedicationFormData>({
    mode: 'onChange',
    resolver: zodResolver(updateMedicationSchema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
    }
  }, [defaultValues, isOpen, reset])

  const usageClassification = watch('usageClassification')
  const showIntervalFields =
    usageClassification === 'Uso contínuo' ||
    usageClassification === 'Tratamento'
  const showEndDate = usageClassification === 'Tratamento'

  const handleFormSubmit = (data: UpdateMedicationFormData) => {
    if (!medication) return

    const updates: UpdateMedicationFormData = {
      usageClassification: data.usageClassification,
    }

    if (showIntervalFields) {
      updates.interval = data.interval
      updates.intervalUnit = data.intervalUnit
    }

    if (showEndDate) {
      updates.endDate = data.endDate
    }

    onSave({
      medicationId: medication.id,
      ...updates,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar classificação de uso</DialogTitle>
          <DialogDescription className="text-gray-600">
            {medication?.name || 'Medicamento'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <SelectField
            control={control}
            name="usageClassification"
            label="Classificação de uso"
            options={usageClassificationOptions}
            placeholder="Selecione a classificação"
          />

          {showIntervalFields && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                control={control}
                name="interval"
                label="Intervalo"
                placeholder="Ex: 8"
                inputMode="numeric"
                min={1}
              />
              <SelectField
                control={control}
                name="intervalUnit"
                label="Unidade"
                options={intervalUnitOptions}
                placeholder="Selecione a unidade"
              />
            </div>
          )}

          {showEndDate && (
            <DatePickerField
              control={control}
              name="endDate"
              label="Data de término"
            />
          )}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={onClose}
              variant="secondary-gray"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving} disabled={!isValid}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
