'use client'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight'
import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { WeightRecordEntity } from '@/types/entities/lifestyle'

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

export interface WeightRecordCardProps {
  record: WeightRecordEntity
  onClick?: () => void
  className?: string
}

export function WeightRecordCard({
  record,
  onClick,
  className,
}: WeightRecordCardProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !!record.imageUrl?.trim() && !imgError

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-[#FAFAFA] p-0 text-left shadow-none transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className,
      )}
    >
      <div className="flex h-full w-24 items-center justify-center overflow-hidden rounded-l-xl">
        {hasImage && record.imageUrl ? (
          <Image
            src={record.imageUrl}
            alt=""
            className="object-contain"
            width={100}
            height={100}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <MonitorWeightIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="my-4 min-w-0 flex-1 px-4">
        <p className="text-sm font-medium text-gray-900">
          {formatRecordDate(record.createdAt)}
        </p>
        <p className="text-lg font-bold text-gray-900">{record.weight} kg</p>
      </div>
      <ChevronRightIcon className="h-10 w-10 flex-shrink-0 text-purple-800" />
    </button>
  )
}
