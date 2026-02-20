'use client'

import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { useQueryClient } from '@tanstack/react-query'
import { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, CheckCircle, XCircle } from 'lucide-react'
import { useCallback, useState } from 'react'

import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { Button } from '@/components/ui/button'
import { getAllUsersQueryKey } from '@/hooks/queries/useAllUsers'
import { useDeleteUser } from '@/hooks/queries/useDeleteUser'
import { errorToast, successToast } from '@/hooks/useAppToast'
import { timestampToDate } from '@/lib/utils'
import { approveUser, rejectUser } from '@/services/firestore/user'
import { DoctorEntity, UserRole, UserStatus } from '@/types/entities/user'

import { DoctorDetailsModal } from './doctorDetailsModal'

const SortableHeader = ({
  column,
  title,
}: {
  column: Column<DoctorEntity, unknown>
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

const DeleteDoctor = ({ doctorId }: { doctorId: string }) => {
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
  const { mutate: deleteUser } = useDeleteUser()

  const handleDeleteUser = () => {
    deleteUser(doctorId)
    setIsDeleteUserOpen(false)
  }
  return (
    <div>
      <DeleteIcon onClick={() => setIsDeleteUserOpen(true)} />
      <ConfirmationModal
        isOpen={isDeleteUserOpen}
        setIsOpen={setIsDeleteUserOpen}
        title="Tem certeza que deseja excluir esse usuário?"
        content="Se você excluir esse usuário a ação será permanente e não poderá ser recuperada novamente."
        actionLabel="Excluir"
        action={() => handleDeleteUser()}
      />
    </div>
  )
}

const DetailsDoctor = ({ doctor }: { doctor: DoctorEntity }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  return (
    <div>
      <VisibilityOutlined onClick={() => setIsDetailsOpen(true)} />
      <DoctorDetailsModal
        doctor={doctor}
        isOpen={isDetailsOpen}
        setIsOpen={setIsDetailsOpen}
      />
    </div>
  )
}

const ApproveDoctorAction = ({ doctor }: { doctor: DoctorEntity }) => {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleApprove = useCallback(async () => {
    setIsLoading(true)
    try {
      await approveUser(doctor.id)

      await queryClient.invalidateQueries({
        queryKey: getAllUsersQueryKey(),
      })

      successToast('Médico aprovado com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar médico:', error)
      errorToast('Erro ao aprovar médico')
    } finally {
      setIsLoading(false)
      setIsApproveModalOpen(false)
    }
  }, [doctor.id, queryClient])

  const handleReject = useCallback(async () => {
    setIsLoading(true)
    try {
      await rejectUser(doctor.id)

      await queryClient.invalidateQueries({
        queryKey: getAllUsersQueryKey(),
      })

      successToast('Médico rejeitado')
    } catch (error) {
      console.error('Erro ao rejeitar médico:', error)
      errorToast('Erro ao rejeitar médico')
    } finally {
      setIsLoading(false)
      setIsRejectModalOpen(false)
    }
  }, [doctor.id, queryClient])

  const isPending = doctor.status === UserStatus.PENDING

  if (!isPending) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsApproveModalOpen(true)}
        disabled={isLoading}
        className="text-green-600 transition-colors hover:text-green-800 disabled:opacity-50"
        aria-label="Aprovar médico"
      >
        <CheckCircle className="h-6 w-6" />
      </button>
      <button
        onClick={() => setIsRejectModalOpen(true)}
        disabled={isLoading}
        className="text-red-600 transition-colors hover:text-red-800 disabled:opacity-50"
        aria-label="Rejeitar médico"
      >
        <XCircle className="h-6 w-6" />
      </button>

      <ConfirmationModal
        isOpen={isApproveModalOpen}
        setIsOpen={setIsApproveModalOpen}
        title="Aprovar Médico"
        content={`Você tem certeza que deseja aprovar ${doctor.name}? O médico será cadastrado na Memed automaticamente e poderá acessar o sistema.`}
        actionLabel="Aprovar"
        actionButtonVariant="success"
        action={handleApprove}
      />

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        setIsOpen={setIsRejectModalOpen}
        title="Rejeitar Médico"
        content={`Você tem certeza que deseja rejeitar ${doctor.name}? Esta ação não poderá ser desfeita.`}
        actionLabel="Rejeitar"
        actionButtonVariant="destructive"
        action={handleReject}
      />
    </>
  )
}

export const doctorColumns: ColumnDef<DoctorEntity>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="Nome" />,
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
  },
  {
    accessorKey: 'role',
    header: 'Função',
    cell: ({ row }) => {
      const role = row.original.role
      const variant =
        role === UserRole.ADMIN
          ? 'bg-purple-100 text-purple-800'
          : 'bg-gray-100 text-gray-800'

      return (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${variant}`}
        >
          {role}
        </span>
      )
    },
  },
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
    accessorKey: 'memedRegistered',
    header: 'Memed',
    cell: ({ row }) => {
      const doctor = row.original
      const isRegistered = doctor.memedRegistered || doctor.memedId

      return (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            isRegistered
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isRegistered ? 'Registrado' : 'Não registrado'}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => {
      const date = row.original.createdAt
      const dateStr = timestampToDate(date as any)
      return dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-'
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const doctor = row.original

      return (
        <section className="flex cursor-pointer flex-row gap-4">
          <ApproveDoctorAction doctor={doctor} />
          <DetailsDoctor doctor={doctor} />
          <DeleteDoctor doctorId={doctor.id} />
        </section>
      )
    },
  },
]
