import { useQuery } from '@tanstack/react-query'
import { startOfMonth, startOfDay, endOfDay } from 'date-fns'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import {
  getAllConsultationsByDoctor,
  getUniquePatientIdsByDoctor,
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

const useDashboardData = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)
  const monthStart = startOfMonth(today)

  return useQuery({
    queryKey: ['dashboard-data', doctorId, today.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!doctorId) throw new Error('DoctorId é obrigatório')

      // Fetch all data in parallel
      const [
        allConsultationsResult,
        acompanhamentoResult,
        complementaryResult,
        prescriptions,
      ] = await Promise.all([
        getAllConsultationsByDoctor(doctorId),
        getPatientsByDoctorId(doctorId),
        getComplementaryConsultationsByDoctor(doctorId),
        findAllPrescriptionsByDoctor(doctorId),
      ])

      const allConsultations = allConsultationsResult.consultations || []
      const acompanhamento = acompanhamentoResult.patients || []
      const complementaryConsultations =
        complementaryResult.complementaryConsultations || []

      // Get unique patient IDs from all consultations
      const patientIds = [
        ...new Set(allConsultations.map((c) => c.patientId)),
      ]
      const patientsResult = await getPatientsByIds(patientIds)
      const patients = patientsResult.patients || []

      // Build patient name map
      const patientNameMap = new Map<string, string>()
      patients.forEach((patient: any) => {
        if (patient?.id) {
          patientNameMap.set(
            patient.id,
            patient.name || patient.email || patient.id,
          )
        }
      })

      // Filter today's consultations
      const todayConsultations = allConsultations.filter((c) => {
        const consultationDate = new Date(c.date)
        return (
          c.doctorId === doctorId &&
          consultationDate >= todayStart &&
          consultationDate <= todayEnd
        )
      })

      // Add patient names to today's consultations
      const todayConsultationsWithNames = todayConsultations.map(
        (consultation) => ({
          ...consultation,
          patientName:
            patientNameMap.get(consultation.patientId) || 'Paciente sem nome',
        }),
      )

      // Sort by hour
      todayConsultationsWithNames.sort((a, b) => {
        const timeA = a.hour.split('-')[0] || '00:00'
        const timeB = b.hour.split('-')[0] || '00:00'
        return timeA.localeCompare(timeB)
      })

      // Calculate active patients
      const activePatients = acompanhamento.length

      // Calculate new patients (this month)
      const newPatients = acompanhamento.filter((patient: any) => {
        const createdAt = patient.createdAt ? new Date(patient.createdAt) : null
        return createdAt && createdAt >= monthStart
      }).length

      // Calculate patients attended this month
      const completedThisMonth = allConsultations.filter((c) => {
        const consultationDate = new Date(c.date)
        return (
          c.doctorId === doctorId &&
          c.status === 'COMPLETED' &&
          consultationDate >= monthStart
        )
      })
      const patientsAttendedThisMonth = new Set(
        completedThisMonth.map((c) => c.patientId),
      ).size

      // Calculate financial data
      const thisMonthConsultations = allConsultations.filter((c) => {
        const consultationDate = new Date(c.date)
        return c.doctorId === doctorId && consultationDate >= monthStart
      })

      const complementaryConsultationIds = new Set(
        complementaryConsultations.map((cc: any) => cc.consultationId),
      )
      const acompanhamentoPatientIds = new Set(
        acompanhamento.map((p: any) => p.id),
      )

      let monthlyRevenue = 0
      let recurring = 0
      let complementary = 0

      thisMonthConsultations.forEach((c) => {
        const value = Number(c.value) || 0
        monthlyRevenue += value

        if (complementaryConsultationIds.has(c.id)) {
          complementary += value
        } else if (acompanhamentoPatientIds.has(c.patientId)) {
          recurring += value
        }
      })

      // Calculate total patients attended (all time)
      const completedAllTime = allConsultations.filter(
        (c) => c.doctorId === doctorId && c.status === 'COMPLETED',
      )
      const totalPatientsAttended = new Set(
        completedAllTime.map((c) => c.patientId),
      ).size

      // Calculate prescriptions
      const totalPrescriptions = prescriptions.length
      const totalPrescribedExams = prescriptions.reduce(
        (total, prescription: any) => {
          return total + (prescription.exams?.length || 0)
        },
        0,
      )

      // Calculate complementary patients
      const complementares = patients.filter(
        (patient: any) =>
          !acompanhamento.some((acomp: any) => acomp.id === patient.id),
      )

      return {
        todayConsultations: todayConsultationsWithNames,
        activePatients,
        newPatients,
        patientsAttendedThisMonth,
        financialData: {
          monthlyRevenue,
          recurring,
          complementary,
        },
        totalPatientsAttended,
        totalPrescriptions,
        totalPrescribedExams,
        patients,
        classifiedPatients: {
          acompanhamento,
          complementares,
        },
      }
    },
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useDashboardData
