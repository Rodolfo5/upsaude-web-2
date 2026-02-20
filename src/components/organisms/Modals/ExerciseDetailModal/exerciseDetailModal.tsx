'use client'

import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import TimerIcon from '@mui/icons-material/Timer'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ExerciseRecordEntity } from '@/types/entities/lifestyle'

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

function formatDuration(duration: string): string {
  const [minutes, seconds] = duration.split(':')
  const mins = parseInt(minutes || '0', 10)
  const secs = parseInt(seconds || '0', 10)

  if (mins > 0 && secs > 0) {
    return `${mins} minutos e ${secs} segundos`
  } else if (mins > 0) {
    return `${mins} minutos`
  } else if (secs > 0) {
    return `${secs} segundos`
  }
  return '0 minutos'
}

export interface ExerciseDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: ExerciseRecordEntity | null
}

export function ExerciseDetailModal({
  open,
  onOpenChange,
  record,
}: ExerciseDetailModalProps) {
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
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-purple-50">
            <DirectionsRunIcon className="h-24 w-24 text-purple-600" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-900">
              {record.categoryId}
            </h3>
            <span className="rounded border border-purple-800 bg-white px-3 py-1 text-sm font-medium text-purple-800">
              Exercício
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <LocalFireDepartmentIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Calorias</p>
                <p className="text-lg font-bold text-gray-900">
                  {record.caloriesBurned} kcal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <TimerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Duração</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDuration(record.duration)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-purple-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Informações do Exercício
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-600">Categoria:</span>
                <span className="font-medium">{record.categoryId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calorias queimadas:</span>
                <span className="font-medium">{record.caloriesBurned} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo de exercício:</span>
                <span className="font-medium">
                  {formatDuration(record.duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
