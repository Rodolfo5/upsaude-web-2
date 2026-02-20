'use client'

import { format, endOfDay, isWithinInterval, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon, Filter, User } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import Select from '@/components/atoms/Select/select'
import { DateRangeFilterModal } from '@/components/organisms/Modals/DateRangeFilterModal/dateRangeFilterModal'
import { useTimelinePatients } from '@/hooks/queries/useTimelinePatients'
import type { TimelinePatientEntity } from '@/types/entities/timelinePatient'

interface TimelinePatientProps {
  patientId: string
}

const timelineTypeColorMap: Record<string, string> = {
  'Check-Up digital': '#EB34EF',
  Consulta: '#8BAA36',
  'Prescrição Memed': '#448AF7',
  'Questionários de Saúde': '#2E86AB',
  'Plano Terapêutico': '#E5AC00',
  'Trilhas de Saúde': '#32B889',
  'Observações Médicas': '#CC306A',
}

const createdByLabelMap: Record<string, string> = {
  Doctor: 'Médico',
  Patient: 'Paciente',
  System: 'Sistema',
}

const createdByOptions = [
  { label: 'Todos', value: '' },
  { label: 'Médico', value: 'Doctor' },
  { label: 'Paciente', value: 'Patient' },
  { label: 'Sistema', value: 'System' },
]

const typeOptions = [
  { label: 'Todos', value: '' },
  { label: 'Check-Up digital', value: 'Check-Up digital' },
  { label: 'Consulta', value: 'Consulta' },
  { label: 'Prescrições Memed', value: 'Prescrição Memed' },
  { label: 'Questionários de Saúde', value: 'Questionários de Saúde' },
  { label: 'Plano Terapêutico', value: 'Plano Terapêutico' },
  { label: 'Trilhas de Saúde', value: 'Trilhas de Saúde' },
  { label: 'Observações Médicas', value: 'Observações Médicas' },
  { label: 'Exames', value: 'Exames' },
  { label: 'Medicamento', value: 'Medicamento' },
  { label: 'SOAP', value: 'SOAP' },
  { label: 'Outros', value: 'Outros' },
]

const getTimelineTypeColor = (type?: string) =>
  (type && timelineTypeColorMap[type]) || '#9CA3AF'

export function TimelinePatient({ patientId }: TimelinePatientProps) {
  const [createdByFilter, setCreatedByFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null,
  )
  const [isDateModalOpen, setIsDateModalOpen] = useState(false)

  const { data: timelinePatients = [], isLoading: isLoadingTimeline } =
    useTimelinePatients(patientId)

  const timelineItems = useMemo(() => {
    const toDate = (value: TimelinePatientEntity['createdAt']) => {
      if (!value) return null
      const cast = value as { toDate?: () => Date }
      if (typeof cast.toDate === 'function') {
        return cast.toDate()
      }
      if (value instanceof Date) {
        return value
      }
      const parsed = new Date(String(value))
      return Number.isFinite(parsed.getTime()) ? parsed : null
    }

    let items = [...timelinePatients]

    if (createdByFilter) {
      items = items.filter((item) => item.createdBy === createdByFilter)
    }

    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter)
    }

    if (dateRange) {
      const start = startOfDay(dateRange.from)
      const end = endOfDay(dateRange.to)
      items = items.filter((item) => {
        const itemDate = toDate(item.createdAt)
        if (!itemDate) return false
        return isWithinInterval(itemDate, { start, end })
      })
    }

    return items
  }, [timelinePatients, createdByFilter, typeFilter, dateRange])

  return (
    <>
      <div className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-purple-900">Timeline</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              options={createdByOptions}
              value={createdByFilter}
              onChange={setCreatedByFilter}
              placeholder="Quem adicionou a atividade"
              icon={<User className="h-4 w-4 text-purple-600" />}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white text-purple-700 sm:w-56"
            />
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Tipo de evento"
              icon={<Filter className="h-4 w-4 text-purple-600" />}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white text-purple-700 sm:w-48"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDateModalOpen(true)}
              className="h-10 w-full gap-2 border-gray-200 text-purple-700 hover:bg-transparent sm:w-auto"
            >
              <CalendarIcon className="h-4 w-4 text-purple-600" />
              Filtrar por data
            </Button>
          </div>
        </div>

        <div className="mt-6 max-h-[420px] overflow-y-auto pr-1">
          <div className="flex flex-col gap-4">
            {isLoadingTimeline && (
              <div className="text-sm text-gray-500">
                Carregando timeline...
              </div>
            )}

            {!isLoadingTimeline && timelineItems.length === 0 && (
              <div className="text-sm text-gray-500">
                Nenhuma atividade encontrada.
              </div>
            )}

            {!isLoadingTimeline &&
              timelineItems.map((item) => {
                const itemDate = (() => {
                  const cast = item.createdAt as { toDate?: () => Date }
                  if (typeof cast?.toDate === 'function') {
                    return cast.toDate()
                  }
                  if (item.createdAt instanceof Date) {
                    return item.createdAt
                  }
                  const parsed = new Date(String(item.createdAt))
                  return Number.isFinite(parsed.getTime()) ? parsed : null
                })()

                const typeColor = getTimelineTypeColor(item.type)
                const createdByLabel =
                  createdByLabelMap[item.createdBy] || 'Sistema'

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-500">
                        {itemDate ? format(itemDate, 'dd/MM/yyyy') : '--'}
                      </span>
                      <p className="text-base text-gray-900">{item.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{ borderColor: typeColor, color: typeColor }}
                      >
                        {item.type}
                      </span>
                      <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
                        {createdByLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      <DateRangeFilterModal
        isOpen={isDateModalOpen}
        setIsOpen={setIsDateModalOpen}
        currentRange={dateRange}
        onApply={setDateRange}
        onClear={() => setDateRange(null)}
      />
    </>
  )
}
