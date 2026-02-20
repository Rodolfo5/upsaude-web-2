import { usePatientById } from '@/hooks/queries/usePatientById'

export function usePatient(patientId: string) {
  const { data, isLoading, error } = usePatientById(patientId)
  const patient = data?.patient || null
  const errorMessage = data?.error || (error ? String(error) : null)
  return {
    patient,
    loading: isLoading,
    error: errorMessage,
  }
}
