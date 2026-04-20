'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { Pencil as EditOutlinedIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { useMedications } from '@/hooks/queries/useMedications'
import useUser from '@/hooks/useUser'
import { updateMedicationStatus } from '@/services/medication'
import { linkMedicationsToPlan } from '@/services/therapeuticPlan'
import { MedicationEntity, MedicationStatus } from '@/types/entities/medication'

import { makeMedicationColumns } from './columns'
import { EmbeddedMemedPrescription } from './EmbeddedMemedPrescription/embeddedMemedPrescription'

interface MedicationsTabProps {
  patientId: string
  planId: string
}

export function MedicationsTab({ patientId, planId }: MedicationsTabProps) {
  const { currentUser } = useUser()
  const queryClient = useQueryClient()
  const {
    data: medications = [],
    isLoading,
    refetch,
  } = useMedications(patientId)

  const [searchTerm, setSearchTerm] = useState('')
  const [showMemedEmbed, setShowMemedEmbed] = useState(false)
  const [isConfirmSuspendModalOpen, setIsConfirmSuspendModalOpen] =
    useState(false)
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationEntity | null>(null)

  // Mutation para suspender medicamento
  const suspendMutation = useMutation({
    mutationFn: async (medication: MedicationEntity) => {
      await updateMedicationStatus(
        patientId,
        medication.id,
        MedicationStatus.SUSPENDED,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', patientId] })
      queryClient.invalidateQueries({
        queryKey: ['active-medicaments', patientId],
      })
      setIsConfirmSuspendModalOpen(false)
      toast.success('Medicamento suspenso com sucesso')
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

  const handleSuspend = (medication: MedicationEntity) => {
    setSelectedMedication(medication)
    setIsConfirmSuspendModalOpen(true)
  }

  const handleConfirmSuspend = () => {
    if (selectedMedication) {
      suspendMutation.mutate(selectedMedication)
    }
  }

  const handlePrescriptionSuccess = async (medicationIds: string[]) => {
    try {
      console.log('🔄 Processando sucesso da prescrição:', medicationIds)

      // Link medications to therapeutic plan
      if (medicationIds.length > 0) {
        await linkMedicationsToPlan(patientId, planId, medicationIds)
      }

      // Invalidate medications query to refresh the table and the patient medicaments card
      queryClient.invalidateQueries({
        queryKey: ['medications', patientId],
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: ['active-medicaments', patientId],
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: ['therapeuticPlan', patientId, planId],
        refetchType: 'active',
      })

      console.log('✅ Queries invalidadas, fazendo refetch...')

      // Aguardar um pouco para garantir que o Firestore tenha processado
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Fazer refetch explícito para garantir atualização
      await refetch()
      console.log('✅ Refetch concluído')

      // Hide Memed embed and show table
      setShowMemedEmbed(false)

      if (medicationIds.length > 0) {
        toast.success(
          `${medicationIds.length} medicamento(s) adicionado(s) com sucesso`,
        )
      } else {
        toast.warning(
          'Prescrição processada, mas nenhum medicamento foi encontrado',
        )
      }
    } catch (error) {
      console.error('❌ Erro ao vincular medicamentos ao plano:', error)
      toast.error('Erro ao vincular medicamentos ao plano')
    }
  }

  const columns = useMemo(
    () => makeMedicationColumns(handleSuspend),
    [handleSuspend],
  )

  // Show empty state if no medications
  if (!isLoading && medications.length === 0 && !showMemedEmbed) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6">
          <Image
            src="/ilustra-error.png"
            alt="Sem conteúdo disponível"
            width={300}
            height={300}
            className="mx-auto"
          />
        </div>
        <p className="mb-6 text-lg text-gray-600">
          Nenhuma medicação foi adicionada ao plano
        </p>
        <Button
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
          icon={<EditOutlinedIcon />}
          iconPosition="left"
          onClick={() => setShowMemedEmbed(true)}
        >
          Prescrever com Memed
        </Button>
      </div>
    )
  }

  // Show embedded Memed interface
  if (showMemedEmbed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-purple-600 hover:text-purple-700"
            onClick={() => setShowMemedEmbed(false)}
            icon={<ArrowBackOutlinedIcon />}
            iconPosition="left"
          >
            Voltar a medicamentos
          </Button>
        </div>
        {currentUser?.id && (
          <EmbeddedMemedPrescription
            doctorId={currentUser.id}
            patientId={patientId}
            onPrescriptionSuccess={handlePrescriptionSuccess}
            onClose={() => setShowMemedEmbed(false)}
          />
        )}
      </div>
    )
  }

  // Show medications table
  return (
    <div className="space-y-6">
      {/* Header with title and adherence badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medicamentos</h2>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Paciente com adesão ao tratamento
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
            icon={<EditOutlinedIcon />}
            iconPosition="left"
            onClick={() => setShowMemedEmbed(true)}
          >
            Prescrever com Memed
          </Button>
        </div>
      </div>

      {/* Search input */}
      <div className="flex justify-end">
        <Input
          icon={<Search className="h-5 w-5 text-gray-400" />}
          iconPosition="left"
          placeholder="Pesquisar medicamento"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm border-gray-200"
        />
      </div>

      {/* Medications table */}
      <DataTable
        columns={columns}
        data={filteredMedications as MedicationEntity[]}
        pageSize={10}
      />

      {/* Confirmation modal for suspending medication */}
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
    </div>
  )
}
