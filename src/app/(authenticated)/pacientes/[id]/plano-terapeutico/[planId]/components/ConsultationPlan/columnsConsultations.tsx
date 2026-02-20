'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/ui/button'
import { useDoctor } from '@/hooks/queries/useDoctor'
import { AgendaConsultation } from '@/types/entities/agendaConsultation'

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

function DoctorCell({
  doctorId,
  field,
}: {
  doctorId?: string | null
  field: 'name' | 'specialty'
}) {
  const { name, specialty, isLoading } = useDoctor(doctorId)

  if (!doctorId) return <div>-</div>
  if (isLoading) return <div>...</div>

  const value = field === 'name' ? name : specialty
  if (!value) return <div>-</div>
  return <div>{value}</div>
}

export const getConsultationPlanColumns =
  (): ColumnDef<AgendaConsultation>[] => {
    return [
      {
        accessorKey: 'date',
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
          const date = row.getValue('date') as Date
          if (!date) return <div>-</div>
          return (
            <div className="font-medium">
              {format(date, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.getValue('date') as Date
          const dateB = rowB.getValue('date') as Date
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return dateA.getTime() - dateB.getTime()
        },
      },
      {
        accessorKey: 'doctorName',
        header: 'Profissional',
        cell: ({ row }) => {
          const name = row.getValue('doctorName') as string | undefined
          if (name) return <div>{name}</div>

          const doctorId = (row.original as AgendaConsultation)?.doctorId as
            | string
            | undefined
          return <DoctorCell doctorId={doctorId} field="name" />
        },
      },
      {
        accessorKey: 'specialty',
        header: 'Especialidade',
        cell: ({ row }) => {
          const s = row.getValue('specialty') as string | undefined
          if (s) return <div>{s}</div>

          const doctorId = (row.original as AgendaConsultation)?.doctorId as
            | string
            | undefined
          return <DoctorCell doctorId={doctorId} field="specialty" />
        },
      },
      {
        accessorKey: 'consultationType',
        header: 'Tipo de consulta',
        cell: ({ row }) => {
          const consultation = row.original
          const category = consultation.planId ? 'Plano' : 'Avulso'
          return (
            <div>
              <span
                className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${
                  category === 'Plano'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {category}
              </span>
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => {
          const consultation = row.original
          return <ViewDetailsButton consultationId={consultation.id} />
        },
      },
    ]
  }
