'use client'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import Image from 'next/image'
import { useState } from 'react'

import { getMealTypeLabel } from '@/constants/mealTypes'
import { cn } from '@/lib/utils'
import type { MenuMealRecordEntry } from '@/types/entities/mealRecord'

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

export interface MealRecordCardProps {
  entry: MenuMealRecordEntry
  recordDate: Date | string
  onClick?: () => void
  className?: string
}

export function MealRecordCard({
  entry,
  recordDate,
  onClick,
  className,
}: MealRecordCardProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !!entry.imageUrl?.trim() && !imgError
  const label = getMealTypeLabel(entry.mealType)

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
        {hasImage ? (
          <Image
            src={entry.imageUrl}
            alt=""
            className="object-contain"
            width={100}
            height={100}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <RestaurantIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="my-4 min-w-0 flex-1 px-4">
        <div className="flex items-center justify-start gap-2">
          <p className="text-sm font-medium text-gray-900">
            {formatRecordDate(recordDate)}
          </p>
          <p className="text-sm text-gray-600">{entry.kcal} kcal</p>
        </div>
        <span className="mt-1 inline-block rounded-full border border-purple-800 px-2 py-1 text-xs font-medium text-purple-800">
          {label}
        </span>
      </div>
      <ChevronRightIcon className="h-10 w-10 flex-shrink-0 text-purple-800" />
    </button>
  )
}
