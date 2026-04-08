import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import useAllConsultations from '@/hooks/queries/useAllConsultations'
import { findDoctorById } from '@/services/doctor'

type PatientConsultationRow = {
  id: string
  date: Date
  status: string
  format: string
  hour?: string
  doctorId?: string
  doctorName?: string
}

interface PatientConsultationsTableProps {
  patientId: string
  tableTitle?: string
  tableDescription?: string
  className?: string
}

const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    SCHEDULED: 'Agendada',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
    IN_PROGRESS: 'Em andamento',
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendente',
  }
  return statusMap[status.toUpperCase()] || status
}

const translateFormat = (formatValue?: string): string => {
  if (!formatValue) return '—'
  const normalized = formatValue.toUpperCase()
  if (normalized === 'PRESENCIAL' || normalized === 'PRESENTIAL') {
    return 'Consulta presencial'
  }
  if (normalized === 'ONLINE') {
    return 'Teleconsulta'
  }
  return formatValue
}

export default function PatientConsultationsTable({
  patientId,
  tableTitle = 'Consultas do paciente',
  tableDescription = 'Histórico recente de atendimentos deste paciente.',
  className,
}: PatientConsultationsTableProps) {
  const { data: allConsultations } = useAllConsultations()
  const router = useRouter()
  const [doctorNamesMap, setDoctorNamesMap] = useState<Map<string, string>>(
    new Map(),
  )

  useEffect(() => {
    const fetchDoctorNames = async () => {
      if (!allConsultations) return

      const doctorIds = [
        ...new Set(
          allConsultations
            .filter((c) => c.patientId === patientId && c.doctorId)
            .map((c) => c.doctorId!)
            .filter(Boolean),
        ),
      ]

      const namesMap = new Map<string, string>()
      await Promise.all(
        doctorIds.map(async (doctorId) => {
          try {
            const doctor = await findDoctorById(doctorId)
            if (doctor?.name) {
              namesMap.set(doctorId, doctor.name)
            }
          } catch (error) {
            console.error(`Erro ao buscar doutor ${doctorId}:`, error)
          }
        }),
      )

      setDoctorNamesMap(namesMap)
    }

    fetchDoctorNames()
  }, [allConsultations, patientId])

  const consultationColumns: ColumnDef<PatientConsultationRow>[] = useMemo(
    () => [
      {
        header: 'Data',
        accessorKey: 'date',
        cell: ({ row }) => format(row.original.date, 'dd/MM/yyyy'),
      },
      {
        header: 'Horário',
        accessorKey: 'hour',
        cell: ({ row }) => row.original.hour || '—',
      },
      {
        header: 'Dr(a)',
        accessorKey: 'doctorName',
        cell: ({ row }) => row.original.doctorName || '—',
      },
      {
        header: 'Formato',
        accessorKey: 'format',
        cell: ({ row }) => translateFormat(row.original.format),
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => translateStatus(row.original.status),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="link"
            className="text-[#530570]"
            onClick={() =>
              router.push(`/agenda/consultation-history/${row.original.id}`)
            }
          >
            Ver detalhes
          </Button>
        ),
      },
    ],
    [router],
  )

  const patientConsultations: PatientConsultationRow[] = useMemo(
    () =>
      allConsultations
        ?.filter((c) => c.patientId === patientId && c.date instanceof Date)
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((c) => ({
          id: c.id,
          date: c.date as Date,
          status: c.status,
          format: c.format,
          hour: c.hour,
          doctorId: c.doctorId,
          doctorName: c.doctorId ? doctorNamesMap.get(c.doctorId) : undefined,
        })) || [],
    [allConsultations, patientId, doctorNamesMap],
  )

  return (
    <div className={className ?? 'mt-6'}>
      <DataTable
        tableTitle={tableTitle}
        tableDescription={tableDescription}
        columns={consultationColumns}
        data={patientConsultations}
        pageSize={5}
      />
    </div>
  )
}
