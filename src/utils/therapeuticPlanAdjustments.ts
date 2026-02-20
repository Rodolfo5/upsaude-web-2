import {
  ActivityEntity,
  GoalEntity,
  LifestyleCategoryEntity,
  OrientationEntity,
} from '@/types/entities/healthPillar'

/**
 * Gera o título do ajuste para uma meta
 */
export function getGoalAdjustmentTitle(
  goal: Partial<GoalEntity>,
  isCreate: boolean,
): string {
  const action = isCreate ? 'criada' : 'ajustada'

  if (goal.type) {
    // Meta de saúde mental
    if (goal.type === 'Outros' && goal.customTitle) {
      return `Meta personalizada ${action}`
    }
    return `Meta de ${goal.type} ${action}`
  }

  if (goal.name) {
    // Meta com nome customizado (ex: biomarcadores)
    return `Meta de ${goal.name} ${action}`
  }

  return `Meta ${action}`
}

/**
 * Gera o tipo de ajuste para uma meta
 */
export function getGoalAdjustmentType(goal: Partial<GoalEntity>): string {
  if (goal.type) {
    if (goal.type === 'Outros' && goal.customTitle) {
      return goal.customTitle
    }
    return goal.type
  }

  if (goal.name) {
    return goal.name
  }

  return 'Meta'
}

/**
 * Gera o título do ajuste para uma atividade
 */
export function getActivityAdjustmentTitle(
  activity: Partial<ActivityEntity>,
  categoryType?: string,
  isCreate?: boolean,
): string {
  const action = isCreate ? 'criada' : 'ajustada'

  // Verificar nomes específicos de atividades primeiro
  if (
    activity.name === 'Meta de passos' ||
    activity.name === 'Meta de passos diários'
  ) {
    return `Meta de passos ${action}`
  }

  if (activity.name === 'Meta de gasto calórico') {
    return `Meta de gasto calórico ${action}`
  }

  if (activity.name === 'Atividade de pesagem') {
    return `Atividade de pesagem ${action}`
  }

  if (activity.name === 'Recomendação de exercício') {
    return `Recomendação de exercício ${action}`
  }

  // Verificar por categoria se o nome não for específico
  if (categoryType === 'Movimentos - Passos') {
    return `Meta de passos ${action}`
  }

  if (categoryType === 'Movimentos - Gasto Calórico') {
    return `Meta de gasto calórico ${action}`
  }

  if (categoryType === 'Peso' && activity.name?.includes('pesagem')) {
    return `Atividade de pesagem ${action}`
  }

  // Verificar se é atividade de biomarcador
  if (activity.name?.startsWith('Medir ')) {
    const biomarkerName = activity.name.replace('Medir ', '')
    return `Atividade de medição de ${biomarkerName} ${action}`
  }

  // Atividade genérica
  if (activity.name) {
    return `${activity.name} ${action}`
  }

  return `Atividade ${action}`
}

/**
 * Gera o título do ajuste para uma orientação
 */
export function getOrientationAdjustmentTitle(
  orientation: Partial<OrientationEntity>,
  isCreate: boolean,
): string {
  const action = isCreate ? 'criada' : 'ajustada'

  // Verificar se é recomendação nutricional
  if (orientation.area === 'Alimentação') {
    return `Recomendação nutricional ${action}`
  }

  // Usar o título da orientação se disponível
  if (orientation.title) {
    return `${orientation.title} ${action}`
  }

  return `Orientação ${action}`
}

/**
 * Gera o título do ajuste para uma categoria de estilo de vida
 */
export function getCategoryAdjustmentTitle(
  category: Partial<LifestyleCategoryEntity>,
  isCreate: boolean,
): string {
  const action = isCreate ? 'criada' : 'ajustada'

  if (category.type) {
    // Mapear tipos para títulos mais específicos
    const typeMap: Record<string, string> = {
      Hidratação: 'Meta de Hidratação',
      Peso: 'Meta de Peso',
      'Movimentos - Passos': 'Meta de Passos',
      'Movimentos - Gasto Calórico': 'Meta de gasto calórico',
      Alimentação: 'Meta de Alimentação',
    }

    const title = typeMap[category.type] || `Meta de ${category.type}`
    return `${title} ${action}`
  }

  return `Categoria ${action}`
}
