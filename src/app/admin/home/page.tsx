'use client'

import {
  endOfMonth,
  isWithinInterval,
  startOfMonth,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import {
  Calendar as CalendarIcon,
  Stethoscope,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { credentialTypes } from '@/constants/options'
import { timestampToDate } from '@/lib/utils'
import { getAllConsultations } from '@/services/consultation'
import { getAllUsers } from '@/services/user'
import { UserRole } from '@/types/entities/user'

type RangeOption = 'lastWeek' | 'lastMonth' | 'lastYear'
type ConsultationLite = {
  date?: Date | string | Timestamp
  status?: string
  doctorId?: string
}
type UserLite = {
  id?: string
  uid?: string
  createdAt?: Date | string | Timestamp
  role?: UserRole
  typeOfCredential?: string
}

function RangeDropdown({
  range,
  onSelect,
}: {
  range: RangeOption
  onSelect: (value: RangeOption) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const label =
    range === 'lastWeek'
      ? 'Última semana'
      : range === 'lastMonth'
        ? 'Último mês'
        : 'Último ano'

  const options: { value: RangeOption; label: string }[] = [
    { value: 'lastWeek', label: 'Última semana' },
    { value: 'lastMonth', label: 'Último mês' },
    { value: 'lastYear', label: 'Último ano' },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <CalendarIcon className="h-4 w-4" />
        {label}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                range === opt.value
                  ? 'bg-gray-100 text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminHomePage() {
  const [range, setRange] = useState<RangeOption>('lastMonth')
  const [consultations, setConsultations] = useState<ConsultationLite[]>([])
  const [users, setUsers] = useState<UserLite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [
          { consultations: fetchedConsultations },
          { users: fetchedUsers },
        ] = await Promise.all([getAllConsultations(), getAllUsers()])

        setConsultations(fetchedConsultations)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error('Erro ao carregar métricas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const { start, end } = useMemo(() => {
    const today = new Date()

    if (range === 'lastWeek') {
      return { start: subDays(today, 7), end: today }
    }

    if (range === 'lastYear') {
      const lastYear = subYears(today, 1)
      return {
        start: startOfMonth(lastYear),
        end: today,
      }
    }

    // default lastMonth
    const lastMonth = subMonths(today, 1)
    return {
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth),
    }
  }, [range])

  const metrics = useMemo(() => {
    const validStatuses = ['SCHEDULED', 'COMPLETED', 'IN_PROGRESS']

    const consultationsInRange = consultations.filter((c) => {
      const date = c.date as Date
      return (
        !!date &&
        validStatuses.includes(c.status || '') &&
        isWithinInterval(date, { start, end })
      )
    })

    const patients = users.filter((u) => u.role === UserRole.PATIENT)
    const professionals = users.filter(
      (u) => u.role && u.role !== UserRole.PATIENT && u.role !== UserRole.ADMIN,
    )
    const patientsInRange = patients.filter((u) => {
      const date = u.createdAt
        ? timestampToDate(u.createdAt as unknown as Timestamp)
        : null
      return !!date && isWithinInterval(date, { start, end })
    })

    const professionalsInRange = professionals.filter((u) => {
      const date = u.createdAt
        ? timestampToDate(u.createdAt as unknown as Timestamp)
        : null
      return !!date && isWithinInterval(date, { start, end })
    })

    return [
      {
        title: 'Total de Consultas',
        value: isLoading ? '...' : consultationsInRange.length.toString(),
        change:
          range === 'lastWeek'
            ? 'Última semana'
            : range === 'lastMonth'
              ? 'Último mês'
              : 'Último ano',
        icon: CalendarIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
      {
        title: 'Total de Pacientes',
        value: isLoading ? '...' : patientsInRange.length.toString(),
        change:
          range === 'lastWeek'
            ? 'Última semana'
            : range === 'lastMonth'
              ? 'Último mês'
              : 'Último ano',
        icon: UserIcon,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
      {
        title: 'Total de Profissionais',
        value: isLoading ? '...' : professionalsInRange.length.toString(),
        change:
          range === 'lastWeek'
            ? 'Última semana'
            : range === 'lastMonth'
              ? 'Último mês'
              : 'Último ano',
        icon: Stethoscope,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
    ]
  }, [consultations, end, isLoading, range, start, users])

  const consultationsByCredential = useMemo(() => {
    const doctorCredentialMap = new Map<string, string>()

    users.forEach((u) => {
      if (u.role && u.role !== UserRole.PATIENT) {
        const cred = u.typeOfCredential || 'Outros'
        const id = u.id || u.uid
        if (id) {
          doctorCredentialMap.set(String(id), cred)
        }
      }
    })

    const counts = consultations.reduce<Record<string, number>>((acc, c) => {
      if (!c.doctorId) return acc
      const cred = doctorCredentialMap.get(c.doctorId)
      if (cred) {
        acc[cred] = (acc[cred] || 0) + 1
      }
      return acc
    }, {})

    // Garantir que todas as credenciais definidas apareçam, mesmo com 0 consultas
    return credentialTypes.map(({ value }) => ({
      credential: value,
      total: counts[value] || 0,
    }))
  }, [consultations, users])

  const patientRegistrationsOverTime = useMemo(() => {
    const patients = users.filter((u) => u.role === UserRole.PATIENT)
    const grouped = patients.reduce<Record<string, number>>((acc, u) => {
      const date = u.createdAt
        ? timestampToDate(u.createdAt as unknown as Timestamp)
        : null
      if (!date) return acc
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {})

    const sortedKeys = Object.keys(grouped).sort()
    return sortedKeys.map((key) => {
      const [year, month] = key.split('-')
      return {
        label: `${month}/${year.slice(-2)}`,
        total: grouped[key],
      }
    })
  }, [users])
  return (
    <div className="flex min-h-screen w-full flex-col gap-8 bg-gray-50/50 px-16 pt-24">
      <div className="flex w-full flex-col gap-8 pb-24">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold text-brand-purple-dark">
            Dashboard
          </h1>
        </div>

        {/* Metrics Cards */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">
              Principais Métricas
            </h2>
            <RangeDropdown range={range} onSelect={setRange} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className="rounded-3xl border-gray-200 shadow-sm"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {metric.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${metric.iconBg}`}>
                    <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <p className="mt-1 flex items-center text-xs font-medium text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {metric.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Consultas por tipo de credencial
            </h2>
            <Card className="rounded-3xl border-gray-200 shadow-sm">
              <CardContent className="pl-0 pt-6">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={consultationsByCredential}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="credential"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar
                        dataKey="total"
                        name="Consultas"
                        fill="#7C3AED"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Cadastros de pacientes ao longo do tempo
            </h2>
            <Card className="rounded-3xl border-gray-200 shadow-sm">
              <CardContent className="pl-0 pt-6">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={patientRegistrationsOverTime}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend
                        iconType="rect"
                        verticalAlign="bottom"
                        align="center"
                      />
                      <Line
                        type="linear"
                        dataKey="total"
                        name="Cadastros"
                        stroke="#7C3AED"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#7C3AED' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
