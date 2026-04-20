'use client'

import { Plus as AddOutlinedIcon } from 'lucide-react'
import { Trash2 as DeleteOutlineIcon } from 'lucide-react'
import { Pencil as EditOutlinedIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { DiagnosticModal } from '@/components/organisms/Modals/DiagnosticModal/diagnosticModal'
import { Badge } from '@/components/ui/badge'
import {
  useDiagnostics,
  useDeleteDiagnostic,
} from '@/hooks/queries/useDiagnostics'
import { DiagnosticEntity } from '@/types/entities/diagnostic'

interface DiagnosticsTableProps {
  patientId: string
  planId: string
}

export function DiagnosticsTable({ patientId, planId }: DiagnosticsTableProps) {
  const { data: diagnostics = [], isLoading } = useDiagnostics(
    patientId,
    planId,
  )
  const { mutateAsync: deleteDiagnostic, isPending: isDeleting } =
    useDeleteDiagnostic()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDiagnostic, setSelectedDiagnostic] =
    useState<DiagnosticEntity | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [diagnosticToDelete, setDiagnosticToDelete] =
    useState<DiagnosticEntity | null>(null)

  const formatDate = (date: Date | string) => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      return new Intl.DateTimeFormat('pt-BR').format(d)
    } catch {
      return '-'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      Ativo: 'bg-blue-100 text-blue-800 border-blue-200',
      Resolvido: 'bg-green-100 text-green-800 border-green-200',
      Descartado: 'bg-red-100 text-red-800 border-red-200',
      'Em remissão': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getCategoryBadgeColor = () => {
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const handleEdit = (diagnostic: DiagnosticEntity) => {
    setSelectedDiagnostic(diagnostic)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (diagnostic: DiagnosticEntity) => {
    setDiagnosticToDelete(diagnostic)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!diagnosticToDelete) return

    try {
      await deleteDiagnostic({
        patientId,
        planId,
        diagnosticId: diagnosticToDelete.id,
      })
      setDeleteModalOpen(false)
      setDiagnosticToDelete(null)
    } catch (error) {
      console.error('Erro ao deletar diagnóstico:', error)
    }
  }

  const handleCreateNew = () => {
    setSelectedDiagnostic(null)
    setIsModalOpen(true)
  }

  const columns: ColumnDef<DiagnosticEntity>[] = [
    {
      accessorKey: 'registeredAt',
      header: 'Data de registro',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {formatDate(row.original.registeredAt)}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'cid',
      header: 'CID',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.cid}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`${getStatusBadgeColor(row.original.status)} border px-2 py-1 text-xs font-medium`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`${getCategoryBadgeColor()} border px-2 py-1 text-xs font-medium`}
        >
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'registeredBy',
      header: 'Registrado por',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.registeredBy}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleEdit(row.original)}
            className="text-purple-600 hover:text-purple-800"
            title="Editar"
            variant="ghost"
          >
            <EditOutlinedIcon fontSize="small" />
          </Button>
          <Button
            onClick={() => handleDeleteClick(row.original)}
            className="text-red-600 hover:text-red-800"
            title="Deletar"
            variant="ghost"
          >
            <DeleteOutlineIcon fontSize="small" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Carregando diagnósticos...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-primary-700">
              Gerenciamento de Diagnósticos
            </h3>
            <p className="text-sm text-gray-600">
              Visualize, classifique e resolva diagnósticos para apoiar a
              condução do tratamento
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
          >
            <AddOutlinedIcon fontSize="small" />
            Cadastrar diagnóstico
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={diagnostics}
          searchColumns={['name', 'registeredBy']}
          searchInputPlaceholder="Pesquisar por nome ou médico..."
        />
      </div>

      <DiagnosticModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        patientId={patientId}
        planId={planId}
        diagnostic={selectedDiagnostic}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este diagnóstico?"
        content={
          diagnosticToDelete
            ? `Diagnóstico: ${diagnosticToDelete.name} (${diagnosticToDelete.cid})`
            : ''
        }
        actionLabel="Excluir"
        actionButtonVariant="destructive"
        action={handleDeleteConfirm}
        loading={isDeleting}
      />
    </>
  )
}
