'use client'

import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import GroupIcon from '@mui/icons-material/Group'
import InfoIcon from '@mui/icons-material/Info'
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import { ColumnDef } from '@tanstack/react-table'
import { startOfMonth, isSameMonth } from 'date-fns'
import { useMemo } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import useConsultationsForDashboard from '@/hooks/queries/useConsultionsForDashboard'
import useAllPrescriptionsByDoctor from '@/hooks/queries/useAllPrescriptionsByDoctor'
import useClassifiedPatientsByDoctor from '@/hooks/queries/useClassifiedPatientsByDoctor'
import useComplementaryConsultations from '@/hooks/queries/useComplementaryConsultations'
import useConsultationsByDoctor from '@/hooks/queries/useConsultationsByDoctor'
import usePatientsByDoctor from '@/hooks/queries/usePatientsByDoctor'
import useUser from '@/hooks/useUser'
import { ConsultationEntity } from '@/types/entities/consultation'

const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

const FORMAT_CONFIG = {
  ONLINE: {
    className: 'border-purple-200 bg-purple-50 text-purple-700',
    label: 'Teleconsulta',
  },
  PRESENCIAL: {
    className: 'border-pink-200 bg-pink-50 text-pink-700',
    label: 'Presencial',
  },
  PRESENTIAL: {
    className: 'border-pink-200 bg-pink-50 text-pink-700',
    label: 'Presencial',
  },
  IN_PERSON: {
    className: 'border-pink-200 bg-pink-50 text-pink-700',
    label: 'Presencial',
  },
} as const

interface ConsultationWithPatientName extends ConsultationEntity {
  patientName: string
}

