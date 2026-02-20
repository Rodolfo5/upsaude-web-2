'use client'

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { addDays, subDays } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState, use } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/atoms/Button/button'
import { ExerciseRecordCard } from '@/components/molecules/ExerciseRecordCard/exerciseRecordCard'
import { ExerciseDetailModal } from '@/components/organisms/Modals/ExerciseDetailModal/exerciseDetailModal'
import { ExerciseRecommendationDetailsModal } from '@/components/organisms/Modals/ExerciseRecommendationDetailsModal/exerciseRecommendationDetailsModal'
import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useExerciseActivities } from '@/hooks/queries/useExerciseActivities'
import { useExerciseRecords } from '@/hooks/queries/useExerciseRecords'
import { useLifestyleCategories } from '@/hooks/queries/useHealthPillarLifestyleCategories'
import { useLifestylePillar } from '@/hooks/queries/useMealRecords'
import { useCurrentTherapeuticPlan } from '@/hooks/queries/useTherapeuticPlan'
import { usePatient } from '@/hooks/usePatient'
import { cn } from '@/lib/utils'
import type { ActivityEntity } from '@/types/entities/healthPillar'
import type { ExerciseRecordEntity } from '@/types/entities/lifestyle'

const PAGE_SIZE = 10

function parseDuration(duration: string): number {
  const [minutes, seconds] = duration.split(':')
  const mins = parseInt(minutes || '0', 10)
  const secs = parseInt(seconds || '0', 10)
  return mins + secs / 60
}

interface Props {
  params: Promise<{ id: string }>
}

function parseStepsGoal(
  desiredParameter: number | string | object | undefined,
): { goalValue: number; unit: 'passos' | 'km' } {
  if (desiredParameter == null) return { goalValue: 0, unit: 'passos' }
  if (
    typeof desiredParameter === 'object' &&
    desiredParameter !== null &&
    !Array.isArray(desiredParameter)
  ) {
    const p = desiredParameter as { quantity?: number; unit?: string }
    const quantity =
      p.quantity ?? (p as { desiredParameter?: number }).desiredParameter ?? 0
    const unit = p.unit === 'Km' ? 'km' : 'passos'
    return { goalValue: Number(quantity) || 0, unit }
  }
  if (typeof desiredParameter === 'number')
    return { goalValue: desiredParameter, unit: 'passos' }
  const num = Number(desiredParameter)
  return { goalValue: Number.isNaN(num) ? 0 : num, unit: 'passos' }
}

