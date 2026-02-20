import {
  HealthPillarType,
  LifestyleCategoryType,
} from '@/types/entities/healthPillar'

/**
 * Tipos de credenciais profissionais
 */
export const CREDENTIAL_TYPES = {
  CRM: 'CRM',
  CRN: 'CRN',
  CREF: 'CREF',
  CREFITO: 'CREFITO',
  CRP: 'CRP',
  CRO: 'CRO',
} as const

export type CredentialType =
  | typeof CREDENTIAL_TYPES.CRM
  | typeof CREDENTIAL_TYPES.CRN
  | typeof CREDENTIAL_TYPES.CREF
  | typeof CREDENTIAL_TYPES.CREFITO
  | typeof CREDENTIAL_TYPES.CRP
  | typeof CREDENTIAL_TYPES.CRO

/**
 * Áreas de atuação no plano terapêutico
 */
export const THERAPEUTIC_AREAS = {
  MENTAL_HEALTH: 'mental_health',
  BIOMARKERS: 'biomarkers',
  LIFESTYLE_NUTRITION: 'lifestyle_nutrition',
  LIFESTYLE_MOVEMENT: 'lifestyle_movement',
  LIFESTYLE_HYDRATION: 'lifestyle_hydration',
  LIFESTYLE_WEIGHT: 'lifestyle_weight',
  GENERAL_ORIENTATIONS: 'general_orientations',
} as const

export type TherapeuticArea =
  | typeof THERAPEUTIC_AREAS.MENTAL_HEALTH
  | typeof THERAPEUTIC_AREAS.BIOMARKERS
  | typeof THERAPEUTIC_AREAS.LIFESTYLE_NUTRITION
  | typeof THERAPEUTIC_AREAS.LIFESTYLE_MOVEMENT
  | typeof THERAPEUTIC_AREAS.LIFESTYLE_HYDRATION
  | typeof THERAPEUTIC_AREAS.LIFESTYLE_WEIGHT
  | typeof THERAPEUTIC_AREAS.GENERAL_ORIENTATIONS

/**
 * Verifica se o usuário é o médico coordenador do plano
 */
export function isCoordinatingDoctor(
  currentUserId: string | undefined,
  planDoctorId: string | undefined,
): boolean {
  if (!currentUserId || !planDoctorId) return false
  return currentUserId === planDoctorId
}

/**
 * Verifica se o profissional pode editar uma área específica
 */
export function checkCanEditArea(
  typeOfCredential: string | undefined,
  area: TherapeuticArea,
  isCoordinating: boolean,
): boolean {
  // Médico coordenador tem acesso total
  if (isCoordinating) return true

  if (!typeOfCredential) return false

  switch (area) {
    case THERAPEUTIC_AREAS.MENTAL_HEALTH:
      return typeOfCredential === CREDENTIAL_TYPES.CRP

    case THERAPEUTIC_AREAS.BIOMARKERS:
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    case THERAPEUTIC_AREAS.LIFESTYLE_NUTRITION:
      return typeOfCredential === CREDENTIAL_TYPES.CRN

    case THERAPEUTIC_AREAS.LIFESTYLE_MOVEMENT:
      return (
        typeOfCredential === CREDENTIAL_TYPES.CREF ||
        typeOfCredential === CREDENTIAL_TYPES.CREFITO
      )

    case THERAPEUTIC_AREAS.LIFESTYLE_HYDRATION:
    case THERAPEUTIC_AREAS.LIFESTYLE_WEIGHT:
      // Apenas CRM pode editar hidratação e peso
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    case THERAPEUTIC_AREAS.GENERAL_ORIENTATIONS:
      // CRO pode criar orientações em qualquer pilar
      return typeOfCredential === CREDENTIAL_TYPES.CRO

    default:
      return false
  }
}

/**
 * Verifica se o profissional pode criar/editar uma categoria de estilo de vida
 */
export function checkCanCreateCategory(
  typeOfCredential: string | undefined,
  categoryType: LifestyleCategoryType,
  isCoordinating: boolean,
): boolean {
  if (isCoordinating) return true

  if (!typeOfCredential) return false

  switch (categoryType) {
    case 'Alimentação':
      return typeOfCredential === CREDENTIAL_TYPES.CRN

    case 'Movimentos - Passos':
    case 'Movimentos - Gasto Calórico':
      return (
        typeOfCredential === CREDENTIAL_TYPES.CREF ||
        typeOfCredential === CREDENTIAL_TYPES.CREFITO
      )

    case 'Hidratação':
    case 'Peso':
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    default:
      return false
  }
}

/**
 * Verifica se o profissional pode criar/editar uma atividade
 */
