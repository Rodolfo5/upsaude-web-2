'use client'

import { DollarSign as AttachMoneyIcon } from 'lucide-react'
import { Users as GroupIcon } from 'lucide-react'
import { Info as InfoIcon } from 'lucide-react'
import { ClipboardList as MedicalInformationIcon } from 'lucide-react'
import { TrendingUp as TrendingUpIcon } from 'lucide-react'
import { ChevronsUpDown as UnfoldMoreIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

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
import { Skeleton } from '@/components/ui/skeleton'
import useDashboardData from '@/hooks/queries/useDashboardData'
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

function DashboardSkeleton() {
  return (
    <div className="container mx-auto space-y-6 bg-[#FAFAFA] p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Card className="border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-purple-50 p-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-purple-50 p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-8 w-24" />
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-6 w-20" />
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-purple-50 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { currentUser } = useUser()

  const { data: dashboardData, isLoading } = useDashboardData()

  const consultationsColumns = useMemo(
    () => getConsultationsColumns(dashboardData?.patients),
    [dashboardData?.patients],
  )

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <p className="text-gray-500">Usuário não encontrado</p>
      </div>
    )
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
      </div>
    )
  }

  const {
    todayConsultations,
    activePatients,
    newPatients,
    patientsAttendedThisMonth,
    financialData,
    totalPatientsAttended,
    totalPrescriptions,
    totalPrescribedExams,
  } = dashboardData

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
            {todayConsultations.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                Nenhuma consulta agendada para hoje
              </p>
            ) : (
              <div className="px-6 pb-6">
                <DataTable
                  columns={consultationsColumns}
                  data={todayConsultations}
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
