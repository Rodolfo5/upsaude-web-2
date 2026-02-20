/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { SuspendMedicationModal } from '@/components/organisms/Modals/SuspendMedicationModal/suspendMedicationModal'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useActiveMedicaments } from '@/hooks/queries/useActiveMedicaments'
import { useTreatmentAdherence } from '@/hooks/queries/useTreatmentAdherence'
import {
  MedicationEntity,
  MedicationCreationBy,
} from '@/types/entities/medicaments'
import { formatMedicationName, formatDosage } from '@/utils/formatMedication'

interface MedicamentsActiveCardProps {
  patientId: string
  className?: string
  isAdmin?: boolean
  isQRCodePendingDoctor?: boolean
}

export function MedicamentsActiveCard({
  patientId,
  className,
  isAdmin = false,
  isQRCodePendingDoctor = false,
}: MedicamentsActiveCardProps) {
  const {
    data: medicaments = [],
    isLoading,
    isError,
    error,
  } = useActiveMedicaments(patientId)

  const { isAdheringToTreatment, isLoading: adherenceLoading } =
    useTreatmentAdherence(patientId)

  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationEntity | null>(null)

  const isLoadingCombined = isLoading || adherenceLoading

  const handleSuspendMedication = (medication: MedicationEntity) => {
    setSelectedMedication(medication)
    setSuspendModalOpen(true)
  }

  if (isLoadingCombined) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-16 rounded bg-gray-200"></div>
            <div className="h-16 rounded bg-gray-200"></div>
            <div className="h-16 rounded bg-gray-200"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <div className="py-8 text-center">
          <p className="mb-4 text-red-500">Erro ao carregar medicamentos</p>
          <p className="text-sm text-gray-500">
            {(error as Error)?.message || 'Erro inesperado'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`rounded-3xl border-gray-200 p-6 ${className || ''}`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-brand-purple-dark-500">
            Medicamentos ativos
          </h2>
          <Badge
            variant="secondary"
            className={
              isAdheringToTreatment
                ? 'bg-green-100 font-medium text-green-700 hover:bg-green-100'
                : 'bg-yellow-100 font-medium text-yellow-700 hover:bg-yellow-100'
            }
          >
            {isAdheringToTreatment
              ? 'Paciente com adesão ao tratamento'
              : 'Paciente não está aderindo ao tratamento'}
          </Badge>
        </div>
      </div>

      {!isAdmin && !isQRCodePendingDoctor && (
        <div className="mb-6 flex w-full flex-col gap-3 lg:w-1/3 lg:flex-row">
          <Button variant="outline">
            Acessar lista completa de medicamentos
          </Button>
          <Button variant="outline">
            <EditOutlinedIcon fontSize="small" />
            Prescrever com Memed
          </Button>
        </div>
      )}
      <div
        className={`space-y-3 ${medicaments.length > 5 ? 'max-h-[360px] overflow-y-auto pr-2' : ''}`}
      >
        {medicaments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Nenhum medicamento ativo encontrado</p>
          </div>
        ) : (
          medicaments.map((medication: MedicationEntity) => (
            <MedicationItem
              key={medication.id}
              medication={medication}
              onSuspend={() => handleSuspendMedication(medication)}
              isQRCodePendingDoctor={isQRCodePendingDoctor}
            />
          ))
        )}
      </div>

      {selectedMedication && (
        <SuspendMedicationModal
          isOpen={suspendModalOpen}
          setIsOpen={setSuspendModalOpen}
          medicationName={`${selectedMedication.name} ${selectedMedication.concentration}${selectedMedication.concentrationUnit}`}
          userId={patientId}
          medicationId={selectedMedication.id}
          onClose={() => setSelectedMedication(null)}
        />
      )}
    </Card>
  )
}

interface MedicationItemProps {
  medication: MedicationEntity
  onSuspend: () => void
  isQRCodePendingDoctor?: boolean
}

function MedicationItem({
  medication,
  onSuspend,
  isQRCodePendingDoctor,
}: MedicationItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h3 className="font-medium text-gray-900">
              {formatMedicationName(medication as any)}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {formatDosage(medication as any)}
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <Badge className="flex justify-center rounded-full bg-purple-50 py-1 text-gray-800 shadow-[0_-2px_4px_rgba(0,0,0,0.1)] hover:bg-purple-50">
            {medication.createdBy === MedicationCreationBy.PATIENT
              ? 'Cadastrado'
              : 'Prescrito'}
          </Badge>
          {!isQRCodePendingDoctor && (
            <Button
              variant="link"
              size="sm"
              onClick={onSuspend}
              className="px-2 py-1"
            >
              Suspender uso
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