const getConsultationsColumns = (
  patients?: Array<{ id: string; profileImage?: string }>,
): ColumnDef<ConsultationWithPatientName>[] => [
  {
    accessorKey: 'hour',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Horário
          <UnfoldMoreIcon className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('hour')}</div>
    ),
  },
  {
    accessorKey: 'patientName',
    header: 'Nome do Paciente',
    cell: ({ row }) => {
      const name =
        (row.getValue('patientName') as string) || 'Paciente sem nome'
      const consultation = row.original
      const patient = patients?.find((p) => p.id === consultation.patientId)
      const nameParts = name.trim().split(' ').filter(Boolean)
      const initials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
          : nameParts[0]?.[0] || 'P'

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={patient?.profileImage} />
            <AvatarFallback className="bg-purple-100 text-purple-700">
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'format',
    header: 'Formato',
    cell: ({ row }) => {
      const format = (row.getValue('format') as string) || ''
      const formatKey =
        (format.toUpperCase() as keyof typeof FORMAT_CONFIG) || 'ONLINE'
      const formatInfo = FORMAT_CONFIG[formatKey] || FORMAT_CONFIG.ONLINE

      return (
        <Badge className={`${formatInfo.className} text-xs`}>
          {formatInfo.label}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: () => <div className="flex items-center gap-1">Ações</div>,
    cell: ({ row }) => {
      const consultation = row.original
      return (
        <div className="flex items-center justify-center">
          <Button
            variant="link"
            className="h-auto p-0 text-[#792EBD]"
            onClick={() => {
              // TODO: navegar para detalhes da consulta
            }}
          >
            Ver detalhes
          </Button>
        </div>
      )
    },
  },
]

export default function DashboardPage() {
  const { currentUser } = useUser()
  const today = new Date()

  const { data: allConsultations, isLoading: isLoadingConsultations } =
    useConsultationsForDashboard()
  const { data: classifiedPatients, isLoading: isLoadingPatients } =
    useClassifiedPatientsByDoctor()
  const { data: complementaryConsultations } = useComplementaryConsultations()
  const { data: patients } = usePatientsByDoctor()
  const { data: todayConsultations, isLoading: isLoadingToday } =
    useConsultationsByDoctor(today)
  const { data: allPrescriptions } = useAllPrescriptionsByDoctor()

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>()
    patients?.forEach((patient) => {
      if (patient?.id) {
        map.set(patient.id, patient.name || patient.email || patient.id)
      }
    })
    return map
  }, [patients])

  const activePatients = useMemo(() => {
    return classifiedPatients?.acompanhamento?.length || 0
  }, [classifiedPatients])

  const newPatients = useMemo(() => {
    if (!classifiedPatients?.acompanhamento) return 0
    const now = new Date()
    const monthStart = startOfMonth(now)

    return classifiedPatients.acompanhamento.filter((patient) => {
      const createdAt = patient.createdAt ? new Date(patient.createdAt) : null
      return createdAt && createdAt >= monthStart && isSameMonth(createdAt, now)
    }).length
  }, [classifiedPatients])

  const patientsAttendedThisMonth = useMemo(() => {
    if (!allConsultations || !currentUser?.id) return 0
    const now = new Date()
    const monthStart = startOfMonth(now)

    const completedThisMonth = allConsultations.filter((consultation) => {
      const consultationDate = new Date(consultation.date)
      return (
        consultation.doctorId === currentUser.id &&
        consultation.status === 'COMPLETED' &&
        consultationDate >= monthStart &&
        isSameMonth(consultationDate, now)
      )
    })

    const uniquePatientIds = new Set(completedThisMonth.map((c) => c.patientId))
    return uniquePatientIds.size
  }, [allConsultations, currentUser?.id])

  const financialData = useMemo(() => {
    if (!allConsultations || !currentUser?.id || !complementaryConsultations)
      return {
        monthlyRevenue: 0,
        recurring: 0,
        complementary: 0,
      }

    const now = new Date()
    const monthStart = startOfMonth(now)

    const thisMonthConsultations = allConsultations.filter((consultation) => {
      const consultationDate = new Date(consultation.date)
      return (
        consultation.doctorId === currentUser.id &&
        consultationDate >= monthStart &&
        isSameMonth(consultationDate, now)
      )
    })

    const complementaryConsultationIds = new Set(
      complementaryConsultations.map((cc) => cc.consultationId),
    )

    const acompanhamentoPatientIds = new Set(
      classifiedPatients?.acompanhamento?.map((p) => p.id) || [],
    )

    let monthlyRevenue = 0
    let recurring = 0
    let complementary = 0

    thisMonthConsultations.forEach((consultation) => {
      const value = Number(consultation.value) || 0
      monthlyRevenue += value

      if (complementaryConsultationIds.has(consultation.id)) {
        complementary += value
      } else if (acompanhamentoPatientIds.has(consultation.patientId)) {
        recurring += value
      }
    })

    return {
      monthlyRevenue,
      recurring,
      complementary,
    }
  }, [
    allConsultations,
    currentUser?.id,
    complementaryConsultations,
    classifiedPatients,
  ])

  const todayConsultationsWithNames = useMemo(() => {
    if (!todayConsultations) return []

    return todayConsultations
      .map((consultation) => ({
        ...consultation,
        patientName:
          patientNameMap.get(consultation.patientId) || 'Paciente sem nome',
      }))
      .sort((a, b) => {
        const timeA = a.hour.split('-')[0] || '00:00'
        const timeB = b.hour.split('-')[0] || '00:00'
        return timeA.localeCompare(timeB)
      })
  }, [todayConsultations, patientNameMap])

  const consultationsColumns = useMemo(
    () => getConsultationsColumns(patients),
    [patients],
  )

  const totalPatientsAttended = useMemo(() => {
    if (!allConsultations || !currentUser?.id) return 0
    const completed = allConsultations.filter(
      (c) => c.doctorId === currentUser.id && c.status === 'COMPLETED',
    )
    return new Set(completed.map((c) => c.patientId)).size
  }, [allConsultations, currentUser?.id])

  const totalPrescriptions = useMemo(() => {
    if (!allPrescriptions) return 0
    return allPrescriptions.length
  }, [allPrescriptions])

  const totalPrescribedExams = useMemo(() => {
    if (!allPrescriptions) return 0
    return allPrescriptions.reduce((total, prescription) => {
      return total + (prescription.exams?.length || 0)
    }, 0)
  }, [allPrescriptions])

  const isLoading =
    isLoadingConsultations ||
    isLoadingPatients ||
    isLoadingToday ||
    !currentUser

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <LoadingComponent />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 bg-[#FAFAFA] p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[#530570] md:text-4xl">
          Dashboard Profissional
        </h1>
        <p className="text-gray-600 md:text-lg">
          Visualize de forma centralizada suas atividades, pacientes e
          indicadores de desempenho para acompanhar e gerenciar seu trabalho com
          eficiência
        </p>
      </div>

      <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MedicalInformationIcon className="h-5 w-5 text-[#792EBD]" />
              Consultas do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todayConsultationsWithNames.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                Nenhuma consulta agendada para hoje
              </p>
            ) : (
              <div className="px-6 pb-6">
                <DataTable
                  columns={consultationsColumns}
                  data={todayConsultationsWithNames}
                />
              </div>
            )}
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <GroupIcon className="h-5 w-5 text-[#792EBD]" />
              Panorama de Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pacientes Ativos</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="mt-1 flex items-center gap-1 text-2xl font-bold text-[#792EBD] hover:opacity-80">
                          {activePatients}
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <p className="text-sm">
                          Pacientes que você coordena o tratamento
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Novos Pacientes</p>
                    <p className="mt-1 text-2xl font-bold text-[#792EBD]">
                      {newPatients}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pacientes Atendidos</p>
                    <p className="text-xs text-gray-500">No mês</p>
                    <p className="mt-1 text-2xl font-bold text-[#792EBD]">
                      {patientsAttendedThisMonth}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <AttachMoneyIcon className="h-5 w-5 text-[#792EBD]" />
              </div>
              Panorama Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-purple-50 p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="hover:opacity-80" title="Informação sobre receita mensal">
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <p className="text-sm">
                      A receita total é composta por entradas recorrentes e
                      entradas complementares
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="mt-1 text-3xl font-bold text-[#792EBD]">
                {formatCurrency(financialData.monthlyRevenue)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">Recorrente</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:opacity-80" title="Informação sobre entrada recorrente">
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <p className="text-sm">
                          Entradas provenientes de atendimentos em que você
                          coordena o tratamento e recebe porcentagem mensal pelo
                          aplicativo
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xl font-bold text-[#792EBD]">
                    {formatCurrency(financialData.recurring)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">Complementar</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:opacity-80" title="Informação sobre entrada complementar">
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <p className="text-sm">
                          Entradas provenientes de consultas complementares
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xl font-bold text-[#792EBD]">
                    {formatCurrency(financialData.complementary)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUpIcon className="h-5 w-5 text-[#792EBD]" />
              Suas Atividades
              <Popover>
                <PopoverTrigger asChild>
                  <button className="hover:opacity-80" title="Informação sobre suas atividades">
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <p className="text-sm">Desde o seu início na plataforma</p>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-gray-600">Total de Prescrições</p>
                <p className="text-3xl font-bold text-[#792EBD]">
                  {totalPrescriptions}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-gray-600">
                  Total de Exames Prescritos
                </p>
                <p className="text-3xl font-bold text-[#792EBD]">
                  {totalPrescribedExams}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-gray-600">
                  Total de Pacientes Atendidos
                </p>
                <p className="text-3xl font-bold text-[#792EBD]">
                  {totalPatientsAttended}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
