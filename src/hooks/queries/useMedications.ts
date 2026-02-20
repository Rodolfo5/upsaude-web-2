import { useQuery } from '@tanstack/react-query'

import {
  findMedicationsByPatientId,
  findMedicationById,
} from '@/services/medication'

export function useMedications(patientId?: string) {
  return useQuery({
    queryKey: ['medications', patientId],
    queryFn: () => {
      if (!patientId) {
        throw new Error('Patient ID is required')
      }
      return findMedicationsByPatientId(patientId)
    },
    enabled: !!patientId,
  })
}

export function useMedication(patientId?: string, medicationId?: string) {
  return useQuery({
    queryKey: ['medication', patientId, medicationId],
    queryFn: () => {
      if (!patientId || !medicationId) {
        throw new Error('Patient ID and Medication ID are required')
      }
      return findMedicationById(patientId, medicationId)
    },
    enabled: !!patientId && !!medicationId,
  })
}
