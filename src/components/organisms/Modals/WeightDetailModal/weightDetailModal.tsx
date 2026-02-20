'use client'

import MonitorWeightIcon from '@mui/icons-material/MonitorWeight'
import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { WeightRecordEntity } from '@/types/entities/lifestyle'

function formatRecordDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return '-'
  }
}

export interface WeightDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: WeightRecordEntity | null
}

export function WeightDetailModal({
  open,
  onOpenChange,
  record,
}: WeightDetailModalProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !!record?.imageUrl?.trim() && !imgError

  useEffect(() => {
    setImgError(false)
  }, [record])

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold text-gray-900">
            {formatRecordDate(record.createdAt)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            {hasImage ? (
              <img
                src={record.imageUrl}
                alt="Registro de peso"
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50">
                <MonitorWeightIcon className="h-24 w-24 text-purple-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {record.weight} kg
            </h3>
            <p className="text-sm text-gray-600">Peso registrado</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-purple-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Informações do Registro
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-600">Peso:</span>
                <span className="font-medium">{record.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data e hora:</span>
                <span className="font-medium">
                  {formatRecordDate(record.createdAt)}
                </span>
              </div>
              {hasImage && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Imagem:</span>
                  <span className="font-medium text-green-600">Anexada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
