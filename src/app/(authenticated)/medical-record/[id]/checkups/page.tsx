'use client'

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, use, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import Select from '@/components/atoms/Select/select'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { DateRangeFilterModal } from '@/components/organisms/Modals/DateRangeFilterModal/dateRangeFilterModal'
import { Card } from '@/components/ui/card'
import { useHealthCheckups } from '@/hooks/queries/useHealthCheckups'
import { HealthCheckupEntity } from '@/types/entities/healthCheckup'

import { makeCheckupColumns, getRequesterName, CheckupRow } from './columns'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function CheckupsHistoryPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: checkups = [], isLoading } = useHealthCheckups(id)

  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCheckups = useMemo(() => {
    return checkups.filter((checkup) => {
      const matchesDateRange = dateRange
        ? new Date(checkup.createdAt) >= dateRange.from &&
          new Date(checkup.createdAt) <= dateRange.to
        : true

      const matchesStatus = statusFilter
        ? checkup.status === statusFilter
        : true

      const matchesSearch = searchTerm
        ? getRequesterName(checkup as CheckupRow)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true

      return matchesDateRange && matchesStatus && matchesSearch
    })
  }, [checkups, dateRange, statusFilter, searchTerm])

  const latestFour = useMemo(() => {
    if (!Array.isArray(checkups)) return []
    const completedCheckups = checkups.filter((c) => c.status === 'COMPLETED')
    return completedCheckups.slice(0, 4)
  }, [checkups])

  const columns = useMemo(() => makeCheckupColumns(id, router), [id, router])

  return (
    <div className="mt-6 px-4 pb-8 sm:mt-8 sm:px-8 lg:px-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="flex min-w-0 p-0 text-left text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/medical-record/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Histórico de Check-Up
        </Button>
      </div>

      <h2 className="mb-4 mt-6 text-xl font-semibold text-brand-purple-600">
        Últimos realizados
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-36 w-64 bg-primary-50 p-4" />
            ))
          : latestFour.map((c) => (
              <Card
                key={c.id}
                className="w-full rounded-[28px] border-none bg-primary-50 p-6 shadow-none"
              >
                <div className="text-sm font-normal text-gray-500">
                  Realizado em
                </div>
                <div className="flex items-center gap-2 text-2xl text-gray-500">
                  {c.completedAt
                    ? format(new Date(c.completedAt), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })
                    : '-'}
                  <CalendarTodayOutlinedIcon />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Solicitado em{' '}
                  {format(new Date(c.createdAt), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}{' '}
                  por {getRequesterName(c as CheckupRow)}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="link"
                    onClick={() =>
                      router.push(`/medical-record/${id}/checkups/${c.id}`)
                    }
                  >
                    Ver resultado
                  </Button>
                </div>
              </Card>
            ))}
      </div>

      <div className="w-full">
        <DataTable
          tableTitle="Todos"
          columns={columns}
          data={filteredCheckups as HealthCheckupEntity[]}
          mainAction={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="rounded-md border-gray-200 font-normal hover:bg-transparent hover:text-primary-600"
                size={'sm'}
                variant="outline"
                onClick={() => setIsDateModalOpen(true)}
              >
                <CalendarMonthOutlinedIcon fontSize="small" />
                Filtrar por data
              </Button>
              <Input
                icon={<Search className="h-5 w-5 text-primary-500" />}
                iconPosition="left"
                placeholder="Pesquisar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 border border-gray-200 text-primary-500 hover:bg-white"
              />

              <Select
                iconPosition="left"
                icon={
                  <FilterListOutlinedIcon
                    fontSize="small"
                    className="text-primary-600"
                  />
                }
                options={[
                  { label: 'Todos', value: '' },
                  { label: 'Solicitado', value: 'REQUESTED' },
                  { label: 'Realizado', value: 'COMPLETED' },
                ]}
                value={statusFilter || ''}
                onChange={(value) =>
                  setStatusFilter(value ? String(value) : null)
                }
                placeholder="Filtrar status"
                className="relative h-9 w-40 rounded-md border border-gray-200 bg-white text-primary-700 hover:bg-transparent"
              />
            </div>
          }
        />
      </div>

      <DateRangeFilterModal
        isOpen={isDateModalOpen}
        setIsOpen={setIsDateModalOpen}
        currentRange={dateRange}
        onApply={setDateRange}
        onClear={() => setDateRange(null)}
      />
    </div>
  )
}
