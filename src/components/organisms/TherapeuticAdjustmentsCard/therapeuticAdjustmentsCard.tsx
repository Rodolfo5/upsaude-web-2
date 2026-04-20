'use client'

import { ChevronLeft as ChevronLeftIcon } from 'lucide-react'
import { ChevronRight as ChevronRightIcon } from 'lucide-react'
import { ChevronsLeft as FirstPageIcon } from 'lucide-react'
import { ChevronsRight as LastPageIcon } from 'lucide-react'
import { ExternalLink as OpenInNewIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

import { Card } from '@/components/ui/card'
import { useAllAdjustments } from '@/hooks/queries/useTherapeuticPlanAdjustments'

type Props = {
  patientId: string
  className?: string
}

const ITEMS_PER_PAGE = 3

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function TherapeuticAdjustmentsCard({
  patientId,
  className = '',
}: Props) {
  const router = useRouter()
  const { data: adjustments = [], isLoading } = useAllAdjustments(patientId)
  const [currentPage, setCurrentPage] = useState(0)

  const totalPages = Math.ceil(adjustments.length / ITEMS_PER_PAGE)
  const paginatedAdjustments = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return adjustments.slice(start, end)
  }, [adjustments, currentPage])

  const handleViewPlan = (planId: string) => {
    router.push(`/pacientes/${patientId}/plano-terapeutico/${planId}`)
  }

  const goToFirstPage = () => setCurrentPage(0)
  const goToLastPage = () => setCurrentPage(Math.max(0, totalPages - 1))
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1))
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  const goToPage = (page: number) => setCurrentPage(page)

  if (isLoading) {
    return (
      <Card
        className={`rounded-3xl border-gray-200 bg-white p-6 shadow-none ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-7 w-48 rounded bg-gray-200"></div>
          <div className="mt-2 h-4 w-64 rounded bg-gray-200"></div>
          <div className="mt-6 space-y-4">
            <div className="h-20 w-full rounded bg-gray-100"></div>
            <div className="h-20 w-full rounded bg-gray-100"></div>
            <div className="h-20 w-full rounded bg-gray-100"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (adjustments.length === 0) {
    return (
      <Card
        className={`rounded-3xl border-gray-200 bg-white p-6 shadow-none ${className}`}
      >
        <h3 className="text-xl font-semibold text-brand-purple-dark-500">
          Ajustes terapêuticos
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Alterações no plano terapêutico
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Nenhum ajuste registrado ainda.
        </p>
      </Card>
    )
  }

  return (
    <Card
      className={`rounded-3xl border-gray-200 bg-white p-6 shadow-none ${className}`}
    >
      <h3 className="text-xl font-semibold text-brand-purple-dark-500">
        Ajustes terapêuticos
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Alterações no plano terapêutico
      </p>

      <div className="mt-6 space-y-4">
        {paginatedAdjustments.map((adjustment) => (
          <div
            key={adjustment.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {formatDate(adjustment.createdAt)}
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {adjustment.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Por Dr. {adjustment.doctorName}
                </p>
              </div>
              <button
                onClick={() => handleViewPlan(adjustment.planId)}
                className="ml-4 flex items-center gap-1 text-sm font-medium text-brand-purple-dark-500 hover:text-purple-700"
              >
                Ver plano
                <OpenInNewIcon fontSize="small" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={goToFirstPage}
            disabled={currentPage === 0}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Primeira página"
          >
            <FirstPageIcon fontSize="small" />
          </button>
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Página anterior"
          >
            <ChevronLeftIcon fontSize="small" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(totalPages, 3) },
              (_, i) => i + currentPage,
            ).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                  currentPage === page
                    ? 'bg-brand-purple-dark-500 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                aria-label={`Página ${page + 1}`}
              >
                {page + 1}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages - 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Próxima página"
          >
            <ChevronRightIcon fontSize="small" />
          </button>
          <button
            onClick={goToLastPage}
            disabled={currentPage >= totalPages - 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Última página"
          >
            <LastPageIcon fontSize="small" />
          </button>
        </div>
      )}
    </Card>
  )
}
