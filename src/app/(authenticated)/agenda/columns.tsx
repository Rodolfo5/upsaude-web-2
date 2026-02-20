'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Stethoscope,
  Video,
  X,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AgendaConsultation } from '@/types/entities/agendaConsultation'

const FORMAT_CONFIG = {
  ONLINE: {
    className:
      'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
    label: 'Teleconsulta',
    icon: <Video className="mr-1 h-3 w-3" />,
  },
  PRESENCIAL: {
    className: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100',
    label: 'Presencial',
    icon: <Calendar className="mr-1 h-3 w-3" />,
  },
  PRESENTIAL: {
    className: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100',
    label: 'Presencial',
    icon: <Calendar className="mr-1 h-3 w-3" />,
  },
  IN_PERSON: {
    className: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100',
    label: 'Presencial',
    icon: <Calendar className="mr-1 h-3 w-3" />,
  },
} as const

const STATUS_CONFIG = {
  COMPLETED: {
    className: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    label: 'Concluído',
  },
  IN_PROGRESS: {
    className: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    label: 'Em progresso',
  },
  SCHEDULED: {
    className: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    label: 'Agendado',
  },
  CANCELLED: {
    className: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    label: 'Cancelado',
  },
} as const

interface ColumnCallbacks {
  onViewDetails?: (consultation: AgendaConsultation) => void
  onReschedule?: (consultation: AgendaConsultation) => void
  onCancel?: (consultationId: string) => void
  onStartConsultation?: (consultationId: string) => void
  onStartPresentialConsultation?: (consultationId: string) => void
}

export const getAppointmentsColumns = (
  callbacks?: ColumnCallbacks,
): ColumnDef<AgendaConsultation>[] => [
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
    accessorKey: 'patientName',
    header: 'Nome do Paciente',
    cell: ({ row }) => {
      const name = (row.getValue('patientName') as string) || 'Paciente'
      const parts = name.trim().split(' ').filter(Boolean)
      const initials =
        parts
          .map((part) => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'P'

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {/* {avatar && <AvatarImage src={avatar} alt={name} />} */}
            <AvatarFallback className="bg-purple-100 text-xs text-purple-700">
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
    header: 'Formato',
    cell: ({ row }) => {
      const format = (row.getValue('format') as string) || ''
      const normalizedFormat =
        format.toUpperCase() as keyof typeof FORMAT_CONFIG
      const config = FORMAT_CONFIG[normalizedFormat] ?? {
        className: 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
        label: format || 'Não informado',
        icon: <Calendar className="mr-1 h-3 w-3" />,
      }

      return (
        <Badge className={config.className}>
          {config.icon}
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = (row.getValue('status') as string) || ''
      const normalizedStatus =
        status.toUpperCase() as keyof typeof STATUS_CONFIG
      const config = STATUS_CONFIG[normalizedStatus] ?? STATUS_CONFIG.SCHEDULED

      return <Badge className={config.className}>{config.label}</Badge>
    },
  },
  {
    id: 'actions',
    header: () => (
      <div className="flex items-center justify-center">
        Ações
        <button className="ml-1 text-gray-500 hover:text-gray-700">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
            <text
              x="8"
              y="11"
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
            >
              ?
            </text>
          </svg>
        </button>
      </div>
    ),
    cell: ({ row }) => {
      const status = row.original.status
      const format = row.original.format?.toUpperCase()
      const isOnline = format === 'ONLINE'
      const isPresential =
        format === 'PRESENTIAL' ||
        format === 'PRESENCIAL' ||
        format === 'IN_PERSON'
      const consultation = row.original

      // Consultas finalizadas ou canceladas só mostram "Ver detalhes"
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        return (
          <div className="flex items-center justify-center">
            <Button
              variant="link"
              size="sm"
              className="text-purple-600 hover:text-purple-800"
              onClick={() => callbacks?.onViewDetails?.(consultation)}
            >
              Ver detalhes
            </Button>
          </div>
        )
      }

      // Em progresso + teleconsulta: botão para voltar à chamada (se fechou a aba sem querer)
      if (status === 'IN_PROGRESS' && isOnline) {
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="link"
              size="sm"
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
              onClick={() => callbacks?.onStartConsultation?.(consultation.id)}
            >
              <Video className="h-4 w-4" />
              Voltar à chamada
            </Button>
          </div>
        )
      }

      // Em progresso presencial: só "Ver detalhes"
      if (status === 'IN_PROGRESS') {
        return (
          <div className="flex items-center justify-center">
            <Button
              variant="link"
              size="sm"
              className="text-purple-600 hover:text-purple-800"
              onClick={() => callbacks?.onViewDetails?.(consultation)}
            >
              Ver detalhes
            </Button>
          </div>
        )
      }

      return (
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            title="Reagendar"
            onClick={() => callbacks?.onReschedule?.(consultation)}
          >
            <Clock className="h-4 w-4 text-purple-600" />
          </button>
          <button
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            title="Cancelar"
            onClick={() => callbacks?.onCancel?.(consultation.id)}
          >
            <X className="h-4 w-4 text-purple-600" />
          </button>
          {isOnline && (
            <button
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              title="Iniciar consulta"
              onClick={() => callbacks?.onStartConsultation?.(consultation.id)}
            >
              <Video className="h-4 w-4 text-purple-600" />
            </button>
          )}
          {isPresential && (
            <button
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              title="Iniciar consulta presencial"
              onClick={() =>
                callbacks?.onStartPresentialConsultation?.(consultation.id)
              }
            >
              <Stethoscope className="h-4 w-4 text-purple-600" />
            </button>
          )}
        </div>
      )
    },
  },
]

// Mantém compatibilidade com código existente
export const appointmentsColumns = getAppointmentsColumns()
