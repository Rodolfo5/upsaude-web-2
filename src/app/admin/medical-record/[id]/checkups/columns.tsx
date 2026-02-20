'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HealthCheckupEntity } from '@/types/entities/healthCheckup'

export type CheckupRow = HealthCheckupEntity & {
  requestedByName?: string
  requestedBy?: { name?: string }
  requestingProfessional?: { name?: string; council?: string }
  professionalName?: string
  professionalCouncil?: string
  council?: string
  doctorId?: string
  doctor?: {
    name: string
    typeOfCredential: string
    credential: string
    state: string
  }
}

export function getRequesterName(entity: CheckupRow) {
  if (entity.doctorId && entity.doctor) {
    return entity.doctor.name
  }
  return (
    entity.requestedByName ||
    entity.requestedBy?.name ||
    entity.requestingProfessional?.name ||
    entity.professionalName ||
    '-'
  )
}

export function getRequesterCouncil(entity: CheckupRow) {
  if (entity.doctorId && entity.doctor) {
    return `${entity.doctor.typeOfCredential} ${entity.doctor.credential} ${entity.doctor.state}`
  }
  return (
    entity.council ||
    entity.requestingProfessional?.council ||
    entity.professionalCouncil ||
    '-'
  )
}

export function makeCheckupColumns(
  id: string,
  router: { push: (url: string) => void },
): ColumnDef<HealthCheckupEntity>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            className="text-gray-500 hover:no-underline"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            variant={'link'}
          >
            Data de solicitação
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
      accessorKey: 'completedAt',
      header: ({ column }) => {
        return (
          <Button
            className="text-gray-500 hover:no-underline"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            variant={'link'}
          >
            Data de realização
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        )
      },
      enableSorting: true,
      cell: ({ row }) => {
        const v = row.getValue('completedAt') as Date | string | null
        if (!v) return <div>-</div>
        const dt = v instanceof Date ? v : new Date(String(v))
        return <div>{format(dt, 'dd/MM/yyyy', { locale: ptBR })}</div>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const v = String(row.getValue(columnId))
        // filterValue is expected to be a status code like 'COMPLETED' or 'REQUESTED'
        return v === String(filterValue)
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const label = status === 'COMPLETED' ? 'Realizado' : 'Solicitado'
        const color =
          status === 'COMPLETED'
            ? 'text-success-600 bg-green-200 hover:bg-green-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        return <Badge className={`${color} shadow-none`}>{label}</Badge>
      },
    },
    {
      accessorKey: 'professionalName',
      header: 'Profissional solicitante',
      cell: ({ row }) => {
        const original = row.original as CheckupRow
        const name = getRequesterName(original)
        return <div>{name}</div>
      },
    },
    {
      accessorKey: 'council',
      header: 'Conselho',
      cell: ({ row }) => {
        const original = row.original as CheckupRow
        const council =
          (row.getValue('council') as string) || getRequesterCouncil(original)
        return <div>{council}</div>
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const checkup = row.original
        const isDisabled = !checkup.completedAt
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
              router.push(`/admin/medical-record/${id}/checkups/${checkup.id}`)
            }
          >
            Ver resultado
          </Button>
        )
      },
    },
  ]
}
