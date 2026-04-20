'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { CalendarDays as CalendarMonthOutlinedIcon } from 'lucide-react'
import { Pencil as CreateOutlinedIcon } from 'lucide-react'
import { ListFilter as FilterListOutlinedIcon } from 'lucide-react'
import { FlaskConical as ScienceOutlinedIcon } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, use, useState } from 'react'
import { toast } from 'react-toastify'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import Select from '@/components/atoms/Select/select'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { DateRangeFilterModal } from '@/components/organisms/Modals/DateRangeFilterModal/dateRangeFilterModal'
import { PrescriptionModal } from '@/components/organisms/Modals/PrescriptionModal/prescriptionModal'
import { Card } from '@/components/ui/card'
import { useExams } from '@/hooks/queries/useExams'
import { findDoctorById } from '@/services/doctor'
import { ExamEntity } from '@/types/entities/exam'
import { DoctorEntity } from '@/types/entities/user'

import { makeExamColumns, getDoctorName } from './columns'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ExamsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: exams = [], isLoading } = useExams(id)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const doctorIds = useMemo(() => {
    return [...new Set(exams.map((e) => e.doctorId).filter(Boolean))]
  }, [exams])

  const doctorQueries = useQueries({
    queries: doctorIds.map((doctorId) => ({
      queryKey: ['doctor', doctorId],
      queryFn: () => findDoctorById(doctorId),
      enabled: !!doctorId,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const doctorMap = useMemo(() => {
    const map = new Map<string, DoctorEntity>()
    doctorQueries.forEach((query, index) => {
      const doctor = query.data
      const doctorId = doctorIds[index]
      if (doctor && doctorId) {
        map.set(doctorId, doctor)
      }
    })
    return map
  }, [doctorQueries, doctorIds])

  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesDateRange = dateRange
        ? new Date(exam.requestDate) >= dateRange.from &&
          new Date(exam.requestDate) <= dateRange.to
        : true

      const matchesStatus = statusFilter ? exam.status === statusFilter : true

      const matchesSearch = searchTerm
        ? exam.id.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      return matchesDateRange && matchesStatus && matchesSearch
    })
  }, [exams, dateRange, statusFilter, searchTerm])

  const getExamTitle = (exam: ExamEntity) => {
    if (exam.examName) return exam.examName
    if (exam.type === 'prescription') return 'Prescrição Médica'
    return 'Exame'
  }

  const latestFour = useMemo(() => {
    if (!Array.isArray(exams)) return []
    // Mostrar os últimos 4 exames, priorizando os mais recentes
    return exams.slice(0, 4)
  }, [exams])

  const columns = useMemo(
    () => makeExamColumns(id, router, doctorMap),
    [id, router, doctorMap],
  )

  return (
    <div className="mt-8 px-4 sm:px-8 lg:px-20">
      <div className="flex items-center justify-between">
        <Button
          className="flex p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/pacientes/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Exames
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsPrescriptionModalOpen(true)}
          size="sm"
          icon={<CreateOutlinedIcon />}
          className="w-full sm:w-auto"
        >
          Prescrever com Memed
        </Button>
      </div>

      <h2 className="mb-4 mt-6 text-xl font-semibold text-brand-purple-600">
        Últimos exames
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-36 w-64 bg-primary-50 p-4" />
          ))
        ) : latestFour.length > 0 ? (
          latestFour.map((exam) => (
            <Card
              key={exam.id}
              className="w-full rounded-[28px] border-none bg-primary-50 p-6 shadow-none"
            >
              <div className="mb-2 flex items-center gap-2">
                <ScienceOutlinedIcon className="text-primary-600" />
                <span className="text-xs font-medium text-primary-600">
                  {exam.status === 'completed' ? 'Realizado' : 'Solicitado'}
                </span>
              </div>
              <div className="mb-2 text-lg font-semibold text-gray-800">
                {getExamTitle(exam)}
              </div>
              <div className="text-sm text-gray-600">
                Solicitado em{' '}
                {format(new Date(exam.requestDate), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Por: {getDoctorName(exam, doctorMap)}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="link"
                  className="text-purple-600 hover:text-purple-800"
                  onClick={() => {
                    router.push(`/pacientes/${id}/exames/${exam.id}`)
                  }}
                >
                  Ver detalhes
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-4 text-center text-gray-500">
            Nenhum exame encontrado
          </div>
        )}
      </div>

      <div className="w-full">
        <DataTable
          tableTitle="Todos"
          columns={columns}
          data={filteredExams as ExamEntity[]}
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
                  { label: 'Solicitado', value: 'requested' },
                  { label: 'Realizado', value: 'completed' },
                ]}
                value={statusFilter || ''}
                onChange={(value) =>
                  setStatusFilter(value ? String(value) : null)
                }
                placeholder="Status"
                className="relative h-9 w-40 rounded-md border border-gray-200 bg-white text-primary-700 hover:bg-transparent"
              />
              <Input
                icon={<Search className="h-5 w-5 text-primary-500" />}
                iconPosition="left"
                placeholder="Pesquisar exame"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 border border-gray-200 text-primary-500 hover:bg-white"
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
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        setIsOpen={setIsPrescriptionModalOpen}
        doctorId={doctorId ?? ''}
        patientId={id ?? ''}
        onSuccess={() => {
          setIsPrescriptionModalOpen(false)
          setDoctorId(null)
          router.refresh()
          toast.success('Prescrição criada com sucesso')
        }}
      />
    </div>
  )
}
