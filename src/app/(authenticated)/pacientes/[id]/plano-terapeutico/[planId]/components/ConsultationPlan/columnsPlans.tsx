'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/ui/button'
import useConsultationsByPlan from '@/hooks/queries/useConsultationsByPlan'
import { timestampToDate } from '@/lib/utils'
import { ConsultationPlanEntity } from '@/types/entities/consultationPlan'

function ViewDetailsButton({
  planId,
  patientId,
  therapeuticPlanId,
}: {
  planId: string
  patientId: string
  therapeuticPlanId: string
}) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      size="sm"
      className="text-purple-600 hover:text-purple-800"
      onClick={() =>
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${therapeuticPlanId}/planConsultation/${planId}`,
        )
      }
    >
      Ver detalhes
    </Button>
  )
}

function PerformedConsultationsCell({ planId }: { planId: string }) {
  const { data: consultations, isLoading } = useConsultationsByPlan(planId)

  if (isLoading) return <div>...</div>

  const performedCount = consultations?.length || 0
  return <span>{performedCount}</span>
}

export const getPlanColumns = (
  patientId: string,
  therapeuticPlanId: string,
): ColumnDef<ConsultationPlanEntity>[] => {
  return [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          className="text-gray-500 hover:no-underline"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant={'link'}
        >
          Data de realização
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const date = row.original.createdAt
        if (!date) return <div>-</div>
        const parsedDate = timestampToDate(date as unknown as Timestamp)
        if (!parsedDate) return <div>-</div>
        return (
          <div className="font-medium">
            {format(parsedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.createdAt
        const dateB = rowB.original.createdAt
        const parsedA =
          dateA instanceof Timestamp ? timestampToDate(dateA) : null
        const parsedB =
          dateB instanceof Timestamp ? timestampToDate(dateB) : null
        if (!parsedA && !parsedB) return 0
        if (!parsedA) return 1
        if (!parsedB) return -1
        return parsedA.getTime() - parsedB.getTime()
      },
    },
    {
      accessorKey: 'specialty',
      header: 'Especialidade',
      cell: ({ row }) => {
        return <div>{row.original.specialty}</div>
      },
    },
    {
      accessorKey: 'frequency',
      header: 'Frequência',
      cell: ({ row }) => {
        const frequency = row.original.frequency
        const intervalLabel =
          {
            days: 'dias',
            weeks: 'semanas',
            month: 'mês',
          }[frequency.interval] || frequency.interval
        return <div>{`A cada ${frequency.quantity} ${intervalLabel}`}</div>
      },
    },
    {
      accessorKey: 'performed',
      header: 'Consultas realizadas',
      cell: ({ row }) => {
        const plan = row.original
        const total = plan.totalConsultations
        return (
          <div>
            <PerformedConsultationsCell planId={plan.id || ''} />/{total}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const plan = row.original
        return (
          <ViewDetailsButton
            planId={plan.id || ''}
            patientId={patientId}
            therapeuticPlanId={therapeuticPlanId}
          />
        )
      },
    },
  ]
}
