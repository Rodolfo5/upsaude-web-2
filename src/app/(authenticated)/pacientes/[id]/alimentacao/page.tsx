'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { ChevronLeft as KeyboardArrowLeftIcon } from 'lucide-react'
import { ChevronRight as KeyboardArrowRightIcon } from 'lucide-react'
import { addDays, subDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState, use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { MealRecordCard } from '@/components/molecules/MealRecordCard/mealRecordCard'
import { MealSummaryCard } from '@/components/organisms/MealSummaryCard/mealSummaryCard'
import { MealDetailModal } from '@/components/organisms/Modals/MealDetailModal/mealDetailModal'
import { OrientationDetailsModal } from '@/components/organisms/Modals/OrientationDetailsModal/orientationDetailsModal'
import { MEAL_TABS } from '@/constants/mealTypes'
import { useOrientationsByPillar } from '@/hooks/queries/useHealthPillarOrientations'
import {
  useActiveMenu,
  useLifestylePillar,
  useMealRecords,
} from '@/hooks/queries/useMealRecords'
import { useCurrentTherapeuticPlan } from '@/hooks/queries/useTherapeuticPlan'
import { usePatient } from '@/hooks/usePatient'
import { cn } from '@/lib/utils'
import type {
  MenuMealRecordEntity,
  MenuMealRecordEntry,
} from '@/types/entities/mealRecord'

const DEFAULT_MAX_KCAL = 1800
const PAGE_SIZE = 10

function toYmd(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

interface Props {
  params: Promise<{ id: string }>
}

export default function AlimentacaoPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const { patient } = usePatient(id)
  const { data: currentPlan } = useCurrentTherapeuticPlan(id)
  const planId = currentPlan?.id ?? ''
  const { data: lifestylePillar } = useLifestylePillar(id, planId)
  const pillarId = lifestylePillar?.id ?? ''
  const { data: activeMenu } = useActiveMenu(id, planId, pillarId)
  const { data: orientations = [] } = useOrientationsByPillar(
    id,
    planId,
    pillarId,
  )
  const menuId = activeMenu?.id ?? ''

  const nutritionalRecommendation = orientations.find(
    (o) => o.area === 'Alimentação' && o.status === 'Ativa',
  )

  const [selectedTab, setSelectedTab] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [recommendationModalOpen, setRecommendationModalOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<{
    entry: MenuMealRecordEntry
    recordDate: Date | string
  } | null>(null)
  const [page, setPage] = useState(0)

  const today = useMemo(() => new Date(), [])
  const startDate = useMemo(() => subDays(today, 30), [today])
  const endDate = useMemo(() => addDays(today, 7), [today])

  const { data: records = [], isLoading } = useMealRecords(
    id,
    planId,
    pillarId,
    menuId,
    startDate,
    endDate,
  )

  const flatItems = useMemo(() => {
    const out: { entity: MenuMealRecordEntity; entry: MenuMealRecordEntry }[] =
      []
    for (const entity of records) {
      for (const entry of entity.meals) {
        out.push({ entity, entry })
      }
    }
    out.sort((a, b) => {
      const ta = new Date(a.entity.date).getTime()
      const tb = new Date(b.entity.date).getTime()
      return tb - ta
    })
    return out
  }, [records])

  const filteredItems = useMemo(() => {
    if (selectedTab === 'todos') return flatItems
    return flatItems.filter(({ entry }) => entry.mealType === selectedTab)
  }, [flatItems, selectedTab])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const paginatedItems = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, page])

  const summary = useMemo(() => {
    const targetYmd = toYmd(today)
    let consumed = 0
    let dentro = 0
    let fora = 0
    for (const entity of records) {
      if (toYmd(entity.date) !== targetYmd) continue
      for (const entry of entity.meals) {
        consumed += entry.kcal
        if (entry.followedMenu) dentro += 1
        else fora += 1
      }
    }
    const maxKcal = DEFAULT_MAX_KCAL
    const remaining = Math.max(0, maxKcal - consumed)
    return {
      consumedKcal: consumed,
      remainingKcal: remaining,
      maxKcal,
      dentroDietaCount: dentro,
      foraDietaCount: fora,
    }
  }, [records, today])

  const handleCardClick = (
    entity: MenuMealRecordEntity,
    entry: MenuMealRecordEntry,
  ) => {
    setSelectedMeal({ entry, recordDate: entity.date })
    setModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) setSelectedMeal(null)
  }

  const patientName = patient?.name ?? 'Paciente'

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
            Detalhes da alimentação
          </h1>
        </Button>
        <p className="text-sm text-gray-600">Paciente | {patientName}</p>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full lg:w-[340px] lg:flex-shrink-0">
          <MealSummaryCard
            consumedKcal={summary.consumedKcal}
            remainingKcal={summary.remainingKcal}
            maxKcal={summary.maxKcal}
            dentroDietaCount={summary.dentroDietaCount}
            foraDietaCount={summary.foraDietaCount}
            dietTitle={nutritionalRecommendation?.title}
            onVerDetalhesClick={
              nutritionalRecommendation
                ? () => setRecommendationModalOpen(true)
                : undefined
            }
          />
        </aside>

        <div className="h-full min-w-0 flex-1 rounded-xl p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#530570]">
            Registros
          </h2>

          <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
            {MEAL_TABS.map((tab) => (
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
          ) : !planId || !pillarId || !menuId ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Plano terapêutico ou menu ativo não encontrado. Os registros de
              alimentação dependem de um menu ativo no pilar Estilo de Vida.
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              Nenhum registro de alimentação encontrado.
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedItems.map(({ entity, entry }, idx) => (
                  <MealRecordCard
                    key={`${entity.id}-${page * PAGE_SIZE + idx}-${entry.mealType}`}
                    entry={entry}
                    recordDate={entity.date}
                    onClick={() => handleCardClick(entity, entry)}
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

      <MealDetailModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        entry={selectedMeal?.entry ?? null}
        recordDate={selectedMeal?.recordDate ?? new Date()}
      />

      {nutritionalRecommendation && (
        <OrientationDetailsModal
          isOpen={recommendationModalOpen}
          setIsOpen={setRecommendationModalOpen}
          orientation={nutritionalRecommendation}
        />
      )}
    </div>
  )
}
