'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

export type QuestionnaireRow = {
  requestId: string
  requestCreatedAt: Date | string
  questionnaire?: QuestionnaireEntity
  questionnaireName?: string
  questionnaireCreatedAt?: Date | string
  status: 'REQUESTED' | 'COMPLETED'
  id: string
}

// requester name is taken from request entity; page builds rows with requester info if needed
export function makeQuestionnairesColumns(
  id: string,
  router: { push: (url: string) => void },
): ColumnDef<QuestionnaireRow>[] {
  return [
    {
      accessorKey: 'requestCreatedAt',
      header: ({ column }) => (
        <Button
          className="text-gray-500 hover:no-underline"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant={'link'}
        >
          Data de solicitação
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
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
        const v = row.getValue('requestCreatedAt') as Date | string
        if (!v) return '-'
        const dt = v instanceof Date ? v : new Date(String(v))
        return <div>{format(dt, 'dd/MM/yyyy', { locale: ptBR })}</div>
      },
    },
    {
      accessorKey: 'questionnaireCreatedAt',
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
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const date = new Date(row.getValue(columnId))
        const { from, to } = filterValue
        if (from && date < from) return false
        if (to && date > to) return false
        return true
      },
      cell: ({ row }) => {
        const v = row.getValue('questionnaireCreatedAt') as Date | string | null
        if (!v) return <div>-</div>
        const dt = v instanceof Date ? v : new Date(String(v))
        return <div>{format(dt, 'dd/MM/yyyy', { locale: ptBR })}</div>
      },
    },
    {
      accessorKey: 'questionnaireName',
      header: 'Questionário',
      cell: ({ row }) => {
        const name = row.getValue('questionnaireName') as string
        return <div>{name || '-'}</div>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const v = String((row.original as QuestionnaireRow).status)
        return v === String(filterValue)
      },
      cell: ({ row }) => {
        const status = (row.original as QuestionnaireRow).status
        const label = status === 'COMPLETED' ? 'Realizado' : 'Solicitado'
        const color =
          status === 'COMPLETED'
            ? 'text-success-600 bg-green-200 hover:bg-green-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        return <Badge className={`${color} shadow-none`}>{label}</Badge>
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const item = row.original as QuestionnaireRow
        const isDisabled = item.status !== 'COMPLETED' || !item.questionnaire
        return (
          <Button
            variant="link"
            className={
              isDisabled
                ? 'cursor-not-allowed text-gray-400'
                : 'hover:no-underline'
            }
            disabled={isDisabled}
            onClick={() =>
              !isDisabled &&
              router.push(
                `/pacientes/${id}/questionnaires/${item.questionnaire?.id}`,
              )
            }
          >
            Ver resultado
          </Button>
        )
      },
    },
  ]
}
