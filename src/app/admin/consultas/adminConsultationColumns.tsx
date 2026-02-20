'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown, Ban, Calendar, Clock, Edit, Video } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConsultationEntity } from '@/types/entities/consultation'

export interface ConsultationWithNames extends ConsultationEntity {
  doctorName?: string
  patientName?: string
}

interface AdminConsultationColumnsProps {
  onReschedule: (consultation: ConsultationWithNames) => void
  onCancel: (consultation: ConsultationWithNames) => void
}

export const createAdminConsultationColumns = ({
  onReschedule,
  onCancel,
}: AdminConsultationColumnsProps): ColumnDef<ConsultationWithNames>[] => [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue('date') as Date
      return (
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="h-4 w-4 text-gray-500" />
          {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('date'))
      const dateB = new Date(rowB.getValue('date'))
      return dateA.getTime() - dateB.getTime()
    },
  },
  {
    accessorKey: 'hour',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Horário
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium">
        <Clock className="h-4 w-4 text-gray-500" />
        {row.getValue('hour')}
      </div>
    ),
  },
  {
    accessorKey: 'doctorName',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Profissional
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue('doctorName') as string
      if (!name) return <span className="text-gray-400">Carregando...</span>

      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-purple-100 text-xs text-purple-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string
      return name?.toLowerCase().includes(value.toLowerCase()) ?? false
    },
  },
  {
    accessorKey: 'patientName',
    header: 'Paciente',
    cell: ({ row }) => {
      const name = row.getValue('patientName') as string
      if (!name) return <span className="text-gray-400">Carregando...</span>

      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'format',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Formato
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const format = row.getValue('format') as string
      const isTeleconsulta = format === 'ONLINE'

      return (
        <Badge
          className={
            isTeleconsulta
              ? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
              : 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100'
          }
        >
          {isTeleconsulta ? (
            <Video className="mr-1 h-3 w-3" />
          ) : (
            <Calendar className="mr-1 h-3 w-3" />
          )}
          {isTeleconsulta ? 'Online' : 'Presencial'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!value) return true
      return row.getValue(id) === value
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      const statusConfig = {
        COMPLETED: {
          className:
            'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
          label: 'Concluído',
        },
        SCHEDULED: {
          className:
            'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          label: 'Agendado',
        },
        CANCELLED: {
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          label: 'Cancelado',
        },
      }

      const config = statusConfig[status as keyof typeof statusConfig] || {
        className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
        label: status,
      }

      return <Badge className={config.className}>{config.label}</Badge>
    },
    filterFn: (row, id, value) => {
      if (!value) return true
      return row.getValue(id) === value
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center font-semibold">Ações</div>,
    cell: ({ row }) => {
      const status = row.original.status
      const consultation = row.original

      if (status === 'COMPLETED' || status === 'CANCELLED') {
        return (
          <div className="flex items-center justify-center text-xs text-gray-400">
            -
          </div>
        )
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReschedule(consultation)}
            className="h-8 gap-1 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
            title="Remarcar consulta"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Remarcar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(consultation)}
            className="h-8 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Cancelar consulta"
          >
            <Ban className="h-4 w-4" />
            <span className="hidden sm:inline">Cancelar</span>
          </Button>
        </div>
      )
    },
  },
]
