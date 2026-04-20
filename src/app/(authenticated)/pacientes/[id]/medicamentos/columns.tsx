'use client'

import { X as CloseIcon } from 'lucide-react'
import { ClipboardList as MedicalInformationOutlinedIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MedicationEntity,
  MedicationStatus,
  MedicationCreationBy,
} from '@/types/entities/medication'
import {
  formatMedicationName,
  formatInstructions,
  getStatusBadge,
  getTypeBadge,
} from '@/utils/formatMedication'

/**
 * Verifica se o medicamento tem baixa adesão
 * (quando o paciente não está marcando que está tomando)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasLowAdherence(medication: MedicationEntity): boolean {
  // TODO: Implementar lógica real de verificação de adesão
  // Por enquanto, retornamos false
  // A lógica deve verificar se o paciente está marcando regularmente
  // que está tomando o medicamento nos horários programados
  return false
}

export function makeMedicationColumns(
  onSuspend: (medication: MedicationEntity) => void,
  onEdit: (medication: MedicationEntity) => void,
): ColumnDef<MedicationEntity>[] {
  return [
    {
      accessorKey: 'adherence',
      header: 'Adesão',
      cell: ({ row }) => {
        const medication = row.original
        const lowAdherence = hasLowAdherence(medication)
        return (
          <div className="flex items-center justify-center">
            <MedicalInformationOutlinedIcon
              className={lowAdherence ? 'text-red-600' : 'text-gray-400'}
              fontSize="small"
            />
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Nome e dosagem',
      cell: ({ row }) => {
        const medication = row.original
        return (
          <div className="font-medium">{formatMedicationName(medication)}</div>
        )
      },
    },
    {
      accessorKey: 'instructions',
      header: 'Orientação',
      cell: ({ row }) => {
        const medication = row.original
        return (
          <div className="text-sm text-gray-600">
            {formatInstructions(medication)}
          </div>
        )
      },
    },
    {
      accessorKey: 'usageClassification',
      header: 'Classificação de uso',
      cell: ({ row }) => {
        const medication = row.original
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {medication.usageClassification || '-'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(medication)}
              className="h-7 px-2 text-xs text-purple-600 hover:bg-purple-50"
            >
              Editar
            </Button>
          </div>
        )
      },
      enableSorting: false,
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
        const medication = row.original
        const { label, className } = getStatusBadge(medication.status)
        return <Badge className={`${className} shadow-none`}>{label}</Badge>
      },
      sortingFn: (rowA, rowB) => {
        const statusOrder = {
          [MedicationStatus.ACTIVE]: 0,
          [MedicationStatus.SUSPENDED]: 1,
          [MedicationStatus.CLOSED]: 2,
          [MedicationStatus.CREATED]: 3,
        }
        const statusA = statusOrder[rowA.original.status] ?? 999
        const statusB = statusOrder[rowB.original.status] ?? 999
        return statusA - statusB
      },
    },
    {
      accessorKey: 'createdBy',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tipo
            <ArrowUpDown className="h-4 w-4" />
          </button>
        )
      },
      cell: ({ row }) => {
        const medication = row.original
        const { label, className } = getTypeBadge(
          medication.createdBy,
          medication.memedId,
        )
        return <Badge className={`${className} shadow-none`}>{label}</Badge>
      },
      sortingFn: (rowA, rowB) => {
        const typeOrder = {
          [MedicationCreationBy.DOCTOR]: 0,
          [MedicationCreationBy.PATIENT]: 1,
        }
        const typeA = typeOrder[rowA.original.createdBy] ?? 999
        const typeB = typeOrder[rowB.original.createdBy] ?? 999
        return typeA - typeB
      },
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data de início
            <ArrowUpDown className="h-4 w-4" />
          </button>
        )
      },
      cell: ({ row }) => {
        const medication = row.original
        if (!medication.startDate) return <div>-</div>

        // Tentar converter a data de forma segura
        let startDate: Date
        try {
          startDate = new Date(medication.startDate)

          // Verificar se a data é válida
          if (isNaN(startDate.getTime())) {
            return <div>-</div>
          }
        } catch (error) {
          console.error('Erro ao converter startDate:', error)
          return <div>-</div>
        }

        const formattedDate = format(startDate, 'dd/MM/yyyy', { locale: ptBR })

        // Se tiver endDate, mostrar linha do tempo visual
        if (medication.endDate) {
          try {
            const endDate = new Date(medication.endDate)

            // Verificar se a data é válida
            if (isNaN(endDate.getTime())) {
              return <div>{formattedDate}</div>
            }

            return (
              <div className="flex items-center gap-2">
                <span>{formattedDate}</span>
              </div>
            )
          } catch (error) {
            console.error('Erro ao processar endDate:', error)
            return <div>{formattedDate}</div>
          }
        }

        return <div>{formattedDate}</div>
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.startDate
          ? new Date(rowA.original.startDate).getTime()
          : 0
        const dateB = rowB.original.startDate
          ? new Date(rowB.original.startDate).getTime()
          : 0
        return dateA - dateB
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const medication = row.original
        const isActive = medication.status === MedicationStatus.ACTIVE

        if (!isActive) {
          return <div></div>
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSuspend(medication)}
            className="whitespace-nowrap text-xs text-purple-600 hover:bg-purple-50"
          >
            <CloseIcon fontSize="large" />
          </Button>
        )
      },
    },
  ]
}
