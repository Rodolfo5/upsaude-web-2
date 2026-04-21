import { useQuery } from '@tanstack/react-query'
import { startOfMonth, startOfDay, endOfDay } from 'date-fns'

import { FORTY_FIVE_MINUTES_IN_MS, ONE_DAY_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import {
  getAllConsultationsByDoctor,
  getConsultationsByDoctorSince,
} from '@/services/consultation'
import { getComplementaryConsultationsByDoctor } from '@/services/complementaryConsultation'
import { findAllPrescriptionsByDoctor } from '@/services/exam'
import { getPatientsByIds, getPatientsByDoctorId } from '@/services/patient'

export interface DashboardData {
  todayConsultations: any[]
  activePatients: number
  newPatients: number
  patientsAttendedThisMonth: number
  financialData: {
    monthlyRevenue: number
    recurring: number
    complementary: number
  }
  totalPatientsAttended: number
  totalPrescriptions: number
  totalPrescribedExams: number
  patients: any[]
  classifiedPatients: {
    acompanhamento: any[]
    complementares: any[]
  }
}

// Chave estavel por dia
const getTodayKey = () => new Date().toISOString().split('T')[0]

const useDashboardData = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  // Query rápida: apenas mês atual (pequeno dataset, cobre hoje + stats mensais)
  const recentQuery = useQuery({
    queryKey: ['dashboard-recent', doctorId, getTodayKey()],
    queryFn: async () => {
      if (!doctorId) throw new Error('DoctorId é obrigatório')

      const today = new Date()
      const todayStart = startOfDay(today)
      const todayEnd = endOfDay(today)
      const monthStart = startOfMonth(today)

      const [
        recentConsultationsResult,
        acompanhamentoResult,
        complementaryResult,
      ] = await Promise.all([
        getConsultationsByDoctorSince(doctorId, monthStart),
        getPatientsByDoctorId(doctorId),
        getComplementaryConsultationsByDoctor(doctorId),
      ])

      const recentConsultations = recentConsultationsResult.consultations || []
      const acompanhamento = acompanhamentoResult.patients || []
      const complementaryConsultations =
        complementaryResult.complementaryConsultations || []

      // Buscar dados de pacientes das consultas recentes (batch query — já otimizado)
      const patientIds = [...new Set(recentConsultations.map((c) => c.patientId))]
      const patientsResult = await getPatientsByIds(patientIds)
      const patients = patientsResult.patients || []

      const patientNameMap = new Map<string, string>()
      patients.forEach((patient: any) => {
        if (patient?.id) {
          patientNameMap.set(patient.id, patient.name || patient.email || patient.id)
        }
      })

      // Consultas de hoje (filtro client-side dentro do mês já baixado)
      const todayConsultations = recentConsultations
        .filter((c) => {
          const d = new Date(c.date)
          return d >= todayStart && d <= todayEnd
        })
        .map((c) => ({
          ...c,
          patientName: patientNameMap.get(c.patientId) || 'Paciente sem nome',
        }))
        .sort((a, b) => (a.hour || '').localeCompare(b.hour || ''))

      // Stats mensais
      const completedThisMonth = recentConsultations.filter(
        (c) => c.status === 'COMPLETED',
      )
      const patientsAttendedThisMonth = new Set(
        completedThisMonth.map((c) => c.patientId),
      ).size

      const complementaryConsultationIds = new Set(
        complementaryConsultations.map((cc: any) => cc.consultationId),
      )
      const acompanhamentoPatientIds = new Set(acompanhamento.map((p: any) => p.id))

      let monthlyRevenue = 0
      let recurring = 0
      let complementary = 0
      recentConsultations.forEach((c) => {
        const value = Number(c.value) || 0
        monthlyRevenue += value
        if (complementaryConsultationIds.has(c.id)) {
          complementary += value
        } else if (acompanhamentoPatientIds.has(c.patientId)) {
          recurring += value
        }
      })

      const newPatients = acompanhamento.filter((patient: any) => {
        const createdAt = patient.createdAt ? new Date(patient.createdAt) : null
        return createdAt && createdAt >= monthStart
      }).length

      const complementares = patients.filter(
        (patient: any) =>
          !acompanhamento.some((acomp: any) => acomp.id === patient.id),
      )

      return {
        todayConsultations,
        activePatients: acompanhamento.length,
        newPatients,
        patientsAttendedThisMonth,
        financialData: { monthlyRevenue, recurring, complementary },
        // Totais históricos: placeholder até query histórica carregar
        totalPatientsAttended: new Set(recentConsultations.map((c) => c.patientId)).size,
        totalPrescriptions: 0,
        totalPrescribedExams: 0,
        patients,
        classifiedPatients: { acompanhamento, complementares },
      }
    },
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })

  // Query histórica: totais all-time (cache de 1 dia, não bloqueia o render)
  const historicalQuery = useQuery({
    queryKey: ['dashboard-historical', doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error('DoctorId é obrigatório')
      const [allConsultationsResult, prescriptions] = await Promise.all([
        getAllConsultationsByDoctor(doctorId),
        findAllPrescriptionsByDoctor(doctorId),
      ])
      const allConsultations = allConsultationsResult.consultations || []
      const completedAllTime = allConsultations.filter(
        (c) => c.status === 'COMPLETED',
      )
      return {
        totalPatientsAttended: new Set(completedAllTime.map((c) => c.patientId)).size,
        totalPrescriptions: prescriptions.length,
        totalPrescribedExams: prescriptions.reduce(
          (total, p: any) => total + (p.exams?.length || 0),
          0,
        ),
      }
    },
    enabled: !!doctorId,
    staleTime: ONE_DAY_IN_MS,
  })

  // Merge: dados recentes (imediatos) + totais históricos (do cache ou background)
  const data = recentQuery.data
    ? {
        ...recentQuery.data,
        totalPatientsAttended:
          historicalQuery.data?.totalPatientsAttended ??
          recentQuery.data.totalPatientsAttended,
        totalPrescriptions: historicalQuery.data?.totalPrescriptions ?? 0,
        totalPrescribedExams: historicalQuery.data?.totalPrescribedExams ?? 0,
      }
    : undefined

  return {
    data,
    isLoading: recentQuery.isLoading,
    error: recentQuery.error,
    isError: recentQuery.isError,
  }
}

export default useDashboardData
