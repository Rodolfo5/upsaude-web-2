'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppToast } from '@/hooks/useAppToast'
import {
  findLatestCompletedHealthCheckup,
  updateHealthCheckup,
} from '@/services/healthCheckups'
import { updatePatient } from '@/services/patient'

import { ChangeRiskClassificationModalProps } from './types'

const changeRiskSchema = z.object({
  riskClassification: z.enum(['LOW', 'MODERATE', 'HIGH'], {
    required_error: 'Classificação de risco é obrigatória',
  }),
  justification: z.string().min(1, 'Justificativa é obrigatória'),
})

export function ChangeRiskClassificationModal({
  isOpen,
  setIsOpen,
  currentRisk,
  patientId,
  checkupId,
  onSuccess,
}: ChangeRiskClassificationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentCheckupId, setCurrentCheckupId] = useState<string | undefined>(
    checkupId,
  )
  const { error: showErrorToast } = useAppToast()

  // Buscar o checkup mais recente quando o modal for aberto
  useEffect(() => {
    if (isOpen && patientId && !currentCheckupId) {
      findLatestCompletedHealthCheckup(patientId)
        .then((checkup) => {
          if (checkup?.id) {
            setCurrentCheckupId(checkup.id)
          }
        })
        .catch((error) => {
          console.error('Erro ao buscar checkup:', error)
        })
    }
  }, [isOpen, patientId, currentCheckupId])

  // Atualizar checkupId quando a prop mudar
  useEffect(() => {
    if (checkupId) {
      setCurrentCheckupId(checkupId)
    }
  }, [checkupId])
  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(changeRiskSchema),
    defaultValues: {
      riskClassification: currentRisk.toLowerCase() as
        | 'LOW'
        | 'MODERATE'
        | 'HIGH',
      justification: '',
    },
  })

  const handleClose = () => {
    setIsOpen(false)
    reset()
    setIsSuccess(false)
    setCurrentCheckupId(checkupId) // Reset para o valor inicial
  }

  const onSubmit = async (data: z.infer<typeof changeRiskSchema>) => {
    setIsLoading(true)
    try {
      // Atualizar paciente
      await updatePatient(patientId, {
        riskClassification: data.riskClassification,
        justificationChangeRiskClassification: data.justification,
      })

      // Atualizar checkup digital se houver checkupId
      // Se não tiver checkupId ainda, tentar buscar novamente
      let checkupIdToUpdate = currentCheckupId
      if (!checkupIdToUpdate) {
        const checkup = await findLatestCompletedHealthCheckup(patientId)
        checkupIdToUpdate = checkup?.id
      }

      if (checkupIdToUpdate) {
        await updateHealthCheckup(patientId, checkupIdToUpdate, {
          aiRiskClassification: data.riskClassification,
        })
      }

      setIsSuccess(true)
      onSuccess()
    } catch (error) {
      console.error('Erro ao alterar classificação de risco:', error)
      showErrorToast(
        'Ocorreu um erro ao alterar a classificação de risco. Por favor, tente novamente.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        {isSuccess ? (
          <div className="mt-2 flex flex-col justify-center space-y-2">
            <p className="text-center text-2xl font-normal text-gray-900">
              Classificação de risco alterada com sucesso!
            </p>
            <Image
              src="/ilustra-sucesso-paciente.png"
              alt="Classificação de risco alterada com sucesso"
              width={200}
              height={200}
              className="mx-auto"
            />
            <DialogFooter className="flex justify-end">
              <Button
                onClick={handleClose}
                variant="link"
                className="flex justify-end"
              >
                <ArrowBackOutlinedIcon className="mr-1" fontSize="small" />
                Voltar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[#792EBD]">
                Alterar classificação de risco
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-y-6">
              <SelectField
                control={control}
                label="Nova classificação de risco"
                name="riskClassification"
                options={[
                  { value: 'LOW', label: 'Baixo' },
                  { value: 'MODERATE', label: 'Moderado' },
                  { value: 'HIGH', label: 'Alto' },
                ]}
                placeholder="Selecione a classificação"
              />

              <TextareaField
                control={control}
                label="Justificativa da alteração"
                name="justification"
                placeholder="Digite o motivo da alteração da classificação de risco"
              />
            </div>

            <DialogFooter className="mt-6 flex items-center justify-end gap-3">
              <Button variant="link" onClick={handleClose} disabled={isLoading}>
                Não, Cancelar
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                variant="success"
                disabled={!formState.isValid || isLoading}
                loading={isLoading}
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
