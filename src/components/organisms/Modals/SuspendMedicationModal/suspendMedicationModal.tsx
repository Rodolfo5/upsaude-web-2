'use client'
import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSuspendMedication } from '@/hooks/queries/useSuspendMedication'
import { sendNotification } from '@/services/notification/notification'
import { getPatientsByIds } from '@/services/patient'
import { createTimelinePatient } from '@/services/timelinePatient'

import { SuspendMedicationModalProps } from './types'

export function SuspendMedicationModal({
  isOpen,
  setIsOpen,
  medicationName,
  userId,
  medicationId,
  onClose,
}: SuspendMedicationModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const { mutateAsync: suspendMedication, isPending } = useSuspendMedication()

  const handleConfirm = async () => {
    try {
      await suspendMedication({
        userId,
        medicationId,
      })
      try {
        const { patients } = await getPatientsByIds([userId])
        const patient = patients[0]
        await sendNotification({
          title: 'Medicamento suspenso',
          content: `O uso do medicamento "${medicationName}" foi suspenso pelo seu médico.`,
          type: 'Medicamento',
          users: [{ userId, tokens: patient?.tokens ?? [] }],
          status: '',
          date: null,
          hasSeenToUsers: [],
        })
      } catch {
        // ignora erro da notificação
      }
      try {
        await createTimelinePatient(userId, {
          title: `Medicamento suspenso: ${medicationName}`,
          type: 'Medicamento',
          createdBy: 'Doctor',
        })
      } catch {
        // ignora erro da timeline
      }
      setShowSuccess(true)
    } catch (error) {
      console.error('Erro ao suspender medicamento:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowSuccess(false)
    onClose?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-xl">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Image
              src="/ilustra-sucesso-paciente.png"
              alt="Medicação suspendida com sucesso"
              width={200}
              height={200}
            />
            <p className="text-center text-lg font-semibold text-gray-900">
              Medicação suspendida com sucesso!
            </p>
            <Button
              onClick={handleClose}
              variant="link"
              className="flex justify-end"
            >
              <ArrowBackOutlinedIcon className="mr-1" fontSize="small" />
              Voltar
            </Button>
          </div>
        ) : (
          <>
            <DialogTitle className="text-2xl font-normal text-gray-900">
              Você tem certeza que deseja suspender o uso de &quot;
              {medicationName}&quot;?
            </DialogTitle>
            <DialogDescription>
              Esta ação pode impactar o tratamento do paciente
            </DialogDescription>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary-gray"
                className="flex-1"
              >
                Não, cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? 'Suspendendo...' : 'Sim, tenho certeza'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
