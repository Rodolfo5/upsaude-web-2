'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown, Calendar, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

function ViewDetailsButton({ consultationId }: { consultationId: string }) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      size="sm"
      className="text-purple-600 hover:text-purple-800"
      onClick={() =>
        router.push(`/agenda/consultation-history/${consultationId}`)
      }
    >
      Ver detalhes
    </Button>
  )
}

export const getConsultationHistoryColumns =
  (): ColumnDef<AgendaConsultation>[] => [
    {
      accessorKey: 'date',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data de realização
            <ArrowUpDown className="h-4 w-4" />
          </button>
        )
      },
      cell: ({ row }) => {
        const date = row.getValue('date') as Date
        return (
          <div className="font-medium">
            {format(date, 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.getValue('date') as Date
        const dateB = rowB.getValue('date') as Date
        return dateA.getTime() - dateB.getTime()
      },
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
          className:
            'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
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
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const consultation = row.original

        return (
          <div className="flex items-center justify-center">
            <ViewDetailsButton consultationId={consultation.id} />
          </div>
        )
      },
    },
  ]