export function checkCanCreateActivity(
  typeOfCredential: string | undefined,
  pillarType: HealthPillarType,
  isCoordinating: boolean,
): boolean {
  if (isCoordinating) return true

  if (!typeOfCredential) return false

  switch (pillarType) {
    case 'Saúde Mental':
      return typeOfCredential === CREDENTIAL_TYPES.CRP

    case 'Biomarcadores de Saúde':
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    case 'Estilo de Vida':
      // Para atividades de estilo de vida, verificar se é relacionado a movimentação
      // Isso será verificado no contexto específico (exercícios vs outras atividades)
      // Por padrão, apenas CREF/CREFITO podem criar atividades de exercício
      return (
        typeOfCredential === CREDENTIAL_TYPES.CREF ||
        typeOfCredential === CREDENTIAL_TYPES.CREFITO
      )

    default:
      return false
  }
}

/**
 * Verifica se o profissional pode criar/editar uma orientação
 */
export function checkCanCreateOrientation(
  typeOfCredential: string | undefined,
  pillarType: HealthPillarType,
  area?: string,
  isCoordinating?: boolean,
): boolean {
  if (isCoordinating) return true

  if (!typeOfCredential) return false

  // CRO pode criar orientações em qualquer pilar
  if (typeOfCredential === CREDENTIAL_TYPES.CRO) return true

  switch (pillarType) {
    case 'Saúde Mental':
      return typeOfCredential === CREDENTIAL_TYPES.CRP

    case 'Biomarcadores de Saúde':
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    case 'Estilo de Vida':
      // Verificar área específica
      if (area === 'Alimentação') {
        return typeOfCredential === CREDENTIAL_TYPES.CRN
      }
      // Outras áreas de estilo de vida podem ser editadas por CRM
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    default:
      return false
  }
}

/**
 * Verifica se o profissional pode criar/editar uma meta (goal)
 */
export function checkCanEditGoal(
  typeOfCredential: string | undefined,
  pillarType: HealthPillarType,
  isCoordinating: boolean,
): boolean {
  if (isCoordinating) return true

  if (!typeOfCredential) return false

  switch (pillarType) {
    case 'Saúde Mental':
      return typeOfCredential === CREDENTIAL_TYPES.CRP

    case 'Biomarcadores de Saúde':
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    case 'Estilo de Vida':
      // Metas de estilo de vida são gerenciadas via categorias
      // A verificação será feita no nível de categoria
      return typeOfCredential === CREDENTIAL_TYPES.CRM

    default:
      return false
  }
}

/**
 * Verifica se o profissional pode criar/editar cardápio
 */
export function checkCanEditMenu(
  typeOfCredential: string | undefined,
  isCoordinating: boolean,
): boolean {
  if (isCoordinating) return true
  return typeOfCredential === CREDENTIAL_TYPES.CRN
}

/**
 * Verifica se o profissional pode criar/editar exercício
 */
export function checkCanEditExercise(
  typeOfCredential: string | undefined,
  isCoordinating: boolean,
): boolean {
  if (isCoordinating) return true
  return (
    typeOfCredential === CREDENTIAL_TYPES.CREF ||
    typeOfCredential === CREDENTIAL_TYPES.CREFITO
  )
}

/**
 * Verifica se o profissional pode criar/editar trilhas (tracks)
 */
export function checkCanEditTrack(
  typeOfCredential: string | undefined,
  isCoordinating: boolean,
): boolean {
  if (isCoordinating) return true
  return typeOfCredential === CREDENTIAL_TYPES.CRP
}

/**
 * Retorna a mensagem de tooltip explicativa baseada na área e tipo de credencial
 */
export function getPermissionTooltip(
  typeOfCredential: string | undefined,
  area: TherapeuticArea | HealthPillarType | LifestyleCategoryType,
  isCoordinating: boolean,
): string {
  if (isCoordinating) {
    return 'Você tem acesso total como médico coordenador'
  }

  // Mensagens específicas por área
  if (area === THERAPEUTIC_AREAS.MENTAL_HEALTH || area === 'Saúde Mental') {
    return 'Apenas psicólogos (CRP) ou o médico coordenador podem editar esta seção'
  }

  if (
    area === THERAPEUTIC_AREAS.BIOMARKERS ||
    area === 'Biomarcadores de Saúde'
  ) {
    return 'Apenas médicos (CRM) podem editar esta seção'
  }

  if (
    area === THERAPEUTIC_AREAS.LIFESTYLE_NUTRITION ||
    area === 'Alimentação'
  ) {
    return 'Apenas nutricionistas (CRN) ou o médico coordenador podem editar esta seção'
  }

  if (
    area === THERAPEUTIC_AREAS.LIFESTYLE_MOVEMENT ||
    area === 'Movimentos - Passos' ||
    area === 'Movimentos - Gasto Calórico'
  ) {
    return 'Apenas educadores físicos (CREF), fisioterapeutas (CREFITO) ou o médico coordenador podem editar esta seção'
  }

  if (area === THERAPEUTIC_AREAS.LIFESTYLE_HYDRATION || area === 'Hidratação') {
    return 'Apenas médicos (CRM) podem editar esta seção'
  }

  if (area === THERAPEUTIC_AREAS.LIFESTYLE_WEIGHT || area === 'Peso') {
    return 'Apenas médicos (CRM) podem editar esta seção'
  }

  return 'Você não tem permissão para editar esta seção'
}
