import { ComponentProps } from 'react'
import { DayPicker } from 'react-day-picker'

export type DatePickerProps = Omit<
  ComponentProps<typeof DayPicker>,
  'mode' | 'selected' | 'onSelect'
> & {
  placeholder?: string
  value?: Date
  onSelect?: (date: Date | undefined) => void
}
