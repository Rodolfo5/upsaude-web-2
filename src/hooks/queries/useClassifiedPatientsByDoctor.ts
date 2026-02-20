import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import usePatientsByDoctor from '@/hooks/queries/usePatientsByDoctor'
import useUser from '@/hooks/useUser'
import { getPatientsByDoctorId } from '@/services/patient'
import { PatientEntity } from '@/types/entities/user'

export interface ClassifiedPatients {
  acompanhamento: PatientEntity[]
  complementares: PatientEntity[]
  all: (PatientEntity & { patientType: 'acompanhamento' | 'complementar' })[]
}

export function getClassifiedPatientsByDoctorQueryKey(
  doctorId: string | undefined,
) {
  return ['classified-patients', doctorId]
}

const useClassifiedPatientsByDoctor = (): {
  data: ClassifiedPatients | undefined
  isLoading: boolean
  error: Error | null
} => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  const {
    data: acompanhamento = [],
    isLoading: isLoadingAcompanhamento,
    error: errorAcompanhamento,
  } = useQuery({
    queryKey: ['patients-acompanhamento', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('DoctorId é obrigatório')
      const result = await getPatientsByDoctorId(doctorId)
      if (result.error) throw new Error(result.error)
      return result.patients
    },
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })

  // Buscar todos os pacientes com consultas (usando o hook existente)
  const {
    data: allWithConsultations = [],
    isLoading: isLoadingConsultations,
    error: errorConsultations,
  } = usePatientsByDoctor()

  // Filtrar pacientes complementares: aqueles com consultas mas não são de acompanhamento
  const complementares = allWithConsultations.filter(
    (patient) => !acompanhamento.some((acomp) => acomp.id === patient.id),
  )

  const isLoading = isLoadingAcompanhamento || isLoadingConsultations
  const error = errorAcompanhamento || errorConsultations

  // Combinar todos os pacientes com o tipo
  const all = [
    ...acompanhamento.map((p) => ({
      ...p,
      patientType: 'acompanhamento' as const,
    })),
    ...complementares.map((p) => ({
      ...p,
      patientType: 'complementar' as const,
    })),
  ]

  return {
    data: {
      acompanhamento,
      complementares,
      all,
    },
    isLoading,
    error,
  }
}

export default useClassifiedPatientsByDoctor
