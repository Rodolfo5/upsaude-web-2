import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateTimelinePatient } from '@/hooks/queries/useTimelinePatients'
import { errorToast } from '@/hooks/useAppToast'
import useDoctor from '@/hooks/useDoctor'
import { usePatient } from '@/hooks/usePatient'
import { createHealthCheckup } from '@/services/healthCheckups'
import { sendNotification } from '@/services/notification/notification'
import { CheckupStatus } from '@/types/entities/healthCheckup'
import { NotificationEntity } from '@/types/entities/notification'

interface RequestNewCheckupProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
}

export function RequestNewCheckup({
  isOpen,
  setIsOpen,
  patientId,
}: RequestNewCheckupProps) {
  const { currentDoctor } = useDoctor()
  const { patient } = usePatient(patientId)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const createTimelineMutation = useCreateTimelinePatient()
  const handleRequest = async () => {
    if (!currentDoctor) {
      errorToast('Médico não encontrado')
      return
    }

    setLoading(true)

    try {
      await createHealthCheckup(patientId, {
        doctorId: currentDoctor.id,
        status: CheckupStatus.REQUESTED,
      })

      const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
        title: `Check-up solicitado`,
        content: `Dr(a). ${currentDoctor.name} solicitou um novo check-up para você.`,
        type: 'Check-Up digital',
        users: [{ userId: patientId, tokens: patient?.tokens ?? [] }],
        status: '',
        date: null,
        hasSeenToUsers: [],
      }

      await sendNotification(notificationData)

      await createTimelineMutation.mutateAsync({
        userId: patientId,
        data: {
          title: `Dr(a). ${currentDoctor.name} solicitou um novo check-up`,
          createdBy: 'Doctor',
          type: 'Check-Up digital',
        },
      })
      setShowSuccess(true)
    } catch (error) {
      console.error('Erro ao solicitar check-up:', error)
      errorToast('Erro ao solicitar check-up. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowSuccess(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        {showSuccess ? (
          <div className="flex flex-col justify-center space-y-2">
            <p className="text-center text-2xl font-normal text-gray-900">
              A solicitação de check-up foi concluída com sucesso!
            </p>
            <p className="text-center text-sm text-gray-600">
              Aguarde o paciente realizar o novo check-up antes de prosseguir
              com o tratamento
            </p>
            <Image
              src="/ilustra-solicitado.png"
              alt="Sucesso ao solicitar check-up"
              width={200}
              height={200}
              className="mx-auto"
            />
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
            <DialogTitle className="text-2xl font-normal text-gray-500">
              Você tem certeza que deseja solicitar novo check-up?
            </DialogTitle>
            <DialogDescription>
              Isto implica em uma geração de novo plano terapêutico
            </DialogDescription>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="hover:bg-brand-purple-50 hover:text-brand-purple-700"
                disabled={loading}
              >
                Não, cancelar
              </Button>
              <Button
                className="bg-[#792EBD] text-white hover:bg-[#792EBD]/90"
                onClick={handleRequest}
                variant="success"
                loading={loading}
                disabled={loading}
              >
                Sim, tenho certeza
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
