import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import Select from '@/components/atoms/Select/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCombinedPatientsByDoctor } from '@/hooks/queries/usePatientsByDoctor'

import { AddChatModalProps } from './types'

export function AddChatModal({
  isOpen,
  setIsOpen,
  title,
  description,
  content,
  icon,
  action,
  actionLabel,
  actionButtonVariant = 'success',
  cancelLabel = 'Cancelar',
  loading,
  excludePatientIds = [],
}: AddChatModalProps) {
  const { data: patients, isLoading: isLoadingPatients } =
    useCombinedPatientsByDoctor()
  const [selectedPatientId, setSelectedPatientId] = useState('')

  const patientOptions =
    patients
      ?.filter((patient) => !excludePatientIds.includes(patient.id))
      .map((patient) => ({
        label: patient.name || patient.email || patient.id,
        value: patient.id,
      })) || []

  const handleAction = () => {
    if (selectedPatientId) {
      action(selectedPatientId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader className="items-center text-center text-[#792EBD]">
          {icon && (
            <div className="mb-2 rounded-full bg-gray-100 p-2 text-gray-600">
              {icon}
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {content && (
          <div className="py-4 text-center text-sm text-gray-600">
            {content}
          </div>
        )}

        <div className="py-4">
          <Select
            options={patientOptions}
            value={selectedPatientId}
            onChange={setSelectedPatientId}
            placeholder={
              isLoadingPatients
                ? 'Carregando pacientes...'
                : 'Selecione um paciente'
            }
            emptyPlaceholder="Nenhum paciente encontrado"
          />
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              setIsOpen(false)
              setSelectedPatientId('')
            }}
            variant="secondary-gray"
            className="text-[#792EBD]"
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            className="bg-[#792EBD] text-white hover:bg-[#792EBD]/90"
            onClick={handleAction}
            variant={actionButtonVariant}
            loading={loading}
            disabled={loading || !selectedPatientId}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
