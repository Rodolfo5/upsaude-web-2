'use client'

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import Select from '@/components/atoms/Select/select'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { DateRangeFilterModal } from '@/components/organisms/Modals/DateRangeFilterModal/dateRangeFilterModal'
import { Card } from '@/components/ui/card'
import { useQuestionnaires } from '@/hooks/queries/useQuestionnaires'
import { useRequestQuestionnaires } from '@/hooks/queries/useRequestQuestionnaires'
import { timestampToDate } from '@/lib/utils'
import { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

import { makeQuestionnairesColumns, QuestionnaireRow } from './columns'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function QuestionnairesHistoryPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const { data: requests = [], isLoading: loadingReq } =
    useRequestQuestionnaires(id)

  const { data: questionnaires = [], isLoading: loadingQ } =
    useQuestionnaires(id)

  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const rows = useMemo(() => {
    const qMap = new Map<string, QuestionnaireEntity>()

    questionnaires.forEach((q) => {
      if (q.requestQuestionnaireId)
        qMap.set(String(q.requestQuestionnaireId), q)
    })

    const filtered = requests.map((req) => {
      const questionnaire = qMap.get(req.id)
      const status = questionnaire ? 'COMPLETED' : 'REQUESTED'

      return {
        requestId: req.id,
        questionnaire,
        questionnaireName:
          questionnaire?.questionnaireName || req.questionnaireName,
        requestCreatedAt: timestampToDate(req.createdAt),
        questionnaireCreatedAt: questionnaire?.createdAt
          ? questionnaire.createdAt instanceof Date
            ? questionnaire.createdAt
            : timestampToDate(questionnaire.createdAt)
          : null,
        status,
        id: req.id,
      }
    })

    return filtered.filter((row) => {
      const matchesDate =
        !dateRange ||
        (row.requestCreatedAt &&
          new Date(row.requestCreatedAt) >= dateRange.from &&
          new Date(row.requestCreatedAt) <= dateRange.to)

      const matchesStatus = !statusFilter || row.status === statusFilter

      const matchesSearch = row.questionnaireName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())

      return matchesDate && matchesStatus && matchesSearch
    })
  }, [requests, questionnaires, dateRange, statusFilter, searchTerm])

  const latestFour = useMemo(() => {
    if (!questionnaires.length) return []

    const reqMap = new Map(
      requests.map((r: { id: string; createdAt: unknown }) => [r.id, r]),
    )

    return questionnaires
      .sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date
            ? a.createdAt
            : timestampToDate(a.createdAt)
        const dateB =
          b.createdAt instanceof Date
            ? b.createdAt
            : timestampToDate(b.createdAt)
        if (!dateA || !dateB) return 0
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 4)
      .map((q) => ({
        id: q.id,
        questionnaireName: q.questionnaireName,
        createdAt:
          q.createdAt instanceof Date
            ? q.createdAt
            : timestampToDate(q.createdAt),
        requestCreatedAt: timestampToDate(
          reqMap.get(q.requestQuestionnaireId)?.createdAt as Timestamp,
        ),
        questionnaire: q,
      }))
  }, [questionnaires, requests])

  const columns = useMemo(
    () => makeQuestionnairesColumns(id, router),
    [id, router],
  )

  const isLoading = loadingReq || loadingQ

  return (
    <div className="mt-8 p-4 px-4 sm:px-8 lg:px-20">
      <div className="flex items-center justify-between">
        <Button
          className="flex p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant="ghost"
          onClick={() => router.push(`/pacientes/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Questionários solicitados
        </Button>
      </div>

      <h2 className="mb-4 mt-6 text-xl font-semibold text-brand-purple-600">
        Últimos solicitados
      </h2>

      <div
        className={`mb-8 grid grid-cols-1 gap-4 ${
          latestFour.length === 1
            ? 'sm:grid-cols-1'
            : latestFour.length === 2
              ? 'sm:grid-cols-2'
              : latestFour.length === 3
                ? 'sm:grid-cols-2 lg:grid-cols-3'
                : 'sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-primary-50 p-4" />
            ))
          : latestFour.map((c) => (
              <Card
                key={c.id}
                className="flex w-full flex-col rounded-[28px] border-none bg-primary-50 p-4 shadow-none"
              >
                <div className="mb-4">
                  <ArticleOutlinedIcon
                    fontSize="large"
                    className="text-gray-400"
                  />
                </div>

                <div className="text-lg text-gray-500">
                  {c.questionnaireName}
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  Solicitado em{' '}
                  {c.requestCreatedAt
                    ? format(c.requestCreatedAt, 'dd/MM/yyyy', { locale: ptBR })
                    : '-'}
                </div>

                <Button
                  className="mt-auto flex justify-end pt-4"
                  variant="link"
                  onClick={() =>
                    router.push(`/pacientes/${id}/questionnaires/${c.id}`)
                  }
                >
                  Ver resultado
                </Button>
              </Card>
            ))}
      </div>

      <DataTable
        tableTitle="Todos"
        columns={columns}
        data={rows as QuestionnaireRow[]}
        mainAction={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="rounded-md border-gray-200 font-normal hover:bg-transparent hover:text-primary-600"
              size="sm"
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
              value={statusFilter ?? ''}
              onChange={(value) => setStatusFilter(value || null)}
              placeholder="Filtrar status"
              className="h-9 w-40 rounded-md border border-gray-200 bg-white text-primary-700"
            />
          </div>
        }
      />

      {/* Modal */}
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
