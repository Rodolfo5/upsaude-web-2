export interface BirthDatePickerProps {
  className?: string
  placeholder?: string
  value?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
}
