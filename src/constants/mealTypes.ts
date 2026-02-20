export const MEAL_TYPE_LABELS: Record<string, string> = {
  'Café da manhã': 'Café da Manhã',
  'Café da Manhã': 'Café da Manhã',
  'Lanche da manhã': 'Lanche da Manhã',
  'Lanche da Manhã': 'Lanche da Manhã',
  Almoço: 'Almoço',
  'Lanche da tarde': 'Lanche da Tarde',
  'Lanche da Tarde': 'Lanche da Tarde',
  Jantar: 'Jantar',
  Ceia: 'Ceia',
}

export const MEAL_TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'Café da manhã', label: 'Café da manhã' },
  { value: 'Lanche da manhã', label: 'Lanche da manhã' },
  { value: 'Almoço', label: 'Almoço' },
  { value: 'Lanche da tarde', label: 'Lanche da tarde' },
  { value: 'Jantar', label: 'Jantar' },
  { value: 'Ceia', label: 'Ceia' },
] as const

export function getMealTypeLabel(mealType: string): string {
  return MEAL_TYPE_LABELS[mealType] ?? mealType
}
