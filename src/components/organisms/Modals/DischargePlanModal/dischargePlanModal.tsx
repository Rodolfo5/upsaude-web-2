import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { useQueryClient } from '@tanstack/react-query'
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
import { errorToast, successToast } from '@/hooks/useAppToast'

interface DischargePlanModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  patientId: string
  planId: string
  doctorId: string
  onSuccess?: () => void
}

export function DischargePlanModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  doctorId,
  onSuccess,
}: DischargePlanModalProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleDischarge = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/therapeutic-plan/discharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          planId,
          doctorId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao dar alta ao paciente')
      }

      successToast(
        'Paciente recebeu alta com sucesso! Novo checkup foi solicitado.',
      )

      // Invalidar queries para atualizar a UI
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plans', patientId],
      })
      queryClient.invalidateQueries({
        queryKey: ['current-therapeutic-plan', patientId],
      })
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-plan', patientId, planId],
      })
      queryClient.invalidateQueries({
        queryKey: ['health-checkups', patientId],
      })

      setShowSuccess(true)
    } catch (error) {
      console.error('Erro ao dar alta ao paciente:', error)
      errorToast(
        error instanceof Error
          ? error.message
          : 'Erro ao dar alta ao paciente. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowSuccess(false)
    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        {showSuccess ? (
          <div className="flex flex-col justify-center space-y-2">
            <p className="text-center text-2xl font-normal text-gray-900">
              Alta realizada com sucesso!
            </p>
            <p className="text-center text-sm text-gray-600">
              O plano terapêutico foi concluído e um novo checkup foi solicitado
              ao paciente. Quando o paciente completar o checkup, você poderá
              gerar um novo plano terapêutico.
            </p>
            <Image
              src="/ilustra-solicitado.png"
              alt="Sucesso ao dar alta"
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
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogTitle className="text-2xl font-normal text-gray-500">
              Dar alta ao paciente
            </DialogTitle>
            <DialogDescription>
              Ao dar alta, o plano terapêutico atual será concluído e um novo
              checkup será automaticamente solicitado ao paciente. Quando o
              paciente completar o checkup, você poderá gerar um novo plano
              terapêutico com base nos dados atualizados.
            </DialogDescription>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="hover:bg-brand-purple-50 hover:text-brand-purple-700"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                className="bg-[#792EBD] text-white hover:bg-[#792EBD]/90"
                onClick={handleDischarge}
                variant="success"
                loading={loading}
                disabled={loading}
              >
                Confirmar alta
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
