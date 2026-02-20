import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import React from 'react'

interface CalendarHeaderProps {
  currentStartDate: Date
  weekDays: Date[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentStartDate,
  weekDays,
  onPrev,
  onNext,
  onToday,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b p-2 sm:p-4">
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onToday}
          className="rounded-md px-3 py-1.5 text-sm text-[#530570] shadow-sm hover:shadow-lg md:px-4 md:py-2 md:text-base"
        >
          Hoje
        </button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
        <button
          onClick={onPrev}
          className="shrink-0 rounded-full p-1.5 text-[#530570] shadow-sm hover:shadow-lg md:p-2"
          type="button"
        >
          <svg
            className="text-blue-campariDark h-4 w-4 md:h-5 md:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="truncate text-center text-xs font-semibold text-[#530570] sm:text-sm md:text-xl">
          {format(weekDays[0], 'd', { locale: ptBR })} -{' '}
          {format(weekDays[weekDays.length - 1], 'd', { locale: ptBR })},{' '}
          {format(currentStartDate, 'MMMM yyyy', { locale: ptBR }).replace(
            /^\w/,
            (c) => c.toUpperCase(),
          )}
        </h2>

        <button
          onClick={onNext}
          className="shrink-0 rounded-full p-1.5 shadow-sm hover:shadow-lg md:p-2"
          type="button"
        >
          <svg
            className="text-blue-campariDark h-4 w-4 md:h-5 md:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      <div className="hidden w-20 shrink-0 sm:block" />
    </div>
  )
}
