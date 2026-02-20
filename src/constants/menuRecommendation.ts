export interface Option {
  value: string
  label: string
}

export const DAYS_OF_WEEK: Option[] = [
  { value: 'Domingo', label: 'Domingo' },
  { value: 'Segunda', label: 'Segunda' },
  { value: 'Terça', label: 'Terça' },
  { value: 'Quarta', label: 'Quarta' },
  { value: 'Quinta', label: 'Quinta' },
  { value: 'Sexta', label: 'Sexta' },
  { value: 'Sábado', label: 'Sábado' },
]

export const PORTION_UNITS: Option[] = [
  { value: 'g', label: 'g (gramas)' },
  { value: 'ml', label: 'ml (mililitros)' },
]

export const SUGGESTED_MEAL_TYPES: string[] = [
  'Café da manhã',
  'Lanche da manhã',
  'Almoço',
  'Lanche da tarde',
  'Jantar',
  'Ceia',
]
