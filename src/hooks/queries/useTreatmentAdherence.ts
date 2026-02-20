import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getActiveMedicaments } from '@/services/medicaments'
import { getMedicationDosesInPeriod } from '@/services/medicationDoses'
import { MedicationEntity } from '@/types/entities/medicaments'
import {
  DoseStatus,
  MedicationDoseEntity,
} from '@/types/entities/medicationDose'

interface TreatmentAdherenceData {
  isAdheringToTreatment: boolean
  totalScheduledDoses: number
  takenDoses: number
  isLoading: boolean
  error: string | null
}

/**
 * Hook para calcular a adesão ao tratamento de um paciente
 * Avalia o dia anterior de medicação
 */
export function useTreatmentAdherence(
  patientId: string,
): TreatmentAdherenceData {
  // Definir período de avaliação (dia anterior)
  const yesterday = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date
  }, [])
  const startDate = useMemo(() => {
    const start = new Date(yesterday)
    start.setHours(0, 0, 0, 0)
    return start
  }, [yesterday])
  const endDate = useMemo(() => {
    const end = new Date(yesterday)
    end.setHours(23, 59, 59, 999)
    return end
  }, [yesterday])

  // Buscar medicamentos ativos do paciente e suas doses em uma única query
  const { data: treatmentData, isLoading } = useQuery({
    queryKey: [
      'treatmentAdherence',
      patientId,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async () => {
      // Primeiro buscar os medicamentos ativos
      const medicationsResult = await getActiveMedicaments(patientId)

      if (medicationsResult.error) {
        throw new Error(medicationsResult.error)
      }

      const activeMedications = medicationsResult.medicaments

      // Buscar doses de todos os medicamentos ativos
      const existingDosesMap: { [key: string]: MedicationDoseEntity[] } = {}
      for (const medication of activeMedications) {
        const doses = await getMedicationDosesInPeriod(
          patientId,
          medication.id,
          startDate,
          endDate,
        )
        existingDosesMap[medication.id] = doses
      }
      return {
        activeMedications,
        existingDosesMap,
      }
    },
    enabled: !!patientId,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0, // Dados ficam stale imediatamente
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
  })

  const adherenceData = useMemo(() => {
    if (isLoading) {
      return {
        isAdheringToTreatment: false,
        totalScheduledDoses: 0,
        takenDoses: 0,
        isLoading: true,
        error: null,
      }
    }

    if (!treatmentData) {
      return {
        isAdheringToTreatment: false,
        totalScheduledDoses: 0,
        takenDoses: 0,
        isLoading: false,
        error: 'Erro ao carregar dados do tratamento',
      }
    }

    const { activeMedications, existingDosesMap } = treatmentData

    // Se não há medicamentos ativos, considera como "em dia"
    if (activeMedications.length === 0) {
      return {
        isAdheringToTreatment: true,
        totalScheduledDoses: 0,
        takenDoses: 0,
        isLoading: false,
        error: null,
      }
    }

    // Calcular todas as doses agendadas nos últimos 7 dias
    const scheduledDoses = calculateAllMedicationSchedules(
      activeMedications,
      startDate,
      endDate,
      existingDosesMap,
    )

    // Contar doses programadas e tomadas
    const totalScheduledDoses = scheduledDoses.length
    const takenDoses = scheduledDoses.filter(
      (dose) => dose.status === DoseStatus.TAKEN,
    ).length

    // Considerar como aderindo apenas se tomou todas as doses do dia anterior
    const isAdheringToTreatment = takenDoses === totalScheduledDoses

    return {
      isAdheringToTreatment,
      totalScheduledDoses,
      takenDoses,
      isLoading: false,
      error: null,
    }
  }, [treatmentData, isLoading, endDate, startDate])

  return adherenceData
}

export interface ScheduledDose {
  medicationId: string
  medication: MedicationEntity
  scheduledTime: Date
  status?: DoseStatus
  doseId?: string
}

/**
 * Calcula os horários de administração de um medicamento
 */
