'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, X } from 'lucide-react'

import { Button } from '@/components/atoms/Button/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { ConsultationDetailsModalProps } from './types'

const STATUS_CONFIG = {
  SCHEDULED: {
    className: 'bg-blue-100 text-blue-700',
    label: 'Agendado',
  },
  IN_PROGRESS: {
    className: 'bg-green-100 text-green-700',
    label: 'Em progresso',
  },
  COMPLETED: {
    className: 'bg-green-100 text-green-700',
    label: 'Concluído',
  },
  CANCELLED: {
    className: 'bg-red-100 text-red-700',
    label: 'Cancelado',
  },
} as const

const FORMAT_LABEL_MAP = {
  ONLINE: 'Teleconsulta',
  PRESENCIAL: 'Presencial',
  PRESENTIAL: 'Presencial',
  IN_PERSON: 'Presencial',
} as const

export function ConsultationDetailsModal({
  isOpen,
  setIsOpen,
  consultation,
  onCancel,
  onReschedule,
  onStartConsultation,
}: ConsultationDetailsModalProps) {
  if (!consultation) return null

  const statusKey =
    (consultation.status?.toUpperCase() as keyof typeof STATUS_CONFIG) ||
    'SCHEDULED'
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.SCHEDULED

  const formatKey =
    consultation.format?.toUpperCase() as keyof typeof FORMAT_LABEL_MAP
  const formatLabel = FORMAT_LABEL_MAP[formatKey] ?? 'Não informado'

  const isScheduled = consultation.status?.toUpperCase() === 'SCHEDULED'
  const isCancelled = consultation.status?.toUpperCase() === 'CANCELLED'
  const isCompleted = consultation.status?.toUpperCase() === 'COMPLETED'
  const isInProgress = consultation.status?.toUpperCase() === 'IN_PROGRESS'
  const canPerformActions =
    isScheduled && !isCancelled && !isCompleted && !isInProgress

  const formattedDate = format(consultation.date, 'dd/MM/yyyy', {
    locale: ptBR,
  })
  const formattedTime = `${format(consultation.startDateTime, 'HH:mm')} - ${format(consultation.endDateTime, 'HH:mm')}`

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel(consultation.id)
    }
    handleClose()
  }

  const handleReschedule = () => {
    if (onReschedule) {
      onReschedule(consultation)
    }
    handleClose()
  }

  const handleStartConsultation = () => {
    if (onStartConsultation) {
      onStartConsultation(consultation.id)
    }
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white sm:max-w-xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <DialogHeader className="items-start text-left">
          <DialogTitle className="text-2xl font-regular text-gray-900">
            Detalhes do Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 border-l-4 border-[#EB34EF] pl-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paciente</p>
              <p className="text-base text-gray-900">
                {consultation.patientName}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Data</p>
              <p className="text-base text-gray-900">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Horário</p>
              <p className="text-base text-gray-900">{formattedTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Formato</p>
              <p className="text-base text-gray-900">{formatLabel}</p>
            </div>
          </div>
        </div>

        {canPerformActions && (
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-xs text-blue-800">
                O cancelamento pode ser feito até 12h antes e o reagendamento
                até 5h antes da consulta
              </p>
            </div>
          </div>
        )}

        {canPerformActions && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleCancel}
              variant="secondary-gray"
              className="flex-1 text-purple-600"
            >
              Cancelar consulta
            </Button>
            <Button
              onClick={handleReschedule}
              variant="secondary-color"
              className="flex-1"
            >
              Reagendar
            </Button>
            {isScheduled && (
              <Button
                onClick={handleStartConsultation}
                variant="success"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Iniciar consulta
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
