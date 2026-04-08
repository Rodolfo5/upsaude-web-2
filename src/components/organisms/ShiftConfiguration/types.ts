import type { Control, FieldValues } from 'react-hook-form'

export interface ShiftConfigurationProps {
  shiftName: string
  control: Control<FieldValues>
  disabled?: boolean
  activeDay: string
  index: number
}

export interface ShiftData {
  startTime: string
  endTime: string
  consultationTypes: string[]
  format: string[]
  value: number
  isPromotional: boolean
}
