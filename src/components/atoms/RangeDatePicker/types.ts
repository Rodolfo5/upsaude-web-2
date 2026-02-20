import { ComponentProps } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'

export type RangeDatePickerProps = Omit<
  ComponentProps<typeof DayPicker>,
  'mode' | 'selected' | 'onSelect'
> & {
  placeholder?: string
  value?: DateRange
  onSelect?: (range: DateRange | undefined) => void
}
