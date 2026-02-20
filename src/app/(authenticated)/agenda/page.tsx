'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  addMinutes,
  endOfWeek,
  format as formatDateFns,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  UserX,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import LoadingComponent from '@/components/atoms/Loading/loading'
import { WeeklyCalendar } from '@/components/molecules/WeeklyCalendar/weeklyCalendar'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { AbsenceModal } from '@/components/organisms/Modals/AbsenceModal/absenceModal'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { ConsultationDetailsModal } from '@/components/organisms/Modals/ConsultationDetailsModal/consultationDetailsModal'
import { RescheduleConsultationModal } from '@/components/organisms/Modals/RescheduleConsultationModal/rescheduleConsultationModal'
import useAbsences from '@/hooks/queries/useAbsences'
import useAllConsultations, {
  getAllConsultationsQueryKey,
} from '@/hooks/queries/useAllConsultations'
import { useCreateAbsence } from '@/hooks/queries/useCreateAbsence'
import usePatientsByDoctor from '@/hooks/queries/usePatientsByDoctor'
import { useAppToast } from '@/hooks/useAppToast'
import useUser from '@/hooks/useUser'
import { cancelConsultation, updateConsultation } from '@/services/consultation'
import {
  createVideoCall,
  getActiveVideoCall,
} from '@/services/consultationVideoCall'
import { sendNotification } from '@/services/notification/notification'
import { getPatientsByIds } from '@/services/patient'
import {
  AgendaAbsence,
  AgendaConsultation,
  AgendaItem,
} from '@/types/entities/agendaConsultation'

import { getAppointmentsColumns } from './columns'

type ViewMode = 'dia' | 'semana'

const HOUR_SEPARATOR_REGEX = /\s*(?:-|–|às)\s*/i

const DEFAULT_CONSULTATION_DURATION_MINUTES = 60

const formatDisplayDate = (currentDate: Date, mode: ViewMode) => {
  if (mode === 'semana') {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })

    const startLabel = formatDateFns(start, "d 'de' MMMM", { locale: ptBR })
    const endLabel = formatDateFns(end, "d 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    })

    return `${startLabel} - ${endLabel}`
  }

  return formatDateFns(currentDate, "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
}

const parseTimeString = (referenceDate: Date, time: string | undefined) => {
  const base = startOfDay(referenceDate)

  if (!time) {
    return base
  }

  const [hoursPart = '0', minutesPart = '0'] = time
    .split(':')
    .map((value) => value.trim())

  const hoursValue = Number(hoursPart)
  const minutesValue = Number(minutesPart)

  const hours = Number.isFinite(hoursValue) ? hoursValue : 0
  const minutes = Number.isFinite(minutesValue) ? minutesValue : 0

  base.setHours(hours, minutes, 0, 0)
  return base
}

const deriveConsultationTimes = (
  date: Date,
  hourRange: string | undefined,
  durationMinutes: number,
) => {
  const normalizedDate = startOfDay(date)

  const safeDuration =
    Number.isFinite(durationMinutes) && durationMinutes > 0
      ? durationMinutes
      : DEFAULT_CONSULTATION_DURATION_MINUTES

  if (!hourRange || !hourRange.trim()) {
    return {
      start: normalizedDate,
      end: addMinutes(normalizedDate, safeDuration),
    }
  }

  const [startRaw, endRaw] = hourRange.split(HOUR_SEPARATOR_REGEX)

  const start = parseTimeString(normalizedDate, startRaw)

  // Se veio um horário de término explícito (ex: "19:00 - 19:30"),
  // respeitamos esse valor. Caso contrário, usamos a duração da agenda.
  let end = endRaw
    ? parseTimeString(normalizedDate, endRaw)
    : addMinutes(start, safeDuration)

  if (end <= start) {
    end = addMinutes(start, 30)
  }

  return {
    start,
    end,
  }
}

