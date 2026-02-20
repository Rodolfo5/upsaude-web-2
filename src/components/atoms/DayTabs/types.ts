import { WeekDay } from '@/constants/weekDays'

export interface DayTabsProps {
  selectedDays: WeekDay[]
  activeDay: WeekDay | null
  onDayChange: (day: WeekDay) => void
  children?: React.ReactNode
}
