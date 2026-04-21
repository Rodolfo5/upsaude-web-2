import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import { getUniquePatientIdsByDoctor } from '@/services/consultation'
import { getPatientsByIds, getPatientsByDoctorId } from '@/services/patient'

export function getPatientsByDoctorQueryKey(doctorId: string | undefined) {
  return ['patients', doctorId]
}

// Versão otimizada: consulta direta por doctorId (1 roundtrip Firestore)
export const getPatientsByDoctorQueryFn =
  (doctorId: string | undefined) => async () => {
    if (!doctorId) {
      throw new Error('DoctorId é obrigatório')
    }
    const result = await getPatientsByDoctorId(doctorId)
    if (result.error) throw new Error(result.error)
    return result.patients
  }

const usePatientsByDoctor = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: getPatientsByDoctorQueryKey(doctorId),
    queryFn: getPatientsByDoctorQueryFn(doctorId),
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
    select: (data) => data ?? [],
  })
}

export const useAllPatientsByDoctor = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: ['all-patients', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('DoctorId é obrigatório')
      const result = await getPatientsByDoctorId(doctorId)
      if (result.error) throw new Error(result.error)
      return result.patients
    },
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export const getCombinedPatientsByDoctorQueryFn =
  (doctorId: string | undefined) => async () => {
    if (!doctorId) {
      throw new Error('DoctorId é obrigatório')
    }

    // Buscar pacientes com consultas/agendamentos
    const idsResult = await getUniquePatientIdsByDoctor(doctorId)
    if (idsResult.error) {
      console.error('Erro ao obter IDs de pacientes:', idsResult.error)
      throw new Error(idsResult.error)
    }

    // Buscar pacientes com doctorId direto
    const directPatientsResult = await getPatientsByDoctorId(doctorId)
    if (directPatientsResult.error) {
      console.error(
        'Erro ao obter pacientes diretos:',
        directPatientsResult.error,
      )
      throw new Error(directPatientsResult.error)
    }

    // Buscar dados dos pacientes com consultas
    let consultationPatients: Awaited<
      ReturnType<typeof getPatientsByIds>
    >['patients'] = []
    if (idsResult.patientIds.length > 0) {
      const patientsResult = await getPatientsByIds(idsResult.patientIds)
      if (patientsResult.error) {
        console.error('Erro ao buscar pacientes por IDs:', patientsResult.error)
        // Não lançar erro aqui, apenas logar e continuar
      } else {
        consultationPatients = patientsResult.patients
      }
    }

    // Combinar ambos os arrays e remover duplicatas baseado no ID
    const allPatientsMap = new Map<
      string,
      (typeof directPatientsResult.patients)[0]
    >()

    // Adicionar pacientes com doctorId direto
    directPatientsResult.patients.forEach((patient) => {
      allPatientsMap.set(patient.id, patient)
    })

    // Adicionar pacientes com consultas (sobrescreve se já existir, mantendo o mais recente)
    consultationPatients.forEach((patient) => {
      allPatientsMap.set(patient.id, patient)
    })

    // Converter Map de volta para array
    return Array.from(allPatientsMap.values())
  }

export const useCombinedPatientsByDoctor = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: ['combined-patients', doctorId],
    queryFn: getCombinedPatientsByDoctorQueryFn(doctorId),
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default usePatientsByDoctor