export default function AgendaPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('dia')
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [selectedConsultation, setSelectedConsultation] =
    useState<AgendaConsultation | null>(null)

  const { currentUser } = useUser()
  const { data: consultations, isLoading: isLoadingConsultations } =
    useAllConsultations()
  const { data: patients, isLoading: isLoadingPatients } = usePatientsByDoctor()
  const { data: absences, isLoading: isLoadingAbsences } = useAbsences(
    currentUser?.id,
  )

  const { mutate: createAbsence, isPending: isCreatingAbsence } =
    useCreateAbsence()
  const { success: showSuccessToast, error: showErrorToast } = useAppToast()

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>()
    patients?.forEach((patient) => {
      if (patient?.id) {
        const fallback = patient.email || patient.id
        map.set(patient.id, patient.name || fallback)
      }
    })
    return map
  }, [patients])

  const consultationDurationMinutes = useMemo(() => {
    const duration = currentUser?.agenda?.complementaryConsultationDuration ?? 0
    if (typeof duration === 'number' && duration > 0) {
      return duration
    }
    return DEFAULT_CONSULTATION_DURATION_MINUTES
  }, [currentUser?.agenda?.complementaryConsultationDuration])

  const consultationsForDoctor = useMemo(() => {
    if (!consultations || !currentUser?.id) {
      return []
    }

    return consultations.filter(
      (consultation) => consultation.doctorId === currentUser.id,
    )
  }, [consultations, currentUser?.id])

  const agendaConsultations: AgendaConsultation[] = useMemo(() => {
    return consultationsForDoctor
      .map((consultation) => {
        const { start, end } = deriveConsultationTimes(
          consultation.date,
          consultation.hour,
          consultationDurationMinutes,
        )

        const hourLabel = `${formatDateFns(start, 'HH:mm')} - ${formatDateFns(end, 'HH:mm')}`

        return {
          ...consultation,
          hour: hourLabel,
          patientName:
            patientNameMap.get(consultation.patientId) || 'Paciente sem nome',
          startDateTime: start,
          endDateTime: end,
        }
      })
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
  }, [consultationsForDoctor, patientNameMap, consultationDurationMinutes])

  const agendaAbsences: AgendaAbsence[] = useMemo(() => {
    if (!absences || !currentUser?.id) return []

    return absences.map((absence) => {
      const normalizedDate = startOfDay(absence.date)

      const parseTime = (timeStr: string) => {
        const [hours = '0', minutes = '0'] = timeStr
          .split(':')
          .map((v) => v.trim())
        const h = Number(hours) || 0
        const m = Number(minutes) || 0
        const date = new Date(normalizedDate)
        date.setHours(h, m, 0, 0)
        return date
      }

      return {
        id: absence.id,
        type: 'absence' as const,
        doctorId: currentUser.id,
        date: normalizedDate,
        startDateTime: parseTime(absence.startHour),
        endDateTime: parseTime(absence.endHour),
        startHour: absence.startHour,
        endHour: absence.endHour,
      }
    })
  }, [absences, currentUser?.id])

  const allAgendaItems: AgendaItem[] = useMemo(() => {
    return [...agendaConsultations, ...agendaAbsences].sort(
      (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
    )
  }, [agendaConsultations, agendaAbsences])

  const dailyConsultations = useMemo(() => {
    const selectedDay = startOfDay(currentDate)
    return agendaConsultations.filter((consultation) => {
      const consultationDay = startOfDay(consultation.date)
      return consultationDay.getTime() === selectedDay.getTime()
    })
  }, [agendaConsultations, currentDate])

  const handleNavigate = (direction: 'previous' | 'next') => {
    const delta = viewMode === 'dia' ? 1 : 7

    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      const offset = direction === 'previous' ? -delta : delta
      newDate.setDate(newDate.getDate() + offset)
      return newDate
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  const handleOpenAbsenceModal = () => {
    setIsAbsenceModalOpen(true)
  }

  const handleSaveAbsence = (data: {
    date: Date
    startHour: string
    endHour: string
  }) => {
    if (!currentUser?.id) return

    createAbsence(
      {
        doctorId: currentUser.id,
        absenceData: data,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            showSuccessToast('Ausência definida com sucesso!')
          } else {
            showErrorToast(result.error || 'Erro ao definir ausência')
          }
        },
        onError: (error) => {
          showErrorToast('Erro ao definir ausência')
          console.error(error)
        },
      },
    )
  }

  const handleConsultationClick = useCallback(
    (consultation: AgendaConsultation) => {
      setSelectedConsultation(consultation)
      setIsDetailsModalOpen(true)
    },
    [],
  )

  const handleCancelConsultation = useCallback(
    (consultationId: string) => {
      const consultation = agendaConsultations.find(
        (c) => c.id === consultationId,
      )
      if (consultation) {
        setSelectedConsultation(consultation)
        setIsCancelModalOpen(true)
      }
    },
    [agendaConsultations],
  )

  const handleConfirmCancel = async () => {
    if (!selectedConsultation) return

    setIsCancelling(true)
    try {
      try {
        await fetch('/api/cancel-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocolNumber: selectedConsultation.protocolNumber ?? '',
          }),
        })
      } catch {
        // ignora erro do refund e segue com o cancelamento
      }

      const result = await cancelConsultation(selectedConsultation.id)

      if (result.success) {
        try {
          const { patients } = await getPatientsByIds([
            selectedConsultation.patientId,
          ])
          const patient = patients[0]
          const dateStr = formatDateFns(
            selectedConsultation.date instanceof Date
              ? selectedConsultation.date
              : new Date(selectedConsultation.date),
            'dd/MM/yyyy',
            { locale: ptBR },
          )
          await sendNotification({
            title: 'Consulta cancelada',
            content: `Dr(a). ${currentUser?.name ?? 'Seu médico'} cancelou sua consulta marcada para ${dateStr} às ${selectedConsultation.hour}.`,
            type: 'Consulta',
            users: [
              {
                userId: selectedConsultation.patientId,
                tokens: patient?.tokens ?? [],
              },
            ],
            status: '',
            date: null,
            hasSeenToUsers: [],
          })
        } catch {
          // ignora erro da notificação
        }
        showSuccessToast('Consulta cancelada com sucesso!')
        queryClient.invalidateQueries({
          queryKey: getAllConsultationsQueryKey(),
        })
        setIsCancelModalOpen(false)
        setIsDetailsModalOpen(false)
      } else {
        showErrorToast(result.error || 'Erro ao cancelar consulta')
      }
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error)
      showErrorToast('Erro ao cancelar consulta')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleRescheduleConsultation = useCallback(
    (consultation: AgendaConsultation) => {
      setSelectedConsultation(consultation)
      setIsRescheduleModalOpen(true)
    },
    [],
  )

  const handleConfirmReschedule = async (
    consultationId: string,
    date: Date,
    hour: string,
  ) => {
    try {
      const result = await updateConsultation(consultationId, { date, hour })

      if (result.success) {
        showSuccessToast('Consulta reagendada com sucesso!')
        queryClient.invalidateQueries({
          queryKey: getAllConsultationsQueryKey(),
        })
        setIsDetailsModalOpen(false)
      } else {
        showErrorToast(result.error || 'Erro ao reagendar consulta')
      }
    } catch (error) {
      console.error('Erro ao reagendar consulta:', error)
      showErrorToast('Erro ao reagendar consulta')
    }
  }

  const handleStartConsultation = useCallback(
    async (consultationId: string) => {
      if (!currentUser?.id) {
        showErrorToast('Usuário não autenticado')
        return
      }

      const consultation = agendaConsultations.find(
        (c) => c.id === consultationId,
      )

      if (!consultation) {
        showErrorToast('Consulta não encontrada')
        return
      }

      if (consultation.format?.toUpperCase() !== 'ONLINE') {
        showErrorToast('Esta consulta não é uma teleconsulta')
        return
      }

      try {
        // Se já existe chamada ativa (ex.: médico fechou a aba sem querer), redireciona para ela
        const activeCall = await getActiveVideoCall(consultationId)
        if (activeCall.call) {
          router.push(
            `/agenda/${consultationId}/video/${activeCall.call.id}?role=host`,
          )
          return
        }
        if (activeCall.error) {
          showErrorToast(activeCall.error)
          return
        }

        // Atualiza o status da consulta para "IN_PROGRESS" e marca o paciente como autorizado
        const updateResult = await updateConsultation(consultationId, {
          status: 'IN_PROGRESS',
          patientAuthorized: true,
        })

        if (!updateResult.success) {
          showErrorToast(
            updateResult.error ||
              'Erro ao atualizar o status da consulta para Em progresso',
          )
          return
        }

        // Garante que os dados da agenda sejam recarregados
        queryClient.invalidateQueries({
          queryKey: getAllConsultationsQueryKey(),
        })

        const patientName = patientNameMap.get(consultation.patientId)

        const result = await createVideoCall(
          consultationId,
          currentUser.id,
          currentUser.name || 'Médico',
          consultation.patientId,
          patientName,
        )

        if (result.error) {
          showErrorToast(result.error)
          return
        }

        if (!result.callId) {
          showErrorToast('Erro ao criar videochamada')
          return
        }

        // Redirecionar para a página da videochamada
        router.push(
          `/agenda/${consultationId}/video/${result.callId}?role=host`,
        )
      } catch (error) {
        console.error('Erro ao iniciar consulta:', error)
        showErrorToast('Erro ao iniciar consulta')
      }
    },
    [
      currentUser,
      agendaConsultations,
      patientNameMap,
      router,
      showErrorToast,
      queryClient,
    ],
  )

  const handleStartPresentialConsultation = useCallback(
    async (consultationId: string) => {
      const consultation = agendaConsultations.find(
        (c) => c.id === consultationId,
      )

      if (!consultation) {
        showErrorToast('Consulta não encontrada')
        return
      }

      // Verificar se é uma consulta presencial
      const isPresential =
        consultation.format?.toUpperCase() === 'PRESENTIAL' ||
        consultation.format?.toUpperCase() === 'PRESENCIAL' ||
        consultation.format?.toUpperCase() === 'IN_PERSON'

      if (!isPresential) {
        showErrorToast('Esta consulta não é presencial')
        return
      }

      // Definir startedAt e status IN_PROGRESS apenas se ainda não foi iniciada
      if (!consultation.startedAt) {
        try {
          const updateResult = await updateConsultation(consultationId, {
            startedAt: new Date(),
            status: 'IN_PROGRESS',
          })

          if (!updateResult.success) {
            showErrorToast(
              updateResult.error ||
                'Erro ao iniciar consulta. Tente novamente.',
            )
            return
          }

          // Invalidar cache para atualizar a lista
          queryClient.invalidateQueries({
            queryKey: getAllConsultationsQueryKey(),
          })
        } catch (error) {
          console.error('Erro ao iniciar consulta:', error)
          showErrorToast('Erro ao iniciar consulta')
          return
        }
      }

      // Navegar para a página da consulta presencial
      router.push(`/agenda/${consultationId}/presential`)
    },
    [agendaConsultations, router, showErrorToast, queryClient],
  )

  const dateLabel = useMemo(
    () => formatDisplayDate(currentDate, viewMode),
    [currentDate, viewMode],
  )

  const isLoadingData =
    isLoadingConsultations || isLoadingPatients || isLoadingAbsences

  const renderLoading = (
    <div className="flex h-full items-center justify-center">
      <LoadingComponent className="text-purple-600" />
    </div>
  )

  const tableColumns = useMemo(
    () =>
      getAppointmentsColumns({
        onViewDetails: handleConsultationClick,
        onReschedule: handleRescheduleConsultation,
        onCancel: handleCancelConsultation,
        onStartConsultation: handleStartConsultation,
        onStartPresentialConsultation: handleStartPresentialConsultation,
      }),
    [
      handleConsultationClick,
      handleRescheduleConsultation,
      handleCancelConsultation,
      handleStartConsultation,
      handleStartPresentialConsultation,
    ],
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 sm:h-screen">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-brand-purple-dark sm:text-2xl">
            Agenda
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary-color"
              size="sm"
              className="sm:size-md"
              icon={<ClipboardList className="h-4 w-4 shrink-0" />}
              onClick={() => router.push('/agenda/consultation-history')}
            >
              <span className="hidden sm:inline">
                Ver histórico de consultas
              </span>
              <span className="sm:hidden">Histórico</span>
            </Button>
            <Button
              variant="secondary-color"
              size="sm"
              className="sm:size-md"
              icon={<CalendarClock className="h-4 w-4 shrink-0" />}
              onClick={() => router.push('/configure-agenda?mode=edit')}
            >
              <span className="hidden sm:inline">Configurar minha agenda</span>
              <span className="sm:hidden">Configurar</span>
            </Button>
            <Button
              variant="secondary-color"
              size="sm"
              className="sm:size-md"
              icon={<UserX className="h-4 w-4 shrink-0" />}
              onClick={handleOpenAbsenceModal}
            >
              <span className="hidden sm:inline">Definir minha ausência</span>
              <span className="sm:hidden">Ausência</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-4">
            <Button
              variant="secondary-gray"
              size="sm"
              onClick={handleToday}
              className="shrink-0 font-semibold"
            >
              Hoje
            </Button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:justify-start sm:gap-2">
              <button
                onClick={() => handleNavigate('previous')}
                className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-2"
                title={viewMode === 'dia' ? 'Dia anterior' : 'Semana anterior'}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <span className="min-w-0 truncate px-2 text-center text-base font-bold text-gray-900 sm:min-w-[200px] sm:px-0 sm:text-xl lg:min-w-[250px]">
                {dateLabel}
              </span>
              <button
                onClick={() => handleNavigate('next')}
                className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-2"
                title={viewMode === 'dia' ? 'Próximo dia' : 'Próxima semana'}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex justify-center sm:shrink-0">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => handleViewModeChange('dia')}
                className={`w-24 rounded-full px-4 py-2 text-sm font-semibold transition-all sm:w-32 sm:px-6 ${
                  viewMode === 'dia'
                    ? 'bg-[#792EBD] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => handleViewModeChange('semana')}
                className={`w-24 rounded-full px-4 py-2 text-sm font-semibold transition-all sm:w-32 sm:px-6 ${
                  viewMode === 'semana'
                    ? 'bg-[#792EBD] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {viewMode === 'dia' ? (
          isLoadingData ? (
            renderLoading
          ) : (
            <div className="h-full min-h-0 w-full overflow-x-auto">
              <DataTable
                columns={tableColumns}
                data={dailyConsultations}
                searchColumn="patientName"
                searchInputPlaceholder="Buscar por nome do paciente..."
              />
            </div>
          )
        ) : (
          <div className="h-full min-h-0 overflow-hidden rounded-xl border bg-white">
            {isLoadingData ? (
              renderLoading
            ) : (
              <WeeklyCalendar
                consultations={allAgendaItems}
                initialDate={currentDate}
                onDateChange={handleDateChange}
                onConsultationClick={handleConsultationClick}
              />
            )}
          </div>
        )}
      </div>

      <AbsenceModal
        isOpen={isAbsenceModalOpen}
        setIsOpen={setIsAbsenceModalOpen}
        onSave={handleSaveAbsence}
        loading={isCreatingAbsence}
      />

      <ConsultationDetailsModal
        isOpen={isDetailsModalOpen}
        setIsOpen={setIsDetailsModalOpen}
        consultation={selectedConsultation}
        onCancel={handleCancelConsultation}
        onReschedule={handleRescheduleConsultation}
        onStartConsultation={handleStartConsultation}
      />

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        setIsOpen={setIsCancelModalOpen}
        title="Cancelar Consulta"
        description="Tem certeza que deseja cancelar esta consulta?"
        content={
          selectedConsultation && (
            <div className="space-y-2 text-left">
              <p>
                <strong>Paciente:</strong> {selectedConsultation.patientName}
              </p>
              <p>
                <strong>Data:</strong>{' '}
                {formatDateFns(selectedConsultation.date, 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </p>
              <p>
                <strong>Horário:</strong> {selectedConsultation.hour}
              </p>
            </div>
          )
        }
        icon={<AlertCircle className="h-6 w-6 text-red-500" />}
        action={handleConfirmCancel}
        actionLabel="Sim, cancelar"
        actionButtonVariant="destructive"
        cancelLabel="Não, voltar"
        loading={isCancelling}
      />

      <RescheduleConsultationModal
        isOpen={isRescheduleModalOpen}
        setIsOpen={setIsRescheduleModalOpen}
        consultation={selectedConsultation}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  )
}
