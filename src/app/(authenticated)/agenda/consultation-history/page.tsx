'use client'

import { endOfDay, isWithinInterval, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Calendar as CalendarIcon, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DateRange } from 'react-day-picker'

import Input from '@/components/atoms/Input/input'
import LoadingComponent from '@/components/atoms/Loading/loading'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import useAllConsultations from '@/hooks/queries/useAllConsultations'
import usePatientsByDoctor from '@/hooks/queries/usePatientsByDoctor'
import useUser from '@/hooks/useUser'
import { AgendaConsultation } from '@/types/entities/agendaConsultation'

import { getConsultationHistoryColumns } from './columns'

export default function ConsultationHistoryPage() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [searchTerm, setSearchTerm] = useState('')

  const { currentUser } = useUser()
  const { data: consultations, isLoading: isLoadingConsultations } =
    useAllConsultations()
  const { data: patients, isLoading: isLoadingPatients } = usePatientsByDoctor()

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

  const completedConsultations: AgendaConsultation[] = useMemo(() => {
    if (!consultations || !currentUser?.id) {
      return []
    }

    const filtered = consultations.filter(
      (consultation) =>
        consultation.doctorId === currentUser.id &&
        consultation.status === 'COMPLETED',
    )

    function toDate(value: unknown): Date | null {
      if (!value) return null
      const v = value as { toDate?: () => Date }
      if (typeof v?.toDate === 'function') return v.toDate()
      if (value instanceof Date) return value
      const parsed = new Date(String(value))
      return Number.isFinite(parsed.getTime()) ? parsed : null
    }

    const transformed = filtered.map((consultation) => {
      const rawDate = toDate(consultation.date)
      const consultationDate = rawDate
        ? startOfDay(rawDate)
        : startOfDay(new Date())

      return {
        ...consultation,
        patientName:
          patientNameMap.get(consultation.patientId) || 'Paciente sem nome',
        startDateTime: consultationDate,
        endDateTime: consultationDate,
      }
    })

    let result = transformed

    if (dateRange?.from) {
      result = result.filter((consultation) => {
        const consultationDate = startOfDay(consultation.date)
        const from = startOfDay(dateRange.from!)
        const to = dateRange.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from!)

        return isWithinInterval(consultationDate, { start: from, end: to })
      })
    }

    if (searchTerm.trim()) {
      result = result.filter((consultation) =>
        consultation.patientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim()),
      )
    }

    return result.sort((a, b) => {
      const dateA = toDate(a.date)?.getTime() ?? 0
      const dateB = toDate(b.date)?.getTime() ?? 0
      return dateB - dateA
    })
  }, [consultations, currentUser?.id, patientNameMap, dateRange, searchTerm])

  const tableColumns = useMemo(() => getConsultationHistoryColumns(), [])

  const isLoading = isLoadingConsultations || isLoadingPatients

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/agenda')}
            className="mt-1 rounded-full p-2 transition-colors hover:bg-gray-100"
            title="Voltar para agenda"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-brand-purple-dark">
              Histórico de Consultas
            </h1>
            <p className="text-sm text-gray-600">
              Visualize o histórico completo de consultas realizadas, com acesso
              rápido aos detalhes de cada atendimento.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 py-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingComponent className="text-purple-600" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-end gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2 border-gray-300 bg-white p-4 text-[#530570] hover:bg-[#530570] hover:text-white"
                  >
                    <CalendarIcon className="h-4 w-4 text-[#530570]" />
                    Filtrar por data
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      locale={ptBR}
                    />
                    {dateRange?.from && (
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateRange(undefined)}
                        >
                          Limpar
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="w-80">
                <Input
                  placeholder="Pesquisar paciente"
                  icon={<Search className="h-4 w-4" />}
                  className="h-10 text-[#530570]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <DataTable columns={tableColumns} data={completedConsultations} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