export default function MovimentoPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const { patient } = usePatient(id)
  const { data: currentPlan } = useCurrentTherapeuticPlan(id)
  const planId = currentPlan?.id ?? ''
  const { data: lifestylePillar } = useLifestylePillar(id, planId)
  const pillarId = lifestylePillar?.id ?? ''
  const { data: lifestyleCategories = [] } = useLifestyleCategories(
    id,
    planId,
    pillarId,
  )

  const [selectedTab, setSelectedTab] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] =
    useState<ExerciseRecordEntity | null>(null)
  const [page, setPage] = useState(0)
  const [recommendationPage, setRecommendationPage] = useState(0)
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<ActivityEntity | null>(null)

  const RECOMMENDATIONS_PER_PAGE = 2

  const handleRecommendationDetails = (activity: ActivityEntity) => {
    setSelectedRecommendation(activity)
    setRecommendationModalOpen(true)
  }

  const handleRecommendationModalClose = (open: boolean) => {
    setRecommendationModalOpen(open)
    if (!open) setSelectedRecommendation(null)
  }

  const today = useMemo(() => new Date(), [])
  const startDate = useMemo(() => subDays(today, 30), [today])
  const endDate = useMemo(() => addDays(today, 7), [today])

  const { data: records = [], isLoading } = useExerciseRecords(
    id,
    startDate,
    endDate,
  )

  const { data: exerciseActivities = [] } = useExerciseActivities(id)

  // Extrair categorias únicas dinamicamente
  const categories = useMemo(() => {
    const uniqueCategories = new Set(records.map((r) => r.categoryId))
    return Array.from(uniqueCategories).sort()
  }, [records])

  const tabs = useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      ...categories.map((cat) => ({ value: cat, label: cat })),
    ],
    [categories],
  )

  const filteredRecords = useMemo(() => {
    if (selectedTab === 'todos') return records
    return records.filter((record) => record.categoryId === selectedTab)
  }, [records, selectedTab])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const paginatedRecords = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredRecords.slice(start, start + PAGE_SIZE)
  }, [filteredRecords, page])

  const handleCardClick = (record: ExerciseRecordEntity) => {
    setSelectedRecord(record)
    setModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) setSelectedRecord(null)
  }

  const patientName = patient?.name ?? 'Paciente'

  // Gráfico de exercícios por dia da semana
  const weekChartData = useMemo(() => {
    const daysMap = {
      Seg: 0,
      Ter: 0,
      Qua: 0,
      Qui: 0,
      Sex: 0,
      Sab: 0,
      Dom: 0,
    }

    records.forEach((record) => {
      const date = new Date(record.createdAt)
      const dayIndex = date.getDay()
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
      const dayName = dayNames[dayIndex] as keyof typeof daysMap
      daysMap[dayName] += 1
    })

    return Object.entries(daysMap).map(([day, count]) => ({
      day,
      count,
    }))
  }, [records])

  // Calcular frequência semanal (Seg a Dom)
  const weeklyFrequency = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    const daysWithExercise = new Set<number>()

    records.forEach((record) => {
      const recordDate = new Date(record.createdAt)
      if (recordDate >= startOfWeek && recordDate <= today) {
        daysWithExercise.add(recordDate.getDay())
      }
    })

    const dayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    return dayLabels.map((day, i) => ({
      day,
      completed: daysWithExercise.has(i === 6 ? 0 : i + 1),
    }))
  }, [records])

  // Último registro
  const latestRecord = records.length > 0 ? records[0] : null

  // Meta de passos/km (categoria Movimentos - Passos)
  const stepsCategory = useMemo(
    () => lifestyleCategories.find((c) => c.type === 'Movimentos - Passos'),
    [lifestyleCategories],
  )
  const { goalValue: stepsGoalValue, unit: stepsGoalUnit } = useMemo(
    () => parseStepsGoal(stepsCategory?.desiredParameter),
    [stepsCategory?.desiredParameter],
  )

  // Progresso de hoje: km a partir dos registros (duration/10 ≈ km); passos não temos fonte nos records
  const todayStart = useMemo(() => {
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [today])
  const todayEnd = useMemo(() => {
    const d = new Date(today)
    d.setHours(23, 59, 59, 999)
    return d.getTime()
  }, [today])
  const todayKmProgress = useMemo(() => {
    return records
      .filter((r) => {
        const t =
          r.createdAt instanceof Date
            ? r.createdAt.getTime()
            : new Date(r.createdAt).getTime()
        return t >= todayStart && t <= todayEnd
      })
      .reduce((acc, r) => acc + parseDuration(r.duration) / 10, 0)
  }, [records, todayStart, todayEnd])
  const todayStepsProgress = 0 // não há campo de passos nos registros de exercício

  const dailyProgress =
    stepsGoalUnit === 'km' ? todayKmProgress : todayStepsProgress
  const dailyGoal = stepsGoalValue
  const progressPercent =
    dailyGoal > 0
      ? Math.min(100, Math.round((dailyProgress / dailyGoal) * 100))
      : 0
  const hasStepsGoal = stepsCategory != null && dailyGoal > 0
  const goalLabel =
    stepsGoalUnit === 'km'
      ? `${dailyGoal} km`
      : `${new Intl.NumberFormat('pt-BR').format(dailyGoal)} passos`
  const currentLabel =
    stepsGoalUnit === 'km'
      ? `${todayKmProgress.toFixed(1)} km`
      : `${new Intl.NumberFormat('pt-BR').format(todayStepsProgress)} passos`

  const chartConfig = {
    count: {
      label: 'Exercícios',
      color: '#7C3AED',
    },
  }

  return (
    <div className="h-screen px-4 md:px-8 lg:px-20">
      <div className="mt-24 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          className="flex cursor-pointer items-center gap-4 text-purple-800 hover:text-purple-600"
          onClick={() => router.push(`/pacientes/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
            Detalhes da movimentação
          </h1>
        </Button>
        <p className="text-sm text-gray-600">Paciente | {patientName}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Cards do topo */}
        <Card className="rounded-3xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-4 text-xl font-semibold text-[#530570]">
            Registro de Exercício
          </h3>
          {latestRecord ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                {new Date(latestRecord.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor(parseDuration(latestRecord.duration))}
                  </p>
                  <p className="text-xs text-gray-600">min</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestRecord.caloriesBurned}
                  </p>
                  <p className="text-xs text-gray-600">kcal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(parseDuration(latestRecord.duration) / 10).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-600">km</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
                  <FitnessCenterIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-600">
                    {latestRecord.categoryId}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum registro ainda</p>
          )}
        </Card>

        <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-4 text-xl font-semibold text-[#530570]">
            Passos diários
          </h3>
          <p className="text-xs text-gray-600">
            Movimente-se! Caminhar faz bem
          </p>
          {hasStepsGoal ? (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{currentLabel}</span>
                <span className="text-gray-600">{goalLabel}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-[width]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-right text-sm font-semibold text-green-600">
                {progressPercent}%
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Configure a meta de passos ou km no plano terapêutico (Movimentos
              - Passos) para acompanhar o progresso diário.
            </p>
          )}
        </Card>

        <Card className="rounded-3xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-4 text-xl font-semibold text-[#530570]">
            Frequência
          </h3>
          <div className="flex justify-between">
            {weeklyFrequency.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Image
                    src={item.completed ? '/greenday.png' : '/purpleday.png'}
                    alt={
                      item.completed ? 'Dia com exercício' : 'Dia sem exercício'
                    }
                    className="h-full w-full object-contain"
                    width={20}
                    height={20}
                  />
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* Gráfico - esquerda */}
        <div className="min-w-0 flex-1">
          <Card className="flex h-full min-h-[280px] flex-col rounded-2xl border-gray-200 bg-white p-6 shadow-none">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#530570]">
                Exercício Físico
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                >
                  Mês
                </Button>
                <Button
                  variant="secondary-color"
                  size="sm"
                  className="h-8 rounded-full bg-primary-600 px-3 text-xs text-white"
                >
                  Semana
                </Button>
              </div>
            </div>
            <ChartContainer
              config={chartConfig}
              className="h-[200px] min-h-[200px] w-full"
            >
              <BarChart data={weekChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{ fontSize: '12px' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>
        </div>

        {/* Recomendação de Exercícios - direita, alinhada ao gráfico */}
        {exerciseActivities.length > 0 && (
          <aside className="w-full min-w-0 lg:w-[360px] lg:flex-shrink-0">
            <Card className="flex h-full min-h-[280px] flex-col rounded-2xl border-gray-200 bg-white p-4 shadow-none">
              <h3 className="mb-4 shrink-0 text-lg font-bold text-[#530570]">
                Recomendação de Exercícios
              </h3>
              <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
                {exerciseActivities
                  .slice(
                    recommendationPage * RECOMMENDATIONS_PER_PAGE,
                    recommendationPage * RECOMMENDATIONS_PER_PAGE +
                      RECOMMENDATIONS_PER_PAGE,
                  )
                  .map((activity) => {
                    const categoryLabel = Array.isArray(activity.category)
                      ? activity.category[0]
                      : activity.category
                    const modalityLabel = Array.isArray(activity.modality)
                      ? activity.modality[0]
                      : activity.modality
                    const mainCategory =
                      modalityLabel || categoryLabel || 'Exercício'
                    const specificExercise =
                      (Array.isArray(activity.category)
                        ? activity.category[0]
                        : activity.category) ||
                      modalityLabel ||
                      '—'
                    const frequencyText = `${activity.frequencyValue ?? 3}x na semana`
                    const detailText =
                      activity.patientGuidelines?.trim() ||
                      (activity.trainingPrescriptions?.[0]?.description ?? '—')
                    return (
                      <div
                        key={activity.id}
                        className="flex min-w-0 items-stretch gap-3 rounded-lg bg-[#F5F0F8] p-3"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                          <DirectionsRunIcon className="h-6 w-6 text-[#530570]" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-xs text-gray-500">
                            {mainCategory}
                          </p>
                          <p className="truncate text-sm font-bold text-gray-900">
                            {specificExercise}
                          </p>
                          <div className="mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden text-xs text-gray-500">
                            <LocalFireDepartmentIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <LocalFireDepartmentIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                            <LocalFireDepartmentIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                            <ShowChartIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{frequencyText}</span>
                          </div>
                        </div>
                        <div className="flex w-24 flex-shrink-0 flex-col items-end justify-between gap-1">
                          <p
                            className="line-clamp-2 text-right text-xs text-gray-500"
                            title={detailText}
                          >
                            {detailText}
                          </p>
                          <Button
                            variant="secondary-color"
                            size="sm"
                            className="h-8 shrink-0 rounded-lg bg-[#530570] px-3 py-1.5 text-xs text-white hover:bg-[#530570]/90"
                            onClick={() =>
                              handleRecommendationDetails(activity)
                            }
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
              {exerciseActivities.length > RECOMMENDATIONS_PER_PAGE && (
                <div className="mt-4 flex shrink-0 items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      setRecommendationPage((p) => Math.max(0, p - 1))
                    }
                    disabled={recommendationPage === 0}
                  >
                    <KeyboardArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  {Array.from(
                    {
                      length: Math.ceil(
                        exerciseActivities.length / RECOMMENDATIONS_PER_PAGE,
                      ),
                    },
                    (_, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-7 w-7 rounded-full p-0 text-xs',
                          recommendationPage === i
                            ? 'bg-[#530570] text-white hover:bg-[#530570]/90'
                            : 'text-gray-600',
                        )}
                        onClick={() => setRecommendationPage(i)}
                      >
                        {i + 1}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      setRecommendationPage((p) =>
                        Math.min(
                          Math.ceil(
                            exerciseActivities.length /
                              RECOMMENDATIONS_PER_PAGE,
                          ) - 1,
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      recommendationPage >=
                      Math.ceil(
                        exerciseActivities.length / RECOMMENDATIONS_PER_PAGE,
                      ) -
                        1
                    }
                  >
                    <KeyboardArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </aside>
        )}
      </div>

      <div className="mt-8">
        <div className="h-full min-w-0 rounded-xl p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Registros
          </h2>

          <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedTab(tab.value)
                  setPage(0)
                }}
                className={cn(
                  'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  selectedTab === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Carregando registros…
            </div>
          ) : paginatedRecords.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Nenhum registro de exercício encontrado.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {paginatedRecords.map((record) => (
                  <ExerciseRecordCard
                    key={record.id}
                    record={record}
                    onClick={() => handleCardClick(record)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <KeyboardArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-8 w-8 rounded-full border-none p-0',
                          p === page + 1
                            ? 'bg-primary-600 text-white hover:bg-primary-600/90'
                            : 'bg-transparent text-gray-600 hover:bg-gray-50',
                        )}
                        onClick={() => setPage(p - 1)}
                      >
                        {p}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-gray-300 bg-white p-0 text-gray-600 hover:bg-gray-50"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                  >
                    <KeyboardArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ExerciseDetailModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        record={selectedRecord}
      />

      <ExerciseRecommendationDetailsModal
        isOpen={recommendationModalOpen}
        setIsOpen={handleRecommendationModalClose}
        activity={selectedRecommendation}
      />
    </div>
  )
}
