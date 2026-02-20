'use client'

import {
  endOfDay,
  isWithinInterval,
  startOfDay,
  subDays,
  subMonths,
  subYears,
  format,
} from 'date-fns'
import { Calendar as CalendarIcon, CreditCard } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getAllInstantPayments,
  getAllSubscriptions,
  InstantPaymentRecord,
  SubscriptionRecord,
} from '@/services/payments'
import { getAllUsers } from '@/services/user'
import { DoctorEntity } from '@/types/entities/user'

type RangeOption = 'lastWeek' | 'lastMonth' | 'lastYear'

type PaymentRow = {
  id: string
  patientName: string
  professionalName: string
  professionalSpecialty: string
  paymentType: 'Assinatura' | 'Avulso'
  valueInCents: number
  paidAt: Date
}

const formatCurrency = (valueInCents: number): string => {
  const value = valueInCents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
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

export default function AdminPaymentsPage() {
  const [range, setRange] = useState<RangeOption>('lastMonth')
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [instantPayments, setInstantPayments] = useState<
    InstantPaymentRecord[]
  >([])
  const [users, setUsers] = useState<DoctorEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [
          { subscriptions: fetchedSubscriptions },
          { instantPayments: fetchedInstantPayments },
          { users: fetchedUsers },
        ] = await Promise.all([
          getAllSubscriptions(),
          getAllInstantPayments(),
          getAllUsers(),
        ])

        setSubscriptions(fetchedSubscriptions)
        setInstantPayments(fetchedInstantPayments)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error('Erro ao carregar pagamentos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const { start, end } = useMemo(() => {
    const today = new Date()

    if (range === 'lastWeek') {
      return { start: startOfDay(subDays(today, 7)), end: endOfDay(today) }
    }

    if (range === 'lastYear') {
      const lastYear = subYears(today, 1)
      return {
        start: startOfDay(lastYear),
        end: endOfDay(today),
      }
    }

    const lastMonth = subMonths(today, 1)
    return {
      start: startOfDay(lastMonth),
      end: endOfDay(today),
    }
  }, [range])

  const userMap = useMemo(() => {
    const map = new Map<string, DoctorEntity>()
    users.forEach((user) => {
      if (user?.id) {
        map.set(user.id, user)
      }
    })
    return map
  }, [users])

  const subscriptionRevenue = useMemo(() => {
    return subscriptions
      .filter((subscription) => subscription.status === 'active')
      .filter((subscription) => {
        const referenceDate = subscription.createdAt || subscription.startDate
        if (!referenceDate) return false
        return isWithinInterval(referenceDate, { start, end })
      })
      .reduce((total, subscription) => {
        return total + (subscription.monthlyAmountInCents || 0)
      }, 0)
  }, [subscriptions, start, end])

  const instantPaymentsRevenue = useMemo(() => {
    return instantPayments
      .filter((payment) => payment.paymentStatus === 'PAID')
      .filter((payment) => {
        const paidAt = payment.paidAt || payment.createdAt
        if (!paidAt) return false
        return isWithinInterval(paidAt, { start, end })
      })
      .reduce((total, payment) => {
        return total + (payment.valueInCents || 0)
      }, 0)
  }, [instantPayments, start, end])

  const paymentRows = useMemo(() => {
    const getUserLabel = (userId?: string): string => {
      if (!userId) return '-'
      const user = userMap.get(userId)
      return user?.name || user?.email || '-'
    }

    const getUserSpecialty = (userId?: string): string => {
      if (!userId) return '-'
      const user = userMap.get(userId)
      return user?.specialty || '-'
    }

    const rows: PaymentRow[] = []

    subscriptions
      .filter((subscription) => subscription.status === 'active')
      .forEach((subscription) => {
        const paidAt = subscription.createdAt || subscription.startDate
        if (!paidAt) return
        if (!isWithinInterval(paidAt, { start, end })) return
        rows.push({
          id: `subscription-${subscription.id}`,
          paymentType: 'Assinatura',
          patientName: getUserLabel(subscription.userId),
          professionalName: '-',
          professionalSpecialty: '-',
          valueInCents: subscription.monthlyAmountInCents || 0,
          paidAt,
        })
      })

    instantPayments
      .filter((payment) => payment.paymentStatus === 'PAID')
      .forEach((payment) => {
        const paidAt = payment.paidAt || payment.createdAt
        if (!paidAt) return
        if (!isWithinInterval(paidAt, { start, end })) return

        rows.push({
          id: `instant-${payment.id}`,
          paymentType: 'Avulso',
          patientName: getUserLabel(payment.userId),
          professionalName: getUserLabel(payment.doctorId),
          professionalSpecialty: getUserSpecialty(payment.doctorId),
          valueInCents: payment.valueInCents || 0,
          paidAt,
        })
      })

    return rows.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())
  }, [subscriptions, instantPayments, start, end, userMap])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <LoadingComponent />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 bg-gray-50/50 px-16 pt-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[#530570] md:text-4xl">
            Pagamentos
          </h1>
          <p className="text-gray-600 md:text-lg">
            Acompanhe os pagamentos de assinatura e consultas complementares
          </p>
        </div>
        <RangeDropdown range={range} onSelect={setRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <CreditCard className="h-5 w-5 text-[#792EBD]" />
              </div>
              Faturamento em assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Período selecionado</p>
            <p className="mt-2 text-3xl font-bold text-[#792EBD]">
              {formatCurrency(subscriptionRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <CreditCard className="h-5 w-5 text-[#792EBD]" />
              </div>
              Faturamento em Consultas Complementares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Período selecionado</p>
            <p className="mt-2 text-3xl font-bold text-[#792EBD]">
              {formatCurrency(instantPaymentsRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={[
          {
            accessorKey: 'patientName',
            header: 'Paciente',
          },
          {
            accessorKey: 'paymentType',
            header: 'Tipo do pagamento',
          },
          {
            accessorKey: 'professionalName',
            header: 'Profissional',
            cell: ({ row }) =>
              row.original.paymentType === 'Assinatura'
                ? '-'
                : (row.getValue('professionalName') as string),
          },
          {
            accessorKey: 'professionalSpecialty',
            header: 'Especialidade',
            cell: ({ row }) =>
              row.original.paymentType === 'Assinatura'
                ? '-'
                : (row.getValue('professionalSpecialty') as string),
          },
          {
            accessorKey: 'valueInCents',
            header: 'Valor do pagamento',
            cell: ({ row }) =>
              formatCurrency(row.getValue('valueInCents') as number),
          },
          {
            accessorKey: 'paidAt',
            header: 'Data do pagamento',
            cell: ({ row }) =>
              format(row.getValue('paidAt') as Date, 'dd/MM/yyyy'),
          },
        ]}
        data={paymentRows}
        tableTitle="Pagamentos realizados"
        tableDescription="Assinaturas ativas e consultas complementares pagas."
        pageSize={10}
      />
    </div>
  )
}
