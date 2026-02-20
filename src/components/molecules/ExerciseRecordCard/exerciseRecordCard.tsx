'use client'

import ArrowOutwardOutlinedIcon from '@mui/icons-material/ArrowOutwardOutlined'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'

import { cn } from '@/lib/utils'
import type { ExerciseRecordEntity } from '@/types/entities/lifestyle'

function formatRecordDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
    return `${mins} min ${secs} s`
  } else if (mins > 0) {
    return `${mins} min`
  } else if (secs > 0) {
    return `${secs} s`
  }
  return '0 min'
}

export interface ExerciseRecordCardProps {
  record: ExerciseRecordEntity
  onClick?: () => void
  className?: string
}

export function ExerciseRecordCard({
  record,
  onClick,
  className,
}: ExerciseRecordCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full max-w-md items-center gap-4 rounded-xl border border-gray-200 bg-[#FAFAFA] p-0 text-left shadow-none transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className,
      )}
    >
      <div className="my-4 min-w-0 flex-1 px-4">
        <div className="flex h-full w-10 items-center justify-center overflow-hidden rounded-l-xl">
          <DirectionsRunIcon className="h-10 w-10 text-purple-600" />
        </div>
        <span className="mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium text-purple-800">
          {record.categoryId}
        </span>
        <p className="text-sm font-medium text-gray-900">
          {formatRecordDate(record.createdAt)}
        </p>
        <p className="text-sm text-gray-600">
          {record.caloriesBurned} kcal • {formatDuration(record.duration)}
        </p>
      </div>
      <span className="flex items-center gap-2 px-2 py-1 text-sm text-purple-800">
        <ArrowOutwardOutlinedIcon
          fontSize="small"
          className="text-purple-800"
        />
        Ver detalhes
      </span>
    </button>
  )
}
