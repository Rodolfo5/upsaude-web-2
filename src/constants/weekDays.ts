export enum WeekDay {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export const WEEK_DAYS_ORDER = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
]

export const WEEK_DAYS_PT: Record<WeekDay, string> = {
  [WeekDay.SUNDAY]: 'Domingo',
  [WeekDay.MONDAY]: 'Segunda',
  [WeekDay.TUESDAY]: 'Terça',
  [WeekDay.WEDNESDAY]: 'Quarta',
  [WeekDay.THURSDAY]: 'Quinta',
  [WeekDay.FRIDAY]: 'Sexta',
  [WeekDay.SATURDAY]: 'Sábado',
}

export const WEEK_DAYS_PT_SHORT: Record<WeekDay, string> = {
  [WeekDay.SUNDAY]: 'Dom',
  [WeekDay.MONDAY]: 'Seg',
  [WeekDay.TUESDAY]: 'Ter',
  [WeekDay.WEDNESDAY]: 'Qua',
  [WeekDay.THURSDAY]: 'Qui',
  [WeekDay.FRIDAY]: 'Sex',
  [WeekDay.SATURDAY]: 'Sáb',
}

