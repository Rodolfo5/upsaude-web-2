'use client'

import { UtensilsCrossed as RestaurantIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getMealTypeLabel } from '@/constants/mealTypes'
import { cn } from '@/lib/utils'
import type { MenuMealRecordEntry } from '@/types/entities/mealRecord'

function toKcal(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

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

export interface MealDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MenuMealRecordEntry | null
  recordDate: Date | string
}

export function MealDetailModal({
  open,
  onOpenChange,
  entry,
  recordDate,
}: MealDetailModalProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !!entry?.imageUrl?.trim() && !imgError

  useEffect(() => {
    setImgError(false)
  }, [entry])

  if (!entry) return null

  const label = getMealTypeLabel(entry.mealType)
  const isDieta = entry.followedMenu
  const isLivre = !entry.followedMenu
  const displayKcal = toKcal(entry.kcal)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold text-gray-900">
            {formatRecordDate(recordDate)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            {hasImage ? (
              <img
                src={entry.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200">
                <RestaurantIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-lg font-bold text-gray-900">{label}</h3>
              <span className="text-sm text-gray-500">{displayKcal} kcal</span>
            </div>
            {isDieta && (
              <span
                className={cn(
                  'rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900',
                )}
              >
                Dieta
              </span>
            )}
            {isLivre && (
              <span
                className={cn(
                  'rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900',
                )}
              >
                Livre
              </span>
            )}
          </div>

          {isLivre && entry.description && (
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {entry.description}
            </p>
          )}

          {isDieta && entry.foods && entry.foods.length > 0 && (
            <Accordion
              type="single"
              collapsible
              defaultValue="cardapio"
              className="rounded-xl border border-gray-200 bg-[#F8F5FF] px-4"
            >
              <AccordionItem value="cardapio" className="border-none">
                <AccordionTrigger className="py-4 text-base font-semibold text-gray-900 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  Cardápio
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-600" />
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-0 divide-y divide-gray-200">
                    {entry.foods.map((f) => {
                      const portion =
                        f.portionUnit === 'g'
                          ? `${f.portion}g`
                          : `${f.portion}ml`
                      return (
                        <li
                          key={f.id}
                          className="flex justify-between py-3 text-sm text-gray-700 first:pt-0"
                        >
                          <span>{f.name}</span>
                          <span>{portion}</span>
                        </li>
                      )
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
