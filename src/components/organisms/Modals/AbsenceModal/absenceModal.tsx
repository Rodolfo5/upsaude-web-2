'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/atoms/Button/button'
import DatePickerField from '@/components/molecules/DatePickerField/datePickerField'
import HourPickerField from '@/components/molecules/HourPickerField/hourPickerField'
import { SuccessModal } from '@/components/organisms/Modals/SuccessModal/successModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { AbsenceModalProps } from './types'

const absenceSchema = z
  .object({
    date: z.date({
      required_error: 'Data é obrigatória',
    }),
    startHour: z.string().min(1, 'Horário inicial é obrigatório'),
    endHour: z.string().min(1, 'Horário final é obrigatório'),
  })
  .refine(
    (data) => {
      if (!data.startHour || !data.endHour) return true
      const [startH, startM] = data.startHour.split(':').map(Number)
      const [endH, endM] = data.endHour.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return endMinutes > startMinutes
    },
    {
      message: 'Horário final deve ser maior que o horário inicial',
      path: ['endHour'],
    },
  )

type AbsenceFormData = z.infer<typeof absenceSchema>

export function AbsenceModal({
  isOpen,
  setIsOpen,
  onSave,
  loading,
}: AbsenceModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const { control, handleSubmit, reset, formState } = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
    defaultValues: {
      date: new Date(),
      startHour: '',
      endHour: '',
    },
  })

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const onSubmit = async (data: AbsenceFormData) => {
    await onSave(data)
    setIsOpen(false)
    reset()
    setShowSuccess(true)
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white sm:max-w-4xl">
          <button
            onClick={handleClose}
            className="absolute right-6 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            disabled={loading}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Fechar</span>
          </button>

          <DialogHeader className="items-start pb-6 text-left">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Definir ausência
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <DatePickerField
                name="date"
                control={control}
                label="Data"
                required
              />

              <HourPickerField
                name="startHour"
                control={control}
                label="Horário Inicial"
              />

              <HourPickerField
                name="endHour"
                control={control}
                label="Horário Final"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="ghost"
                className="bg-transparent text-purple-600 hover:text-purple-700"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 px-8 text-white hover:bg-purple-700"
                disabled={!formState.isValid || loading}
                loading={loading}
              >
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Sua ausência foi definida com sucesso!"
        subtitle="Você já pode voltar e conferir sua agenda na Up Saúde."
        buttonText="Voltar para minha agenda"
        onButtonClick={handleSuccessClose}
        illustration={
          <div className="relative flex items-center justify-center">
            <Image
              src="/ilustra-sucesso-agenda.png"
              alt="Success"
              width={300}
              height={300}
            />
          </div>
        }
      />
    </>
  )
}
