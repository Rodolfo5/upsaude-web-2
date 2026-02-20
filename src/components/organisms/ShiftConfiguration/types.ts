export interface ShiftConfigurationProps {
  shiftName: string
  control: any
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
