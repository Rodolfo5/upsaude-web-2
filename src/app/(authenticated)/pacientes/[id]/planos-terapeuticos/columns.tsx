'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { Button } from '@/components/ui/button'
import { TherapeuticPlanEntity } from '@/types/entities/therapeuticPlan'

export type TherapeuticPlanRow = TherapeuticPlanEntity & {
  doctorName?: string
}

export function makeTherapeuticPlansColumns(
  patientId: string,
  router: AppRouterInstance,
): ColumnDef<TherapeuticPlanRow>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => {
        const id = row.getValue('id') as string
        // Truncar ID para exibição (primeiros 8 caracteres)
        const truncatedId = id.length > 8 ? `${id.substring(0, 8)}...` : id
        return <div className="font-mono text-sm">{truncatedId}</div>
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            className="flex items-center gap-1 text-gray-500 hover:no-underline"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            variant={'link'}
          >
            Data de criação
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        )
      },
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const date = new Date(row.getValue(columnId))
        const { from, to } = filterValue
        if (from && date < from) return false
        if (to && date > to) return false
        return true
      },
      cell: ({ row }) => {
        const v = row.getValue('createdAt') as Date | string
        if (!v) return '-'
        const dt = v instanceof Date ? v : new Date(String(v))
        return <div>{format(dt, 'dd/MM/yyyy', { locale: ptBR })}</div>
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Criado por',
      cell: ({ row }) => {
        const original = row.original as TherapeuticPlanRow
        const name = original.doctorName || original.createdBy || '-'
        return <div>{name}</div>
      },
    },
    {
      accessorKey: 'objective',
      header: 'Objetivo',
      cell: ({ row }) => {
        const objective = row.getValue('objective') as string
        return <div>{objective || '-'}</div>
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const plan = row.original
        return (
          <Button
            variant="link"
            className="text-purple-600 hover:text-purple-800 hover:no-underline"
            onClick={() =>
              router.push(`/pacientes/${patientId}/plano-terapeutico/${plan.id}`)
            }
          >
            Ver plano
          </Button>
        )
      },
    },
  ]
}
