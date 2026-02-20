'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import CheckIcon from '@mui/icons-material/Check'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAllSpecialties } from '@/utils/specialtyHelpers'
import { useAppToast } from '@/hooks/useAppToast'
import useUser from '@/hooks/useUser'
import {
  createConsultationPlan,
  updateConsultationPlan,
} from '@/services/consultationPlan'
import { createRequestConsultation } from '@/services/requestConsultations'
import { DoctorEntity } from '@/types/entities/user'
import RequestConsultationsSchema from '@/validations/requestConsultations'

import { ComplementaryConsultationModalProps } from './types'

export function ComplementaryConsultationModal({
  isOpen,
  setIsOpen,
  consultationId,
  doctorId,
  patientId,
  onSuccess,
  isPlan = false,
  isEdit = false,
  editData,
}: ComplementaryConsultationModalProps & {
  isPlan?: boolean
  isEdit?: boolean
  editData?: ComplementaryConsultationModalProps['editData']
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResponsibleForConsultation, setIsResponsibleForConsultation] =
    useState(false)
  const { success: showSuccessToast, error: showErrorToast } = useAppToast()
  const { currentUser } = useUser()

  const { control, handleSubmit, reset, formState, setValue, watch } = useForm({
    resolver: zodResolver(RequestConsultationsSchema),
    defaultValues: {
      specialty: editData?.specialty || '',
      isResponsible: false,
      doesNotRepeat: false,
      reason: editData?.reason || '',
      numberConsultations: '1',
      frequencyValue: editData?.frequencyValue || '',
      frequencyUnit: editData?.frequencyUnit || '',
      requiredConsultations: editData?.requiredConsultations || '1',
    },
  })

  const frequencyValue = watch('frequencyValue')

  const frequencyUnitOptions = [
    {
      value: 'days',
      label: parseInt(frequencyValue || '1') === 1 ? 'Dia' : 'Dias',
    },
    {
      value: 'weeks',
      label: parseInt(frequencyValue || '1') === 1 ? 'Semana' : 'Semanas',
    },
    { value: 'month', label: 'Mês' },
  ]

  const handleClose = () => {
    setIsOpen(false)
    setIsResponsibleForConsultation(false)
    reset()
  }

  const handleResponsibleForConsultation = () => {
    const newValue = !isResponsibleForConsultation
    setIsResponsibleForConsultation(newValue)
    setValue('isResponsible', newValue)
    if (newValue) {
      const specialty = (currentUser as DoctorEntity)?.specialty || ''
      setValue('specialty', specialty)
    }
  }

  const onSubmit = async (data: z.infer<typeof RequestConsultationsSchema>) => {
    const formData = {
      ...data,
      isResponsible: data.isResponsible ?? false,
      doesNotRepeat: data.doesNotRepeat ?? false,
    }
    setIsLoading(true)
    try {
      if (isPlan) {
        const planData = {
          specialty: formData.specialty,
          frequency: {
            quantity: parseInt(formData.frequencyValue || '1'),
            interval: formData.frequencyUnit as 'days' | 'weeks' | 'month',
          },
          totalConsultations: parseInt(formData.requiredConsultations || '2'),
          reason: formData.reason,
          doctorId,
        }

        if (isEdit && editData?.planId) {
          // Update consultation plan
          const result = await updateConsultationPlan(
            patientId,
            consultationId || '',
            editData.planId,
            planData,
          )
          if (result.success) {
            showSuccessToast('Plano de consulta atualizado com sucesso!')
            handleClose()
            onSuccess()
          } else {
            showErrorToast(
              result.error || 'Erro ao atualizar plano de consulta',
            )
          }
        } else {
          // Create consultation plan
          const createData = {
            ...planData,
            userId: patientId,
            therapeuticPlanId: consultationId || '',
            patientId,
          }
          const result = await createConsultationPlan(createData)
          if (result.planId) {
            showSuccessToast('Plano de consulta criado com sucesso!')
            handleClose()
            onSuccess()
          } else {
            showErrorToast(result.error || 'Erro ao criar plano de consulta')
          }
        }
      } else {
        // Create single request consultation
        const requestData: Parameters<typeof createRequestConsultation>[0] = {
          doctorId,
          patientId,
          specialty: formData.specialty,
          responsible: formData.isResponsible,
          reason: formData.reason,
        }
        // Só adiciona numberConsultations se for fornecido
        if (formData.numberConsultations !== undefined) {
          requestData.numberConsultations = String(formData.numberConsultations)
        }
        if (consultationId) {
          requestData.consultationId = consultationId
        }

        const result = await createRequestConsultation(requestData)

        if (result.requestId) {
          showSuccessToast('Consulta complementar solicitada com sucesso!')
          handleClose()
          onSuccess()
        } else {
          showErrorToast(
            result.error || 'Erro ao solicitar consulta complementar',
          )
        }
      }
    } catch (error) {
      console.error('Erro ao processar:', error)
      showErrorToast('Ocorreu um erro. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle
            className={
              isPlan ? 'text-2xl font-normal text-gray-800' : 'text-[#792EBD]'
            }
          >
            {isPlan
              ? isEdit
                ? 'Editar plano de consulta'
                : 'Adicionar plano de consulta'
              : 'Solicitar consulta complementar'}
          </DialogTitle>
          {!isPlan && (
            <DialogDescription className="text-gray-600">
              Preencha os detalhes para solicitar uma consulta complementar para
              este paciente.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <SelectField
              control={control}
              label="Especialidade"
              name="specialty"
              options={getAllSpecialties()}
              placeholder="Selecione a especialidade"
              disabled={isResponsibleForConsultation}
            />
            <div
              className="ml-4 flex cursor-pointer items-center gap-x-2"
              onClick={handleResponsibleForConsultation}
            >
              {isResponsibleForConsultation ? (
                <div className="flex h-4 w-4 items-center justify-center rounded-[2px] border-2 border-gray-500 text-gray-500">
                  <CheckIcon fontSize="small" />
                </div>
              ) : (
                <div className="h-4 w-4 rounded-[2px] border-2 border-gray-500"></div>
              )}
              <p className="text-gray-500">
                Eu serei o responsável pelo atendimento
              </p>
            </div>
          </div>
          {isPlan && (
            <div className="flex items-center gap-x-8">
              <div className="flex w-1/2 gap-x-3">
                <div className="flex w-1/2">
                  <SelectField
                    control={control}
                    label="Intervalo"
                    name="frequencyValue"
                    options={[
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4', label: '4' },
                      { value: '5', label: '5' },
                      { value: '6', label: '6' },
                      { value: '7', label: '7' },
                      { value: '8', label: '8' },
                      { value: '9', label: '9' },
                      { value: '10', label: '10' },
                    ]}
                  />
                </div>
                <SelectField
                  control={control}
                  name="frequencyUnit"
                  options={frequencyUnitOptions}
                  placeholder="Selecione o tipo de intervalo"
                />
              </div>
              <div className="flex w-1/2">
                <SelectField
                  control={control}
                  label="Consultas necessárias"
                  placeholder="Selecione o número de consultas"
                  name="requiredConsultations"
                  options={[
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                    { value: '5', label: '5' },
                    { value: '6', label: '6' },
                    { value: '7', label: '7' },
                    { value: '8', label: '8' },
                    { value: '9', label: '9' },
                    { value: '10', label: '10' },
                  ]}
                />
              </div>
            </div>
          )}

          <TextareaField
            control={control}
            label="Justificativa"
            name="reason"
            placeholder={
              !isPlan ? 'Digite o motivo da consulta complementar' : undefined
            }
          />
        </div>

        <DialogFooter className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="success"
            disabled={!formState.isValid || isLoading}
            loading={isLoading}
          >
            {isEdit ? 'Editar' : 'Solicitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
