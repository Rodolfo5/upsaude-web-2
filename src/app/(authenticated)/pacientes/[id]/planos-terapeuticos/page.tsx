'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { FileText as ArticleOutlinedIcon } from 'lucide-react'
import { CalendarDays as CalendarMonthOutlinedIcon } from 'lucide-react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, use, useEffect } from 'react'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { DateRangeFilterModal } from '@/components/organisms/Modals/DateRangeFilterModal/dateRangeFilterModal'
import { useTherapeuticPlans } from '@/hooks/queries/useTherapeuticPlan'
import { findDoctorById } from '@/services/doctor'

import { makeTherapeuticPlansColumns, TherapeuticPlanRow } from './columns'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function TherapeuticPlansHistoryPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: plans = [] } = useTherapeuticPlans(id)

  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null,
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [plansWithDoctorNames, setPlansWithDoctorNames] = useState<
    TherapeuticPlanRow[]
  >([])

  // Buscar nomes dos médicos
  useEffect(() => {
    const fetchDoctorNames = async () => {
      if (!plans || plans.length === 0) {
        setPlansWithDoctorNames([])
        return
      }

      try {
        const plansWithNamesPromises = plans.map(async (plan) => {
          let doctorName = plan.createdBy || '-'

          if (plan.doctorId) {
            try {
              const doctor = await findDoctorById(plan.doctorId)
              if (doctor?.name) {
                doctorName = doctor.name
              }
            } catch (error) {
              console.error(`Erro ao buscar médico ${plan.doctorId}:`, error)
            }
          }

          return {
            ...plan,
            doctorName,
          } as TherapeuticPlanRow
        })

        const plansWithNames = await Promise.all(plansWithNamesPromises)
        setPlansWithDoctorNames(plansWithNames)
      } catch (error) {
        console.error('Erro ao buscar nomes dos médicos:', error)
        // Em caso de erro, usar os dados originais
        setPlansWithDoctorNames(
          plans.map((p) => ({
            ...p,
            doctorName: p.createdBy || '-',
          })) as TherapeuticPlanRow[],
        )
      }
    }

    fetchDoctorNames()
  }, [plans])

  const filteredPlans = useMemo(() => {
    return plansWithDoctorNames.filter((plan) => {
      const matchesDateRange = dateRange
        ? new Date(plan.createdAt) >= dateRange.from &&
          new Date(plan.createdAt) <= dateRange.to
        : true

      const matchesSearch = searchTerm
        ? plan.objective?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.createdBy?.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      return matchesDateRange && matchesSearch
    })
  }, [plansWithDoctorNames, dateRange, searchTerm])

  const columns = useMemo(
    () => makeTherapeuticPlansColumns(id, router),
    [id, router],
  )

  const handleViewCurrentPlan = () => {
    if (plans && plans.length > 0) {
      const latestPlan = plans[0] // Já está ordenado por data desc
      router.push(`/pacientes/${id}/plano-terapeutico/${latestPlan.id}`)
    }
  }

  return (
    <div className="mt-6 px-4 pb-8 sm:mt-8 sm:px-8 lg:px-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="flex min-w-0 p-0 text-left text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/pacientes/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Histórico de Planos Terapêuticos
        </Button>
        {plans && plans.length > 0 && (
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700"
            onClick={handleViewCurrentPlan}
            icon={<ArticleOutlinedIcon />}
          >
            Ver plano atual
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
      </div>

      <div className="mt-6 w-full">
        <DataTable
          tableTitle=""
          columns={columns}
          data={filteredPlans}
          // Removido: isLoading (não existe em DataTableProps)
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
