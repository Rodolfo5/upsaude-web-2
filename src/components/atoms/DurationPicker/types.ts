export interface DurationPickerProps {
  value?: number
  onChange?: (duration: number) => void
  disabled?: boolean
  minDuration?: number
  maxDuration?: number
  step?: number
}
