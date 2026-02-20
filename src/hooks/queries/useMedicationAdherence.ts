import { useQuery } from '@tanstack/react-query'

import { getMedicationAdherence } from '@/services/medicationAdherence'

export interface MedicationAdherenceData {
  isAdhering: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Hook para verificar se o paciente está aderindo à medicação.
 * Avalia todo o período de uso: uso contínuo ou medicamentos dentro do período.
 * Paciente só está aderindo se TODAS as doses tiverem status "tomei".
 * Qualquer dose "adiei" ou "ignorei" = não está aderindo.
 */
export function useMedicationAdherence(
  patientId: string,
): MedicationAdherenceData {
  const { data, isLoading, error } = useQuery({
    queryKey: ['medication-adherence', patientId],
    queryFn: () => getMedicationAdherence(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  return {
    isAdhering: data?.isAdhering ?? true,
    isLoading,
    error: error ? (error as Error).message : (data?.error ?? null),
  }
}
