'use client'

import * as React from 'react'

import { WEEK_DAYS_ORDER, WEEK_DAYS_PT, WeekDay } from '@/constants/weekDays'
import { errorToast } from '@/hooks/useAppToast'
import { cn } from '@/lib/utils'

import { DayTabsProps } from './types'

const DayTabs = React.forwardRef<HTMLDivElement, DayTabsProps>(
  ({ selectedDays, activeDay, onDayChange, children }, ref) => {
    const handleTabClick = (day: WeekDay) => {
      if (!selectedDays.includes(day)) {
        errorToast(
          'Selecione este dia na seção "Quais dias da semana você deseja atender?" antes de configurar os turnos.',
        )
        return
      }
      onDayChange(day)
    }

    // Se o dia ativo não está entre os selecionados, migrar para o primeiro dia selecionado
    React.useEffect(() => {
      if (
        selectedDays.length > 0 &&
        activeDay &&
        !selectedDays.includes(activeDay)
      ) {
        onDayChange(selectedDays[0])
      } else if (selectedDays.length > 0 && !activeDay) {
        // Se não há dia ativo, selecionar o primeiro
        onDayChange(selectedDays[0])
      }
    }, [selectedDays, activeDay, onDayChange])

    return (
      <div ref={ref} className="flex w-full flex-col gap-4">
        {/* Abas */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {WEEK_DAYS_ORDER.map((day) => {
            const isEnabled = selectedDays.includes(day)
            const isActive = activeDay === day

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleTabClick(day)}
                disabled={!isEnabled}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-all duration-200',
                  'focus:outline-none',
                  isEnabled
                    ? 'cursor-pointer'
                    : 'cursor-not-allowed opacity-40',
                  isActive && isEnabled
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-800',
                  !isActive && isEnabled && 'hover:bg-gray-50',
                )}
              >
                {WEEK_DAYS_PT[day]}
                {!isEnabled && (
                  <span
                    className="ml-1 text-xs"
                    title="Dia não selecionado"
                  ></span>
                )}
              </button>
            )
          })}
        </div>

        {/* Conteúdo da aba ativa */}
        <div className="min-h-[200px] rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
          {activeDay && selectedDays.includes(activeDay) ? (
            children || (
              <div className="flex items-center justify-center text-gray-500">
                <p>
                  Configure os turnos para{' '}
                  <span className="font-semibold">
                    {WEEK_DAYS_PT[activeDay]}
                  </span>
                </p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center text-gray-500">
              <p>Selecione um dia da semana para configurar os turnos</p>
            </div>
          )}
        </div>
      </div>
    )
  },
)

DayTabs.displayName = 'DayTabs'

export { DayTabs }
