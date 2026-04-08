'use client'

import { startOfDay } from 'date-fns'
import { Clock, Timer, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getAverageConsultationDuration,
  getAverageOnlineWaitingTime,
  getAllConsultations,
  subscribeToDoctorConsultationsByDate,
} from '@/services/consultation'
import { getAllUsers } from '@/services/user'
import type { ConsultationEntity } from '@/types/entities/consultation'
import type { DoctorEntity } from '@/types/entities/user'
import { getSpecialtyLabel } from '@/utils/specialtyHelpers'

type SpecialtyRow = {
  specialtyValue: string
  specialtyLabel: string
  count: number
}
type DoctorRow = { doctorId: string; doctorName: string; count: number }
type QueueRow = {
  consultation: ConsultationEntity
  patientName: string
  situation: 'Próximo' | 'Agendado' | 'Em progresso' | 'Concluída'
}

/** Horário agendado no dia de hoje (local), para cálculo do tempo de espera. */
function getScheduledAtToday(hour: string): Date {
  const scheduled = new Date(startOfDay(new Date()))
  const [h = 0, m = 0] = (hour || '0:0').split(':').map(Number)
  scheduled.setHours(h, m, 0, 0)
  return scheduled
}

function formatWaitingTime(waitingMs: number): string {
  if (waitingMs < 0) return '0 min'
  const mins = Math.floor(waitingMs / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m} min` : `${h}h`
}

export default function QueuePage() {
  const [averageDurationMinutes, setAverageDurationMinutes] = useState<
    number | null
  >(null)
  const [averageOnlineWaitingMinutes, setAverageOnlineWaitingMinutes] =
    useState<number | null>(null)
  const [consultations, setConsultations] = useState<ConsultationEntity[]>([])
  const [users, setUsers] = useState<DoctorEntity[]>([])
  const [selectedSpecialtyValue, setSelectedSpecialtyValue] = useState<
    string | null
  >(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [selectedDoctorName, setSelectedDoctorName] = useState<string | null>(
    null,
  )
  const [doctorQueueConsultations, setDoctorQueueConsultations] = useState<
    ConsultationEntity[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const load = async () => {
      try {
        const [
          result,
          waitingResult,
          { consultations: fetchedConsultations },
          { users: fetchedUsers },
        ] = await Promise.all([
          getAverageConsultationDuration(),
          getAverageOnlineWaitingTime(),
          getAllConsultations(),
          getAllUsers(),
        ])
        setAverageDurationMinutes(result.averageMinutes)
        setAverageOnlineWaitingMinutes(waitingResult.averageWaitingMinutes)
        setConsultations(fetchedConsultations)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!selectedDoctorId) {
      setDoctorQueueConsultations([])
      return
    }
    const today = startOfDay(new Date())
    const unsubscribe = subscribeToDoctorConsultationsByDate(
      selectedDoctorId,
      today,
      setDoctorQueueConsultations,
    )
    return () => unsubscribe()
  }, [selectedDoctorId])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const valueLabel =
    averageDurationMinutes == null
      ? '—'
      : averageDurationMinutes < 1
        ? `${Math.round(averageDurationMinutes * 60)} min`
        : `${Math.round(averageDurationMinutes)} min`

  const waitingLabel =
    averageOnlineWaitingMinutes == null
      ? '—'
      : averageOnlineWaitingMinutes < 1
        ? `${Math.round(averageOnlineWaitingMinutes * 60)} min`
        : `${Math.round(averageOnlineWaitingMinutes)} min`

  const todayConsultations = useMemo(() => {
    const today = startOfDay(new Date())
    const todayTime = today.getTime()
    return consultations.filter((c) => {
      const d = c.date instanceof Date ? c.date : new Date(c.date)
      return startOfDay(d).getTime() === todayTime
    })
  }, [consultations])

  const doctorToSpecialty = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach((u) => {
      const id = u.id ?? u.uid
      if (id && u.specialty) {
        map.set(id, u.specialty)
      }
    })
    return map
  }, [users])

  const todaySpecialties = useMemo((): SpecialtyRow[] => {
    const countByValue = new Map<string, number>()
    todayConsultations.forEach((c) => {
      const value = doctorToSpecialty.get(c.doctorId) || 'outra'
      countByValue.set(value, (countByValue.get(value) || 0) + 1)
    })

    return Array.from(countByValue.entries())
      .map(([value, count]) => ({
        specialtyValue: value,
        specialtyLabel: getSpecialtyLabel(value),
        count,
      }))
      .sort((a, b) => a.specialtyLabel.localeCompare(b.specialtyLabel))
  }, [todayConsultations, doctorToSpecialty])

  const doctorsForSelectedSpecialty = useMemo((): DoctorRow[] => {
    if (!selectedSpecialtyValue) return []

    const doctorIdsInSpecialty = new Set(
      users
        .filter((u) => u.specialty === selectedSpecialtyValue)
        .map((u) => u.id ?? u.uid)
        .filter(Boolean),
    )

    const countByDoctor = new Map<string, number>()
    todayConsultations.forEach((c) => {
      if (doctorIdsInSpecialty.has(c.doctorId)) {
        countByDoctor.set(c.doctorId, (countByDoctor.get(c.doctorId) || 0) + 1)
      }
    })

    const idToName = new Map<string, string>()
    users.forEach((u) => {
      const id = u.id ?? u.uid
      if (id) idToName.set(id, u.name || '—')
    })

    return Array.from(countByDoctor.entries())
      .map(([doctorId, count]) => ({
        doctorId,
        doctorName: idToName.get(doctorId) || '—',
        count,
      }))
      .sort((a, b) => a.doctorName.localeCompare(b.doctorName))
  }, [selectedSpecialtyValue, todayConsultations, users])

  const patientIdToName = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach((u) => {
      const id = u.id ?? u.uid
      if (id) map.set(id, u.name || '—')
    })
    return map
  }, [users])

  const doctorQueueRows = useMemo((): QueueRow[] => {
    const sorted = [...doctorQueueConsultations].sort((a, b) => {
      const ha = a.hour || '00:00'
      const hb = b.hour || '00:00'
      return ha.localeCompare(hb)
    })
    const firstScheduledIndex = sorted.findIndex(
      (c) => c.status === 'SCHEDULED',
    )
    return sorted.map((c, index) => {
      let situation: QueueRow['situation'] = 'Agendado'
      if (c.status === 'COMPLETED') situation = 'Concluída'
      else if (c.status === 'IN_PROGRESS') situation = 'Em progresso'
      else if (c.status === 'SCHEDULED')
        situation = index === firstScheduledIndex ? 'Próximo' : 'Agendado'
      return {
        consultation: c,
        patientName: patientIdToName.get(c.patientId) || '—',
        situation,
      }
    })
  }, [doctorQueueConsultations, patientIdToName])

  const formatLabel = (format: string) => {
    const f = (format || '').toUpperCase()
    if (f === 'ONLINE') return 'Online'
    if (f === 'PRESENTIAL' || f === 'PRESENCIAL' || f === 'IN_PERSON')
      return 'Presencial'
    return format || '—'
  }

  const hasTodaySpecialties = todaySpecialties.length > 0

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 bg-gray-50/50 px-16 pt-24">
      <div className="flex w-full flex-col gap-8 pb-24">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold text-brand-purple-dark">
            Fila de Espera
          </h1>
        </div>

        {/* Cards de métricas */}
        <div className="grid max-w-2xl gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card className="rounded-3xl border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Tempo Médio de Consulta
              </CardTitle>
              <div className="rounded-lg bg-purple-100 p-2">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : valueLabel}
              </div>
              <p className="mt-1 flex items-center text-xs font-medium text-green-600">
                <TrendingUp className="mr-1 h-3 w-3" />
                Consultas concluídas
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Tempo Médio de Espera (online)
              </CardTitle>
              <div className="rounded-lg bg-purple-100 p-2">
                <Timer className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : waitingLabel}
              </div>
              <p className="mt-1 flex items-center text-xs font-medium text-green-600">
                <TrendingUp className="mr-1 h-3 w-3" />
                Consultas online concluídas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Breadcrumb + Tabela de especialidades / médicos */}
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList className="text-gray-700">
              <BreadcrumbItem>
                {selectedSpecialtyValue ? (
                  <BreadcrumbLink
                    asChild
                    className="cursor-pointer font-medium hover:text-purple-800"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpecialtyValue(null)
                        setSelectedDoctorId(null)
                        setSelectedDoctorName(null)
                      }}
                    >
                      Especialidades
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-medium text-gray-900">
                    Especialidades
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {selectedSpecialtyValue && (
                <>
                  <BreadcrumbSeparator className="text-gray-500" />
                  <BreadcrumbItem>
                    {selectedDoctorId ? (
                      <BreadcrumbLink
                        asChild
                        className="cursor-pointer font-medium hover:text-purple-800"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoctorId(null)
                            setSelectedDoctorName(null)
                          }}
                        >
                          {getSpecialtyLabel(selectedSpecialtyValue)}
                        </button>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="font-medium text-gray-900">
                        {getSpecialtyLabel(selectedSpecialtyValue)}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {selectedDoctorId && selectedDoctorName && (
                <>
                  <BreadcrumbSeparator className="text-gray-500" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-gray-900">
                      {selectedDoctorName}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <Card className="overflow-hidden rounded-3xl border-gray-200 shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : !selectedSpecialtyValue ? (
              !hasTodaySpecialties ? (
                <div className="p-8 text-center text-gray-500">
                  Não há consultas agendadas para o dia atual.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-700">
                        Especialidade
                      </TableHead>
                      <TableHead className="text-right font-bold text-gray-700">
                        Nº de consultas
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySpecialties.map((row) => (
                      <TableRow
                        key={row.specialtyValue}
                        className="cursor-pointer border-gray-100 last:border-0 hover:bg-purple-50/80"
                        onClick={() =>
                          setSelectedSpecialtyValue(row.specialtyValue)
                        }
                      >
                        <TableCell className="font-medium text-gray-900">
                          {row.specialtyLabel}
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-700">
                          {row.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : doctorsForSelectedSpecialty.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum médico com consultas hoje nesta especialidade.
              </div>
            ) : selectedDoctorId ? (
              doctorQueueRows.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma consulta na fila para este médico.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-700">
                        Nome do paciente
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Hora
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Formato
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Situação
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        Tempo de espera
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorQueueRows.map((row) => (
                      <TableRow
                        key={row.consultation.id}
                        className="border-gray-100 last:border-0 hover:bg-gray-50/50"
                      >
                        <TableCell className="font-medium text-gray-900">
                          {row.patientName}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {row.consultation.hour || '—'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {formatLabel(row.consultation.format)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.situation === 'Concluída'
                                ? 'bg-green-100 text-green-800'
                                : row.situation === 'Em progresso'
                                  ? 'bg-blue-100 text-blue-800'
                                  : row.situation === 'Próximo'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {row.situation}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {row.situation === 'Próximo'
                            ? formatWaitingTime(
                                now.getTime() -
                                  getScheduledAtToday(
                                    row.consultation.hour || '',
                                  ).getTime(),
                              )
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-700">
                      Médico
                    </TableHead>
                    <TableHead className="text-right font-bold text-gray-700">
                      Nº de consultas
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorsForSelectedSpecialty.map((row) => (
                    <TableRow
                      key={row.doctorId}
                      className="cursor-pointer border-gray-100 last:border-0 hover:bg-purple-50/80"
                      onClick={() => {
                        setSelectedDoctorId(row.doctorId)
                        setSelectedDoctorName(row.doctorName)
                      }}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {row.doctorName}
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-700">
                        {row.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
