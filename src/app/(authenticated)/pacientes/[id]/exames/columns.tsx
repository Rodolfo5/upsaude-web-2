'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExamEntity } from '@/types/entities/exam'
import { DoctorEntity } from '@/types/entities/user'

export function getDoctorName(
  exam: ExamEntity,
  doctorMap?: Map<string, DoctorEntity>,
) {
  // Primeiro tenta buscar em doctorData (dados salvos do rawData)
  if (exam.doctorData?.nome_medico) {
    return exam.doctorData.nome_medico
  }

  // Estrutura normalizada: rawData.prescriber.name
  if (exam.rawData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = exam.rawData as any
    if (rawData?.prescriber?.name) return rawData.prescriber.name

    // Fallback: estrutura antiga (dados antes da normalização)
    const nomeMedico =
      rawData?.data?.attributes?.medico?.nome_medico ||
      rawData?.data?.attributes?.nome_medico
    if (nomeMedico) return nomeMedico
  }

  // Fallback: busca no doctorMap
  if (exam.doctorId && doctorMap) {
    const doctor = doctorMap.get(exam.doctorId)
    if (doctor?.name) return doctor.name
  }

  return '-'
}

export function getDoctorCouncil(
  exam: ExamEntity,
  doctorMap?: Map<string, DoctorEntity>,
) {
  // Primeiro tenta buscar em doctorData (dados salvos do rawData)
  if (exam.doctorData?.board) {
    // Dados vêm da API Memed em snake_case
    const {
      board_code: boardCode,
      board_number: boardNumber,
      board_state: boardState,
    } = exam.doctorData.board
    const council =
      `${boardCode || ''} ${boardNumber || ''} ${boardState || ''}`.trim()
    if (council) return council
  }

  // Estrutura normalizada: rawData.prescriber.council
  if (exam.rawData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = exam.rawData as any
    const prescriberCouncil = rawData?.prescriber?.council
    if (prescriberCouncil) {
      const council =
        `${prescriberCouncil.code || ''} ${prescriberCouncil.number || ''} ${prescriberCouncil.state || ''}`.trim()
      if (council) return council
    }

    // Fallback: estrutura antiga (dados antes da normalização)
    const board =
      rawData?.data?.attributes?.medico?.board ||
      rawData?.data?.attributes?.board
    if (board) {
      const council =
        `${board.board_code || ''} ${board.board_number || ''} ${board.board_state || ''}`.trim()
      if (council) return council
    }
  }

  // Fallback: busca no doctorMap
  if (exam.doctorId && doctorMap) {
    const doctor = doctorMap.get(exam.doctorId)
    if (doctor) {
      const council =
        `${doctor.typeOfCredential || ''} ${doctor.credential || ''} ${doctor.state || ''}`.trim()
      if (council) return council
    }
  }

  return '-'
}

export function makeExamColumns(
  id: string,
  router: { push: (url: string) => void },
  doctorMap?: Map<string, DoctorEntity>,
): ColumnDef<ExamEntity>[] {
  return [
    {
      accessorKey: 'requestDate',
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
        const v = row.getValue('requestDate') as Date | string
        if (!v) return '-'
        const dt = v instanceof Date ? v : new Date(String(v))
        return <div>{format(dt, 'dd/MM/yyyy', { locale: ptBR })}</div>
      },
    },
    {
      accessorKey: 'completionDate',
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
        const v = row.getValue('completionDate') as Date | string | null
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
        return v === String(filterValue)
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const label = status === 'completed' ? 'Realizado' : 'Solicitado'
        const color =
          status === 'completed'
            ? 'text-success-600 bg-green-200 hover:bg-green-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        return <Badge className={`${color} shadow-none`}>{label}</Badge>
      },
    },
    {
      accessorKey: 'doctorName',
      header: 'Profissional solicitante',
      cell: ({ row }) => {
        const exam = row.original as ExamEntity
        const name = getDoctorName(exam, doctorMap)
        return <div>{name}</div>
      },
    },
    {
      accessorKey: 'council',
      header: 'Conselho',
      cell: ({ row }) => {
        const exam = row.original as ExamEntity
        const council = getDoctorCouncil(exam, doctorMap)
        return <div>{council}</div>
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const exam = row.original
        return (
          <Button
            variant="link"
            className="text-purple-600 hover:text-purple-800 hover:no-underline"
            onClick={() => {
              router.push(`/pacientes/${id}/exames/${exam.id}`)
            }}
          >
            Ver resultado
          </Button>
        )
      },
    },
  ]
}
