import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { findAllExams, findExamById } from '@/services/exam'

export function useExams(patientId?: string) {
  return useQuery({
    queryKey: ['exams', patientId],
    queryFn: () => {
      if (!patientId) {
        throw new Error('Patient ID is required')
      }
      return findAllExams(patientId)
    },
    enabled: !!patientId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export function useExam(patientId?: string, examId?: string) {
  return useQuery({
    queryKey: ['exam', patientId, examId],
    queryFn: () => {
      if (!patientId || !examId) {
        throw new Error('Patient ID and Exam ID are required')
      }
      return findExamById(patientId, examId)
    },
    enabled: !!patientId && !!examId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}
