'use client'

import { Controller } from 'react-hook-form'

import CurrencyInputField from '@/components/molecules/CurrencyInputField/currencyInputField'
import MultiSelectField from '@/components/molecules/MultiSelectField/multiSelectField'
import TimePickerField from '@/components/molecules/TimePickerField/timePickerField'

import { ShiftConfigurationProps } from './types'

const consultationTypeOptions = [
  { value: 'inicial', label: 'Inicial' },
  { value: 'complementar', label: 'Complementar' },
]

const formatOptions = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
]

// Função para calcular os limites de horário baseado no turno
const getShiftTimeLimits = (shiftIndex: number, isStartTime: boolean) => {
  const shiftRanges = [
    {
      // Turno da manhã: 00:00 - 12:00
      min: '00:00',
      max: '12:00',
    },
    {
      // Turno da tarde: 12:00 - 18:00
      min: '12:00',
      max: '18:00',
    },
    {
      // Turno da noite: 18:00 - 00:00 (meia-noite)
      min: '18:00',
      max: '23:59',
    },
  ]

  const range = shiftRanges[shiftIndex] || shiftRanges[0]

  if (isStartTime) {
    // Para horário inicial, usar o range completo
    return {
      minTime: range.min,
      maxTime: shiftIndex === 2 ? '23:59' : range.max, // Turno da noite não pode começar em 00:00
    }
  } else {
    // Para horário final, pode terminar em 00:00 se for turno da noite
    return {
      minTime: range.min,
      maxTime: shiftIndex === 2 ? '00:00' : range.max, // Turno da noite pode terminar em 00:00
    }
  }
}

export function ShiftConfiguration({
  shiftName,
  control,
  disabled = false,
  activeDay,
  index,
}: ShiftConfigurationProps) {
  const startTimeLimits = getShiftTimeLimits(index, true)
  const endTimeLimits = getShiftTimeLimits(index, false)

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-6 lg:p-10">
      <h4 className="text-sm font-medium text-gray-700">{shiftName}</h4>

      <div className="grid grid-cols-1 gap-4 text-gray-700 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <TimePickerField
          control={control}
          name={`shifts.${activeDay}.${index}.startTime`}
          label="Horário Inicial"
          required
          disabled={disabled}
          placeholder="Selecione"
          minTime={startTimeLimits.minTime}
          maxTime={startTimeLimits.maxTime}
        />

        <TimePickerField
          control={control}
          name={`shifts.${activeDay}.${index}.endTime`}
          label="Horário Final"
          required
          disabled={disabled}
          placeholder="Selecione"
          minTime={endTimeLimits.minTime}
          maxTime={endTimeLimits.maxTime}
        />

        <MultiSelectField
          control={control}
          name={`shifts.${activeDay}.${index}.consultationTypes`}
          label="Tipo de Consulta"
          required
          disabled={disabled}
          placeholder="Selecione"
          options={consultationTypeOptions}
        />

        <MultiSelectField
          control={control}
          name={`shifts.${activeDay}.${index}.format`}
          label="Formato"
          required
          disabled={disabled}
          placeholder="Selecione"
          options={formatOptions}
        />

        <CurrencyInputField
          control={control}
          name={`shifts.${activeDay}.${index}.value`}
          label="Valor da Consulta"
          required
          disabled={disabled}
          placeholder="0,00"
        />
      </div>

      <div className="flex items-center gap-2 text-gray-700">
        <Controller
          name={`shifts.${activeDay}.${index}.isPromotional`}
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id={`isPromotional-${index}`}
              checked={field.value || false}
              onChange={field.onChange}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-[#792EBD] focus:ring-[#792EBD]"
            />
          )}
        />
        <label
          htmlFor={`isPromotional-${index}`}
          className="text-sm text-gray-700"
        >
          Turno promocional
        </label>
      </div>
    </div>
  )
}
