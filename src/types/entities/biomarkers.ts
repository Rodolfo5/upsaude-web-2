export interface BloodGlucoseEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  value: string // valor em mg/dL
  isFasting: boolean // se estava em jejum
  lastMealTime?: string // horário da última refeição (formato "hh:mm"), se não estava em jejum
  measuredAt: Date | string // quando medi
  createdAt: Date | string
}

export interface BloodPressureEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  systolicValue: string // pressão sistólica
  diastolicValue: string // pressão diastólica
  wasAtRest: boolean // se estava em repouso há 5 minutos
  measuredAt: Date | string // quando mediu
  createdAt: Date | string
}

export interface HeartRateEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  value: string // valor em bpm
  wasAtRest: boolean // se estava em repouso
  measuredAt: Date | string // quando mediu
  createdAt: Date | string
}

export interface OximetryEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  value: string // valor em %
  measuredAt: Date | string // quando mediu
  createdAt: Date | string
}

export interface TemperatureEntity {
  id: string // formato dd-mm-aaaa-hh-mm-ss
  activityId: string
  value: string // valor em °C
  measuredAt: Date | string // quando mediu
  createdAt: Date | string
}
