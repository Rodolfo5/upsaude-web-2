'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { addMinutes, startOfDay } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import DatePickerField from '@/components/molecules/DatePickerField/datePickerField'
import HourPickerField from '@/components/molecules/HourPickerField/hourPickerField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import useAbsences from '@/hooks/queries/useAbsences'
import useAllConsultations from '@/hooks/queries/useAllConsultations'
import { useAppToast } from '@/hooks/useAppToast'
import { AbsenceEntity } from '@/types/entities/absence'
import { ConsultationEntity } from '@/types/entities/consultation'

import { RescheduleConsultationModalProps } from './types'

const rescheduleSchema = z.object({
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  hour: z.string().min(1, 'Horário é obrigatório'),
})

type RescheduleFormData = z.infer<typeof rescheduleSchema>

const HOUR_SEPARATOR_REGEX = /\s*(?:-|–|às)\s*/i

// Função para extrair o horário inicial de um intervalo ou retornar o horário simples
const extractStartHour = (hourString: string | undefined): string => {
  if (!hourString) return ''

  // Se for um intervalo (ex: "17:13 - 18:13"), pegar apenas a primeira parte
  if (
    hourString.includes('-') ||
    hourString.includes('–') ||
    hourString.includes('às')
  ) {
    const [startHour] = hourString.split(HOUR_SEPARATOR_REGEX)
    return startHour.trim()
  }

  // Se já for um horário simples (ex: "17:13"), retornar como está
  return hourString.trim()
}

// Função auxiliar para parsear horário
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

// Função auxiliar para derivar horários de início e fim de uma consulta
const deriveConsultationTimes = (date: Date, hourRange: string | undefined) => {
  const normalizedDate = startOfDay(date)

  if (!hourRange || !hourRange.trim()) {
    return {
      start: normalizedDate,
      end: addMinutes(normalizedDate, 60),
    }
  }

  const [startRaw, endRaw] = hourRange.split(HOUR_SEPARATOR_REGEX)

  const start = parseTimeString(normalizedDate, startRaw)
  let end = endRaw
    ? parseTimeString(normalizedDate, endRaw)
    : addMinutes(start, 60)

  if (end <= start) {
    end = addMinutes(start, 30)
  }

  return {
    start,
    end,
  }
}

// Função para verificar se dois intervalos de tempo se sobrepõem
const timeRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 < end2 && start2 < end1
}

// Função para verificar se há conflito com ausência
const hasAbsenceConflict = (
  date: Date,
  hour: string,
  absences: AbsenceEntity[],
): boolean => {
  const { start: consultationStart, end: consultationEnd } =
    deriveConsultationTimes(date, hour)

  return absences.some((absence) => {
    const absenceDate = startOfDay(absence.date)
    const consultationDate = startOfDay(date)

    // Verificar se é o mesmo dia
    if (absenceDate.getTime() !== consultationDate.getTime()) {
      return false
    }

    const absenceStart = parseTimeString(absenceDate, absence.startHour)
    const absenceEnd = parseTimeString(absenceDate, absence.endHour)

    return timeRangesOverlap(
      consultationStart,
      consultationEnd,
      absenceStart,
      absenceEnd,
    )
  })
}

// Função para verificar se há conflito com outra consulta
const hasConsultationConflict = (
  date: Date,
  hour: string,
  consultations: ConsultationEntity[],
  excludeConsultationId?: string,
): boolean => {
  const { start: newStart, end: newEnd } = deriveConsultationTimes(date, hour)
  const consultationDate = startOfDay(date)

  return consultations.some((consultation) => {
    // Excluir a própria consulta que está sendo reagendada
    if (excludeConsultationId && consultation.id === excludeConsultationId) {
      return false
    }

    // Verificar se é o mesmo dia
    const existingDate = startOfDay(consultation.date)
    if (existingDate.getTime() !== consultationDate.getTime()) {
      return false
    }

    const { start: existingStart, end: existingEnd } = deriveConsultationTimes(
      consultation.date,
      consultation.hour,
    )

    return timeRangesOverlap(newStart, newEnd, existingStart, existingEnd)
  })
}

export function RescheduleConsultationModal({
  isOpen,
  setIsOpen,
  consultation,
  onConfirm,
}: RescheduleConsultationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { error: showErrorToast } = useAppToast()

  // Buscar ausências do médico
  const { data: absences = [] } = useAbsences(consultation?.doctorId)

  // Buscar todas as consultas
  const { data: allConsultations = [] } = useAllConsultations()

  const { control, handleSubmit, reset, formState } =
    useForm<RescheduleFormData>({
      resolver: zodResolver(rescheduleSchema),
      defaultValues: {
        date: consultation?.date || new Date(),
        hour: extractStartHour(consultation?.hour),
      },
    })

  // Update form when consultation changes
  useEffect(() => {
    if (consultation) {
      reset({
        date: consultation.date || new Date(),
        hour: extractStartHour(consultation.hour),
      })
    }
  }, [consultation, reset])

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const onSubmit = async (data: RescheduleFormData) => {
    if (!consultation) return

    setIsLoading(true)
    try {
      // Validação 1: Verificar se há ausência do médico na data/horário selecionado
      if (hasAbsenceConflict(data.date, data.hour, absences)) {
        showErrorToast(
          'Horário indisponível. O médico possui uma ausência registrada neste período. Por favor, selecione outro horário.',
        )
        setIsLoading(false)
        return
      }

      // Validação 2: Verificar se o médico já tem outra consulta no mesmo horário
      const doctorConsultations = allConsultations.filter(
        (c) => c.doctorId === consultation.doctorId,
      )
      if (
        hasConsultationConflict(
          data.date,
          data.hour,
          doctorConsultations,
          consultation.id,
        )
      ) {
        showErrorToast(
          'Horário indisponível. O médico já possui outra consulta agendada neste horário. Por favor, selecione outro horário.',
        )
        setIsLoading(false)
        return
      }

      // Validação 3: Verificar se o paciente já tem outra consulta no mesmo horário
      const patientConsultations = allConsultations.filter(
        (c) => c.patientId === consultation.patientId,
      )
      if (
        hasConsultationConflict(
          data.date,
          data.hour,
          patientConsultations,
          consultation.id,
        )
      ) {
        showErrorToast(
          'Horário indisponível. O paciente já possui outra consulta agendada neste horário. Por favor, selecione outro horário.',
        )
        setIsLoading(false)
        return
      }

      // Se passou em todas as validações, confirmar o reagendamento
      await onConfirm(consultation.id, data.date, data.hour)
      handleClose()
    } catch (error) {
      console.error('Erro ao remarcar consulta:', error)
      showErrorToast(
        'Ocorreu um erro ao reagendar a consulta. Por favor, tente novamente.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!consultation) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="items-start text-left">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Remarcar Consulta
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Selecione a nova data e horário para a consulta com{' '}
            <span className="font-semibold">{consultation.patientName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DatePickerField
            name="date"
            control={control}
            label="Nova Data"
            required
          />

          <HourPickerField name="hour" control={control} label="Novo Horário" />

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary-gray"
              className="flex-1 text-[#792EBD]"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!formState.isValid || isLoading}
              loading={isLoading}
            >
              Confirmar Remarcação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
