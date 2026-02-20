export interface HourPickerProps {
  value?: string

  onChange?: (value: string | undefined) => void

  minuteStep?: number
  disabled?: boolean
}
