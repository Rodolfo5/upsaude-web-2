import { WeekDay } from '@/constants/weekDays'

export interface DaySelectorProps {
  selectedDays: WeekDay[]
  onChange: (days: WeekDay[]) => void
  disabled?: boolean
}
