import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useHealthCheckups } from '@/hooks/queries/useHealthCheckups'
import { useTreatmentAdherence } from '@/hooks/queries/useTreatmentAdherence'
import { findAllRequestQuestionnairesForPatient } from '@/services/requestQuestionnaires'
import { CheckupStatus } from '@/types/entities/healthCheckup'

import { usePatient } from './usePatient'

interface FollowUpData {
  hasIncompleteCheckup: boolean
  revaluationRequested: boolean
  hasIncompleteQuestionnaires: boolean
  isAdheringToTreatment: boolean
  isLoading: boolean
}

export function useFollowUpData(patientId: string): FollowUpData {
  // Buscar checkups do paciente
  const { data: checkups, isLoading: checkupsLoading } =
    useHealthCheckups(patientId)

  const { patient, loading: patientLoading } = usePatient(patientId)

  // Buscar questionários solicitados para o paciente
  const { data: requestedQuestionnaires, isLoading: questionnairesLoading } =
    useQuery({
      queryKey: ['requestedQuestionnaires', patientId],
      queryFn: () => findAllRequestQuestionnairesForPatient(patientId),
      enabled: !!patientId,
    })

  // Buscar dados de adesão ao tratamento
  const { isAdheringToTreatment, isLoading: treatmentLoading } =
    useTreatmentAdherence(patientId)

  const followUpData = useMemo(() => {
    // Se planReassessment for true, precisa reavaliar (pendente)
    const revaluationRequested = Boolean(patient?.planReassessment)

    if (
      checkupsLoading ||
      questionnairesLoading ||
      treatmentLoading ||
      patientLoading
    ) {
      return {
        hasIncompleteCheckup: false,
        revaluationRequested,
        hasIncompleteQuestionnaires: false,
        isAdheringToTreatment: false,
        isLoading: true,
      }
    }

    // Verificar se há algum checkup com status diferente de COMPLETED
    const hasIncompleteCheckup =
      checkups?.some((checkup) => checkup.status !== CheckupStatus.COMPLETED) ||
      false

    // Verificar se há questionários pendentes
    // Um questionário está pendente se o paciente está na lista de patientIds
    // mas não está na lista de patientsWhoResponded
    const hasIncompleteQuestionnaires =
      requestedQuestionnaires?.some((questionnaire) => {
        const isAssignedToPatient = questionnaire.patientIds.includes(patientId)
        const hasResponded =
          questionnaire.patientsWhoResponded.includes(patientId)
        return isAssignedToPatient && !hasResponded
      }) || false

    return {
      hasIncompleteCheckup,
      revaluationRequested,
      hasIncompleteQuestionnaires,
      isAdheringToTreatment,
      isLoading: false,
    }
  }, [
    checkups,
    requestedQuestionnaires,
    patient?.planReassessment,
    patientId,
    checkupsLoading,
    questionnairesLoading,
    treatmentLoading,
    patientLoading,
    isAdheringToTreatment,
  ])

  return followUpData
}
