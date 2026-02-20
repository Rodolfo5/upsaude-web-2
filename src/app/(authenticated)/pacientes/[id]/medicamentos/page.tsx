'use client'

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { EditMedicationModal } from '@/components/organisms/Modals/EditMedicationModal/editMedicationModal'
import { MedicationSuccessModal } from '@/components/organisms/Modals/MedicationSuccessModal/medicationSuccessModal'
import { useUpdateMedication } from '@/hooks/mutations/useUpdateMedication'
import { useMedications } from '@/hooks/queries/useMedications'
import { updateMedicationStatus } from '@/services/medication'
import { MedicationEntity, MedicationStatus } from '@/types/entities/medication'

import { makeMedicationColumns } from './columns'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function MedicationsPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: medications = [] } = useMedications(id)
  const updateMedicationMutation = useUpdateMedication(id)

  const [searchTerm, setSearchTerm] = useState('')

  const [isConfirmSuspendModalOpen, setIsConfirmSuspendModalOpen] =
    useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationEntity | null>(null)
  const [selectedMedicationForEdit, setSelectedMedicationForEdit] =
    useState<MedicationEntity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Mutation para suspender medicamento
  const suspendMutation = useMutation({
    mutationFn: async (medication: MedicationEntity) => {
      await updateMedicationStatus(
        id,
        medication.id,
        MedicationStatus.SUSPENDED,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', id] })
      setIsConfirmSuspendModalOpen(false)
      setIsSuccessModalOpen(true)
    },
    onError: (error) => {
      console.error('Erro ao suspender medicamento:', error)
      toast.error('Erro ao suspender medicamento. Tente novamente.')
    },
  })

  const filteredMedications = useMemo(() => {
    return medications.filter((medication) => {
      const matchesSearch = searchTerm
        ? medication.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      return matchesSearch
    })
  }, [medications, searchTerm])

  const handleSuspend = useCallback((medication: MedicationEntity) => {
    setSelectedMedication(medication)
    setIsConfirmSuspendModalOpen(true)
  }, [])

  const handleEdit = useCallback((medication: MedicationEntity) => {
    setSelectedMedicationForEdit(medication)
    setIsEditModalOpen(true)
  }, [])

  const handleConfirmSuspend = useCallback(() => {
    if (selectedMedication) {
      suspendMutation.mutate(selectedMedication)
    }
  }, [selectedMedication, suspendMutation])

  const handleSuccessBack = useCallback(() => {
    setSelectedMedication(null)
  }, [])

  const handleEditSave = useCallback(
    (updates: {
      medicationId: string
      usageClassification: string
      interval?: number
      intervalUnit?: string
      endDate?: Date
    }) => {
      const normalizedUpdates: Partial<MedicationEntity> = {
        usageClassification: updates.usageClassification,
        interval: updates.interval,
        intervalUnit: updates.intervalUnit,
        endDate: updates.endDate ? updates.endDate.toISOString() : undefined,
      }

      if (updates.usageClassification === 'Sintomático') {
        normalizedUpdates.interval = undefined
        normalizedUpdates.intervalUnit = undefined
        normalizedUpdates.endDate = undefined
      }

      if (updates.usageClassification === 'Uso contínuo') {
        normalizedUpdates.endDate = undefined
      }

      updateMedicationMutation.mutate(
        {
          medicationId: updates.medicationId,
          updates: normalizedUpdates,
        },
        {
          onSuccess: () => {
            setIsEditModalOpen(false)
            setSelectedMedicationForEdit(null)
            toast.success('Classificação atualizada com sucesso.')
          },
          onError: (error) => {
            console.error('Erro ao atualizar medicamento:', error)
            toast.error('Erro ao atualizar medicamento. Tente novamente.')
          },
        },
      )
    },
    [updateMedicationMutation],
  )

  const columns = useMemo(
    () => makeMedicationColumns(handleSuspend, handleEdit),
    [handleSuspend, handleEdit],
  )

  return (
    <div className="mt-8 px-4 sm:px-8 lg:px-20">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Button
          className="flex p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/pacientes/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Lista de medicamentos
        </Button>
        <Input
          icon={<Search className="h-5 w-5 text-primary-500" />}
          iconPosition="left"
          placeholder="Pesquisar medicamento"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-full border border-gray-200 text-primary-500 hover:bg-white sm:w-64"
        />
      </div>

      <div className="w-full">
        <DataTable
          columns={columns}
          data={filteredMedications as MedicationEntity[]}
        />
      </div>

      <ConfirmationModal
        isOpen={isConfirmSuspendModalOpen}
        setIsOpen={setIsConfirmSuspendModalOpen}
        title={`Suspender o uso de "${selectedMedication?.name}"`}
        description="Esta ação pode impactar o tratamento do paciente"
        action={handleConfirmSuspend}
        actionLabel="Sim, tenho certeza"
        cancelLabel="Não, cancelar"
        loading={suspendMutation.isPending}
      />

      <MedicationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onBack={handleSuccessBack}
      />

      <EditMedicationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        medication={selectedMedicationForEdit}
        onSave={handleEditSave}
        isSaving={updateMedicationMutation.isPending}
      />
    </div>
  )
}
