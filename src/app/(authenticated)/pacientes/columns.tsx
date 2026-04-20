'use client'

import { FileText as DescriptionOutlinedIcon } from 'lucide-react'
import { Pill as MedicationOutlinedIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/atoms/Button/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { timestampToDate } from '@/lib/utils'
import { PatientEntity } from '@/types/entities/user'

type PatientWithType = PatientEntity & {
  patientType: 'acompanhamento' | 'complementar'
  hasPendingCheckup?: boolean
  isNotAdheringToMedication?: boolean
}

type TimestampLike = { seconds: number; nanoseconds?: number }

function ViewDetailsButton({ patientId }: { patientId: string }) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      size="sm"
      className="text-purple-600 hover:text-purple-800"
      onClick={() => router.push(`/pacientes/${patientId}`)}
    >
      Ver detalhes
    </Button>
  )
}

function ViewMedicalRecordButton({ patientId }: { patientId: string }) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      size="sm"
      className="text-purple-600 hover:text-purple-800"
      onClick={() => router.push(`/medical-record/${patientId}`)}
    >
      Ver Prontuário
    </Button>
  )
}

export const patientsColumns: ColumnDef<PatientWithType>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'alerts',
    header: 'Alertas',
    cell: ({ row }) => {
      const hasPendingCheckup = row.original.hasPendingCheckup
      const isNotAdheringToMedication = row.original.isNotAdheringToMedication

      const content = (
        <div className="flex gap-2">
          <DescriptionOutlinedIcon
            className={`h-4 w-4 ${hasPendingCheckup ? 'text-red-500' : 'text-gray-200'}`}
          />
          <MedicationOutlinedIcon
            className={`h-4 w-4 ${isNotAdheringToMedication ? 'text-red-500' : 'text-gray-200'}`}
          />
        </div>
      )

      if (hasPendingCheckup || isNotAdheringToMedication) {
        const tooltipMessages: string[] = []
        if (hasPendingCheckup) {
          tooltipMessages.push('Paciente está com o Check-up pendente')
        }
        if (isNotAdheringToMedication) {
          tooltipMessages.push('Paciente não está aderindo à medicação')
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent className="bg-black text-white">
              {tooltipMessages.map((msg) => (
                <p key={msg}>{msg}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        )
      }

      return content
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nome
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      const avatar = row.original.profileImage
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {avatar && <AvatarImage src={avatar} alt={name} />}
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
    accessorKey: 'type',
    header: 'Tipo de Paciente',
    cell: ({ row }) => {
      const patientType = row.original.patientType

      return (
        <Badge
          className={
            patientType === 'acompanhamento'
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
          }
        >
          {patientType === 'acompanhamento' ? 'Acompanhamento' : 'Complementar'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'age',
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Idade
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => {
      const birthDate = row.original.birthDate
      if (!birthDate) return '-'
      const dateObj = timestampToDate(
        birthDate as unknown as Date | string,
      )

      const age = dateObj
        ? new Date().getFullYear() - new Date(dateObj).getFullYear()
        : '-'
      return <span>{age} anos</span>
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span>{row.original.email}</span>,
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      return (
        <div className="flex flex-row gap-2">
          <ViewDetailsButton patientId={row.original.id} />
          <ViewMedicalRecordButton patientId={row.original.id} />
        </div>
      )
    },
  },
]
