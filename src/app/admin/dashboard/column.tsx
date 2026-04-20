'use client'

import { Trash2 as DeleteIcon } from 'lucide-react'
import { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { Button } from '@/components/ui/button'
import { useDeleteUser } from '@/hooks/queries/useDeleteUser'
import { UserEntity, UserRole } from '@/types/entities/user'

const SortableHeader = ({
  column,
  title,
}: {
  column: Column<UserEntity, unknown>
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

const DeleteUser = ({ patientId }: { patientId: string }) => {
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
  const { mutate: deleteUser } = useDeleteUser()

  const handleDeleteUser = () => {
    deleteUser(patientId)
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

export const usersColumns: ColumnDef<UserEntity>[] = [
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
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => {
      const date = row.original.createdAt
      return date ? new Date(date).toLocaleDateString('pt-BR') : '-'
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const patient = row.original

      return (
        <section className="flex flex-row">
          <DeleteUser patientId={patient.id} />
        </section>
      )
    },
  },
]