export function calculateMedicationSchedule(
  medication: MedicationEntity,
  startDate: Date,
  endDate: Date,
  existingDoses: MedicationDoseEntity[] = [],
): ScheduledDose[] {
  const scheduledDoses: ScheduledDose[] = []

  // Só calcula para medicamentos ACTIVE ou CREATED
  if (medication.status !== 'ACTIVE' && medication.status !== 'CREATED') {
    return scheduledDoses
  }

  // Só calcula para Uso contínuo ou Tratamento
  if (medication.usageClassification === 'Sintomático') {
    return scheduledDoses
  }

  // Verificar se tem intervalo configurado
  if (!medication.interval || !medication.intervalUnit) {
    return scheduledDoses
  }

  // Obter data de criação do medicamento
  const createdAt =
    medication.createdAt instanceof Date
      ? new Date(medication.createdAt)
      : medication.createdAt?.toDate
        ? medication.createdAt.toDate()
        : new Date()

  // Determinar data inicial base
  let baseDate: Date
  if (medication.startDate) {
    const start =
      typeof medication.startDate.toDate === 'function'
        ? medication.startDate.toDate()
        : medication.startDate instanceof Date
          ? medication.startDate
          : new Date()
    // Usar a data inicial se for no futuro, senão usar createdAt
    baseDate = start > createdAt ? start : createdAt
  } else {
    baseDate = createdAt
  }

  // Extrair horário base (hora e minuto da criação ou startDate)
  const baseHour = baseDate.getHours()
  const baseMinute = baseDate.getMinutes()

  // Determinar data final
  let finalDate: Date
  if (medication.usageClassification === 'Tratamento' && medication.endDate) {
    const end =
      typeof medication.endDate.toDate === 'function'
        ? medication.endDate.toDate()
        : medication.endDate instanceof Date
          ? medication.endDate
          : new Date()
    // Garantir que finalDate inclui o dia inteiro
    finalDate = new Date(end)
    finalDate.setHours(23, 59, 59, 999)
  } else {
    // Uso contínuo ou sem endDate: usar endDate do período solicitado
    finalDate = new Date(endDate)
    finalDate.setHours(23, 59, 59, 999)
  }

  // Calcular primeira ocorrência válida no período
  let currentDate = new Date(startDate)
  currentDate.setHours(baseHour, baseMinute, 0, 0)

  // Se o horário já passou no início do período, avançar para a próxima ocorrência
  if (currentDate < startDate) {
    if (medication.intervalUnit === 'Dias') {
      currentDate.setDate(currentDate.getDate() + medication.interval)
    } else if (medication.intervalUnit === 'Horas') {
      currentDate.setHours(currentDate.getHours() + medication.interval)
    }
  }

  // Criar mapa de doses existentes por horário
  // Usar uma chave baseada em data e hora (sem segundos) para comparação
  const dosesMap = new Map<string, MedicationDoseEntity>()
  existingDoses.forEach((dose) => {
    // Parse id to Date (id format: DD-MM-YYYY-HH-MM-SS)
    const [day, month, year, hour, minute, second] = dose.id
      .split('-')
      .map(Number)
    const doseTime = new Date(year, month - 1, day, hour, minute, second || 0)
    // Criar chave baseada em data e hora (sem segundos)
    const key = `${doseTime.getFullYear()}-${String(doseTime.getMonth() + 1).padStart(2, '0')}-${String(doseTime.getDate()).padStart(2, '0')}-${String(doseTime.getHours()).padStart(2, '0')}-${String(doseTime.getMinutes()).padStart(2, '0')}`
    dosesMap.set(key, dose)
  })

  // Gerar horários
  // Ajustar endDate para incluir o dia inteiro (23:59:59.999)
  const adjustedEndDate = new Date(endDate)
  adjustedEndDate.setHours(23, 59, 59, 999)

  while (currentDate <= finalDate && currentDate <= adjustedEndDate) {
    // Verificar se já existe uma dose para este horário
    // Criar chave baseada em data e hora (sem segundos)
    const timeKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getHours()).padStart(2, '0')}-${String(currentDate.getMinutes()).padStart(2, '0')}`
    const existingDose = dosesMap.get(timeKey)

    scheduledDoses.push({
      medicationId: medication.id,
      medication,
      scheduledTime: new Date(currentDate),
      status: existingDose?.status,
      doseId: existingDose?.id,
    })

    // Calcular próximo horário
    if (medication.intervalUnit === 'Horas') {
      currentDate = new Date(
        currentDate.getTime() + medication.interval * 60 * 60 * 1000,
      )
    } else if (medication.intervalUnit === 'Dias') {
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + medication.interval)
    } else {
      break // Unidade desconhecida, parar
    }
  }

  return scheduledDoses
}

/**
 * Calcula todos os horários de administração para múltiplos medicamentos
 */
export function calculateAllMedicationSchedules(
  medications: MedicationEntity[],
  startDate: Date,
  endDate: Date,
  existingDosesMap: { [key: string]: MedicationDoseEntity[] } = {},
): ScheduledDose[] {
  const allScheduledDoses: ScheduledDose[] = []

  medications.forEach((medication) => {
    const existingDoses = existingDosesMap[medication.id] || []
    const scheduledDoses = calculateMedicationSchedule(
      medication,
      startDate,
      endDate,
      existingDoses,
    )
    allScheduledDoses.push(...scheduledDoses)
  })

  // Ordenar por horário
  allScheduledDoses.sort(
    (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime(),
  )

  return allScheduledDoses
}
