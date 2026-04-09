import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getHealthPillar } from '@/services/healthPillar'
import { getAllMenusByPillar } from '@/services/healthPillarMenu'
import {
  getMealRecordsByDateRange,
  getMealRecordById,
} from '@/services/mealRecord'

/**
 * Hook para buscar o pilar de Estilo de Vida do plano
 */
export function useLifestylePillar(patientId: string, planId: string) {
  return useQuery({
    queryKey: ['health-pillar', patientId, planId, 'Estilo de Vida'],
    queryFn: () =>
      getHealthPillar(patientId, planId, 'Estilo de Vida' as const),
    enabled: !!patientId && !!planId && planId !== 'new',
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

/**
 * Hook para buscar o primeiro menu ativo do pilar (usado para meal records)
 */
export function useActiveMenu(
  patientId: string,
  planId: string,
  pillarId: string,
) {
  return useQuery({
    queryKey: ['active-menu', patientId, planId, pillarId],
    queryFn: async () => {
      const menus = await getAllMenusByPillar(patientId, planId, pillarId)
      return menus.find((m) => m.status === 'Ativa') ?? null
    },
    enabled: !!patientId && !!planId && !!pillarId && planId !== 'new',
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

/**
 * Hook para buscar registros de refeição por intervalo de datas
 */
export function useMealRecords(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
  startDate: Date,
  endDate: Date,
) {
  return useQuery({
    queryKey: [
      'meal-records',
      patientId,
      planId,
      pillarId,
      menuId,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: () =>
      getMealRecordsByDateRange(
        patientId,
        planId,
        pillarId,
        menuId,
        startDate,
        endDate,
      ),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!menuId &&
      planId !== 'new' &&
      !!startDate &&
      !!endDate,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

/**
 * Hook para buscar um registro de refeição específico por ID
 */
export function useMealRecordById(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
  recordId: string,
) {
  return useQuery({
    queryKey: ['meal-record', patientId, planId, pillarId, menuId, recordId],
    queryFn: () =>
      getMealRecordById(patientId, planId, pillarId, menuId, recordId),
    enabled:
      !!patientId &&
      !!planId &&
      !!pillarId &&
      !!menuId &&
      !!recordId &&
      planId !== 'new',
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
