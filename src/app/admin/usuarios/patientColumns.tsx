'use client'

import { Trash2 as DeleteIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Ban, ClipboardPlus, Eye, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useState } from 'react'

import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { Button } from '@/components/ui/button'
import { getAllUsersQueryKey } from '@/hooks/queries/useAllUsers'
import { useDeleteUser } from '@/hooks/queries/useDeleteUser'
import { errorToast, successToast } from '@/hooks/useAppToast'
import { timestampToDate } from '@/lib/utils'
import { updateUserDoc } from '@/services/user'
import { PatientEntity, UserStatus } from '@/types/entities/user'

import { PatientDetailsModal } from './patientDetailsModal'

const SortableHeader = ({
  column,
  title,
}: {
  column: Column<PatientEntity, unknown>
  title: string
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

const ViewPatientDetails = memo(({ patient }: { patient: PatientEntity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpen = useCallback(() => setIsModalOpen(true), [])

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-blue-600 transition-colors hover:text-blue-800"
        aria-label="Visualizar/Editar detalhes do paciente"
      >
        <Eye className="h-6 w-6" />
      </button>
      <PatientDetailsModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        patient={patient}
      />
    </>
  )
})

function ViewMedicalRecordButton({ patientId }: { patientId: string }) {
  const router = useRouter()

  return (
    <Button
      variant="link"
      size="sm"
      className="text-purple-600 hover:text-purple-800"
      onClick={() => router.push(`/admin/medical-record/${patientId}`)}
    >
      <ClipboardPlus className="h-8 w-8" />
    </Button>
  )
}

ViewPatientDetails.displayName = 'ViewPatientDetails'

const TogglePatientStatus = memo(({ patient }: { patient: PatientEntity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleOpen = useCallback(() => setIsModalOpen(true), [])

  const isSuspended = patient.status === UserStatus.SUSPENDED

  const handleToggleStatus = useCallback(async () => {
    const newStatus = isSuspended ? UserStatus.APPROVED : UserStatus.SUSPENDED

    try {
      const { error } = await updateUserDoc(patient.id, {
        status: newStatus,
      })

      if (error) {
        errorToast(`Erro ao ${isSuspended ? 'reativar' : 'suspender'} paciente`)
        return
      }

      await queryClient.invalidateQueries({
        queryKey: getAllUsersQueryKey(),
      })

      successToast(
        `Paciente ${isSuspended ? 'reativado' : 'suspenso'} com sucesso!`,
      )
    } catch (error) {
      console.error('Erro ao atualizar status do paciente:', error)
      errorToast(`Erro ao ${isSuspended ? 'reativar' : 'suspender'} paciente`)
    } finally {
      setIsModalOpen(false)
    }
  }, [patient.id, isSuspended, queryClient])

  return (
    <>
      <button
        onClick={handleOpen}
        className={
          isSuspended
            ? 'text-green-600 transition-colors hover:text-green-800'
            : 'text-orange-600 transition-colors hover:text-orange-800'
        }
        aria-label={
          isSuspended
            ? 'Reativar acesso do paciente'
            : 'Suspender acesso do paciente'
        }
      >
        {isSuspended ? (
          <UserCheck className="h-6 w-6" />
        ) : (
          <Ban className="h-6 w-6" />
        )}
      </button>
      <ConfirmationModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        title={
          isSuspended
            ? 'Reativar Acesso do Paciente'
            : 'Suspender Acesso do Paciente'
        }
        content={
          isSuspended
            ? 'Você tem certeza que deseja reativar o acesso desse paciente? O paciente poderá acessar o sistema novamente.'
            : 'Você tem certeza que deseja suspender o acesso desse paciente? O paciente não conseguirá mais acessar o sistema.'
        }
        actionLabel={isSuspended ? 'Reativar' : 'Suspender'}
        actionButtonVariant={isSuspended ? 'success' : 'destructive'}
        action={handleToggleStatus}
      />
    </>
  )
})

TogglePatientStatus.displayName = 'TogglePatientStatus'

const DeletePatient = memo(({ patientId }: { patientId: string }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { mutate: deleteUser } = useDeleteUser()

  const handleOpen = useCallback(() => setIsDeleteModalOpen(true), [])

  const handleDeletePatient = useCallback(() => {
    deleteUser(patientId)
    setIsDeleteModalOpen(false)
  }, [deleteUser, patientId])

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="ghost"
        className="ml-12 text-red-600 transition-colors hover:text-red-800"
        aria-label="Excluir paciente"
      >
        <DeleteIcon />
      </Button>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Tem certeza que deseja excluir esse paciente?"
        content="Se você excluir esse paciente, a ação será permanente e não poderá ser recuperada novamente."
        actionLabel="Excluir"
        actionButtonVariant="destructive"
        action={handleDeletePatient}
      />
    </>
  )
})

DeletePatient.displayName = 'DeletePatient'

export const patientColumns: ColumnDef<PatientEntity>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Nome" />,
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
  },
  // {
  //   accessorKey: 'role',
  //   header: 'Função',
  //   cell: ({ row }) => {
  //     const role = row.original.role
  //     const variant =
  //       role === UserRole.ADMIN
  //         ? 'bg-purple-100 text-purple-800'
  //         : 'bg-gray-100 text-gray-800'

  //     return (
  //       <span
  //         className={`rounded-full px-2 py-1 text-xs font-medium ${variant}`}
  //       >
  //         {role}
  //       </span>
  //     )
  //   },
  // },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const statusConfig = {
        [UserStatus.PENDING]: {
          label: 'Pendente',
          className: 'bg-yellow-100 text-yellow-800',
        },
        [UserStatus.APPROVED]: {
          label: 'Aprovado',
          className: 'bg-green-100 text-green-800',
        },
        [UserStatus.REJECTED]: {
          label: 'Rejeitado',
          className: 'bg-red-100 text-red-800',
        },
        [UserStatus.SUSPENDED]: {
          label: 'Suspenso',
          className: 'bg-orange-100 text-orange-800',
        },
      }

      const config =
        statusConfig[status as UserStatus] || statusConfig[UserStatus.PENDING]

      return (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => {
      const date = row.original.createdAt
      const dateObj = timestampToDate(
        date as unknown as Parameters<typeof timestampToDate>[0],
      )
      return dateObj ? dateObj.toLocaleDateString('pt-BR') : '-'
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const patient = row.original

      return (
        <section className="flex flex-row items-center gap-2">
          <ViewMedicalRecordButton patientId={patient.id} />
          <ViewPatientDetails patient={patient} />
          <TogglePatientStatus patient={patient} />
          <DeletePatient patientId={patient.id} />
        </section>
      )
    },
  },
]
