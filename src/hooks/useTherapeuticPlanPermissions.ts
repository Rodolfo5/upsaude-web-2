import { useMemo } from 'react'

import { useTherapeuticPlan } from '@/hooks/queries/useTherapeuticPlan'
import useDoctor from '@/hooks/useDoctor'
import useUser from '@/hooks/useUser'
import {
  HealthPillarType,
  LifestyleCategoryType,
} from '@/types/entities/healthPillar'
import {
  checkCanCreateActivity,
  checkCanCreateCategory,
  checkCanCreateOrientation,
  checkCanEditArea,
  checkCanEditExercise,
  checkCanEditGoal,
  checkCanEditMenu,
  checkCanEditTrack,
  getPermissionTooltip,
  isCoordinatingDoctor,
  THERAPEUTIC_AREAS,
} from '@/utils/permissions/therapeuticPlanPermissions'

/**
 * Hook para gerenciar permissões do plano terapêutico
 *
 * @param planId - ID do plano terapêutico
 * @param patientId - ID do paciente
 * @returns Objeto com permissões e funções de verificação
 */
export function useTherapeuticPlanPermissions(
  planId: string,
  patientId: string,
) {
  const { currentUser } = useUser()
  const { currentDoctor } = useDoctor()
  const { data: plan, isLoading: isLoadingPlan } = useTherapeuticPlan(
    patientId,
    planId,
  )

  const typeOfCredential = currentDoctor?.typeOfCredential
  // Usar uid (Firebase Auth UID) em vez de id para garantir consistência
  const currentUserId = currentUser?.uid || currentUser?.id

  // Verificar se é médico coordenador
  const isCoordinating = useMemo(() => {
    if (!currentUserId || !plan?.doctorId) return false
    return isCoordinatingDoctor(currentUserId, plan.doctorId)
  }, [currentUserId, plan?.doctorId])

  // Funções de verificação de permissões
  const permissions = useMemo(() => {
    return {
      // Verificações de área
      canEditMentalHealth: checkCanEditArea(
        typeOfCredential,
        THERAPEUTIC_AREAS.MENTAL_HEALTH,
        isCoordinating,
      ),
      canEditBiomarkers: checkCanEditArea(
        typeOfCredential,
        THERAPEUTIC_AREAS.BIOMARKERS,
        isCoordinating,
      ),
      canEditLifestyleNutrition: checkCanEditArea(
        typeOfCredential,
        THERAPEUTIC_AREAS.LIFESTYLE_NUTRITION,
        isCoordinating,
      ),
      canEditLifestyleMovement: checkCanEditArea(
        typeOfCredential,
        THERAPEUTIC_AREAS.LIFESTYLE_MOVEMENT,
        isCoordinating,
      ),
      canEditLifestyleHydration: checkCanEditArea(
        typeOfCredential,
        THERAPEUTIC_AREAS.LIFESTYLE_HYDRATION,
        isCoordinating,
      ),
      canEditLifestyleWeight: checkCanEditArea(
        typeOfCredential,
        THERAPEUTIC_AREAS.LIFESTYLE_WEIGHT,
        isCoordinating,
      ),

      // Funções de verificação
      canCreateCategory: (categoryType: LifestyleCategoryType) =>
        checkCanCreateCategory(typeOfCredential, categoryType, isCoordinating),

      canCreateActivity: (pillarType: HealthPillarType) =>
        checkCanCreateActivity(typeOfCredential, pillarType, isCoordinating),

      canCreateOrientation: (pillarType: HealthPillarType, area?: string) =>
        checkCanCreateOrientation(
          typeOfCredential,
          pillarType,
          area,
          isCoordinating,
        ),

      canEditGoal: (pillarType: HealthPillarType) =>
        checkCanEditGoal(typeOfCredential, pillarType, isCoordinating),

      canEditMenu: () => checkCanEditMenu(typeOfCredential, isCoordinating),

      canEditExercise: () =>
        checkCanEditExercise(typeOfCredential, isCoordinating),

      canEditTrack: () => checkCanEditTrack(typeOfCredential, isCoordinating),

      // Função genérica para verificar área
      canEditArea: (
        area: (typeof THERAPEUTIC_AREAS)[keyof typeof THERAPEUTIC_AREAS],
      ) => checkCanEditArea(typeOfCredential, area, isCoordinating),

      // Função para obter tooltip
      getTooltip: (
        area:
          | (typeof THERAPEUTIC_AREAS)[keyof typeof THERAPEUTIC_AREAS]
          | HealthPillarType
          | LifestyleCategoryType,
      ) => getPermissionTooltip(typeOfCredential, area, isCoordinating),
    }
  }, [typeOfCredential, isCoordinating])

  return {
    permissions,
    isCoordinating,
    typeOfCredential,
    isLoading: isLoadingPlan,
    plan,
  }
}
