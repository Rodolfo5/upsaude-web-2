import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import InputField from '@/components/molecules/InputField/inputField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateBiomarker } from '@/hooks/queries/useBiomarkers'
import useUser from '@/hooks/useUser'
import biomarkerSchema, { BiomarkerFormData } from '@/validations/biomarker'

import { BiomarkerModalProps } from './types'

export function BiomarkerModal({
  isOpen,
  setIsOpen,
  patientId,
  planId,
  pillarId,
  biomarker,
  onSuccess,
}: BiomarkerModalProps) {
  const { currentUser } = useUser()
  const { mutateAsync: updateBiomarker, isPending: isUpdating } =
    useUpdateBiomarker()

  const isEditing = !!biomarker

  const { control, handleSubmit, reset } = useForm<BiomarkerFormData>({
    resolver: zodResolver(biomarkerSchema),
    defaultValues: {
      type: 'bloodGlucose',
      minValue: '',
      maxValue: '',
      status: 'pending',
    },
  })

  useEffect(() => {
    if (biomarker && isOpen) {
      reset({
        type: biomarker.type,
        minValue: biomarker.minValue,
        maxValue: biomarker.maxValue,
        // Map backend status to frontend form value if necessary
        status:
          biomarker.status === 'pending'
            ? 'pending'
            : biomarker.status === 'approved'
              ? 'approved'
              : biomarker.status === 'rejected'
                ? 'rejected'
                : undefined,
      })
    } else if (!isOpen) {
      reset({
        type: 'bloodGlucose',
        minValue: '',
        maxValue: '',
        status: 'pending',
      })
    }
  }, [biomarker, isOpen, reset])

  const onSubmit = async (data: BiomarkerFormData) => {
    try {
      if (isEditing && biomarker) {
        await updateBiomarker({
          patientId,
          planId,
          pillarId,
          biomarkerId: biomarker.id,
          data: {
            minValue: data.minValue,
            maxValue: data.maxValue,
            status: 'approved',
            editedBy: currentUser?.name || '',
          },
        })
      }
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Erro ao salvar biomarcador:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  if (!biomarker) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogTitle className="text-xl font-normal text-gray-700">
          Editar biomarcador
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">
              {biomarker.type === 'bloodGlucose' && 'Glicemia'}
              {biomarker.type === 'bloodPressure' && 'Pressão Arterial'}
              {biomarker.type === 'heartRate' && 'Frequência Cardíaca'}
              {biomarker.type === 'oximetry' && 'Oximetria'}
              {biomarker.type === 'temperature' && 'Temperatura'}
            </p>
          </div>

          <InputField
            name="minValue"
            control={control}
            label="Valor mínimo"
            placeholder={biomarker.type === 'bloodPressure' ? '90/60' : '79'}
            required
          />

          <InputField
            name="maxValue"
            control={control}
            label="Valor máximo"
            placeholder={biomarker.type === 'bloodPressure' ? '120/80' : '99'}
            required
          />

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="link"
              disabled={isUpdating}
              className="hover:no-underline"
            >
              Voltar
            </Button>
            <Button type="submit" loading={isUpdating} disabled={isUpdating}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
