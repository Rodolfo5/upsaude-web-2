'use client'

import {
  addDays,
  differenceInMinutes,
  endOfDay,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarXIcon, Clock } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

import {
  AgendaConsultation,
  AgendaItem,
  isAbsence,
} from '@/types/entities/agendaConsultation'

import { CalendarHeader } from './CalendarHeader'

const hours = Array.from({ length: 24 }, (_, index) => index)

const BREAKPOINTS = {
  mobile: 768,
  desktop: 1280,
} as const

function getLayoutFromWidth(width: number) {
  if (width < BREAKPOINTS.mobile) {
    return { visibleDays: 1, cellHeight: 52, minEventHeight: 32 }
  }
  if (width < BREAKPOINTS.desktop) {
    return { visibleDays: 3, cellHeight: 64, minEventHeight: 36 }
  }
  return { visibleDays: 7, cellHeight: 80, minEventHeight: 40 }
}

const STATUS_STYLE_MAP = {
  SCHEDULED: {
    borderColor: '#530570',
    backgroundColor: '#ECF2FE',
    badgeClassName: 'bg-gray-100 text-gray-700',
    label: 'Agendado',
    textClassName: 'text-gray-800',
  },
  IN_PROGRESS: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF3',
    badgeClassName: 'bg-gray-100 text-gray-700',
    label: 'Em progresso',
    textClassName: 'text-gray-700',
  },
  COMPLETED: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF3',
    badgeClassName: 'bg-gray-100 text-gray-700',
    label: 'Concluído',
    textClassName: 'text-gray-700',
  },
  CANCELLED: {
    borderColor: '#530570',
    backgroundColor: '#FFEBED',
    badgeClassName: 'bg-gray-100 text-gray-700',
    label: 'Cancelado',
    textClassName: 'text-gray-700',
  },
} as const

const FORMAT_LABEL_MAP = {
  ONLINE: 'Teleconsulta',
  PRESENCIAL: 'Presencial',
  PRESENTIAL: 'Presencial',
  IN_PERSON: 'Presencial',
} as const

interface WeeklyCalendarProps {
  consultations: AgendaItem[]
  initialDate?: Date
  onDateChange?: (date: Date) => void
  onConsultationClick?: (consultation: AgendaConsultation) => void
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  consultations,
  initialDate,
  onDateChange,
  onConsultationClick,
}) => {
  const [layout, setLayout] = useState(() =>
    getLayoutFromWidth(
      typeof window !== 'undefined' ? window.innerWidth : 1280,
    ),
  )
  const [currentStartDate, setCurrentStartDate] = useState(
    startOfWeek(initialDate ?? new Date(), { weekStartsOn: 0 }),
  )
  const [selectedDate, setSelectedDate] = useState(initialDate ?? new Date())
  const [now, setNow] = useState(new Date())
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const timeGutterRef = React.useRef<HTMLDivElement>(null)

  const { visibleDays, cellHeight, minEventHeight } = layout

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate)
      setCurrentStartDate(startOfWeek(initialDate, { weekStartsOn: 0 }))
    }
  }, [initialDate])

  useEffect(() => {
    const handleResize = () => {
      setLayout(getLayoutFromWidth(window.innerWidth))
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Sincroniza o scroll do TimeGutter com o calendário
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const timeGutter = timeGutterRef.current

    if (!scrollContainer || !timeGutter) return

    // Garante que ambos começam no topo
    scrollContainer.scrollTop = 0
    timeGutter.scrollTop = 0

    const handleScroll = () => {
      timeGutter.scrollTop = scrollContainer.scrollTop
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const weekDays = useMemo(
    () =>
      Array.from({ length: visibleDays }, (_, index) =>
        addDays(currentStartDate, index),
      ),
    [currentStartDate, visibleDays],
  )

  const rangeEnd = useMemo(
    () => addDays(currentStartDate, visibleDays - 1),
    [currentStartDate, visibleDays],
  )

  const groupedConsultations = useMemo(() => {
    const map: Record<string, Record<number, AgendaItem[]>> = {}
    const rangeStart = startOfDay(currentStartDate)
    const rangeFinish = endOfDay(rangeEnd)

    consultations.forEach((item) => {
      const start = item.startDateTime

      if (start < rangeStart || start > rangeFinish) {
        return
      }

      const dayKey = format(start, 'yyyy-MM-dd')
      const hourKey = start.getHours()

      if (!map[dayKey]) {
        map[dayKey] = {}
      }

      if (!map[dayKey][hourKey]) {
        map[dayKey][hourKey] = []
      }

      map[dayKey][hourKey].push(item)
    })

    Object.values(map).forEach((hoursMap) => {
      Object.values(hoursMap).forEach((list) =>
        list.sort(
          (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
        ),
      )
    })

    return map
  }, [consultations, currentStartDate, rangeEnd])

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day)
    onDateChange?.(day)
  }

  const navigateWeek = (direction: 'previous' | 'next') => {
    const delta = visibleDays === 7 ? 7 : visibleDays
    const newStart =
      direction === 'previous'
        ? subDays(currentStartDate, delta)
        : addDays(currentStartDate, delta)
    const newSelected =
      direction === 'previous'
        ? subDays(selectedDate, delta)
        : addDays(selectedDate, delta)

    setCurrentStartDate(newStart)
    setSelectedDate(newSelected)
    onDateChange?.(newSelected)
  }

  const handlePrev = () => navigateWeek('previous')
  const handleNext = () => navigateWeek('next')
  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    const start = startOfWeek(today, { weekStartsOn: 0 })
    setCurrentStartDate(start)
    onDateChange?.(today)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-purple-100 bg-white">
      <CalendarHeader
        currentStartDate={currentStartDate}
        weekDays={weekDays}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-14 shrink-0 flex-col md:w-20">
          <div
            className="flex items-center justify-center border-b border-r bg-white"
            style={{ height: `${cellHeight}px` }}
          >
            <Clock size={18} className="text-purple-600 md:h-5 md:w-5" />
          </div>
          <div
            ref={timeGutterRef}
            className="overflow-hidden border-r bg-gray-50"
          >
            {hours.map((h, index) => (
              <div
                key={`time-${h}`}
                className={`flex justify-center border-b border-gray-100 ${
                  index === 0 ? 'items-start pt-12' : 'items-center pt-1'
                }`}
                style={{ height: `${cellHeight}px` }}
              >
                <span className="text-[10px] font-medium text-gray-500 md:text-xs">
                  {h.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="relative grid min-w-0 flex-1 overflow-x-auto overflow-y-auto"
          style={{
            gridTemplateColumns: `repeat(${visibleDays}, minmax(90px, 1fr))`,
          }}
        >
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const minutesFromDayStart = differenceInMinutes(
              now,
              startOfDay(day),
            )
            const showIndicator =
              isToday(day) &&
              minutesFromDayStart >= 0 &&
              minutesFromDayStart <= 24 * 60
            const indicatorTop = (minutesFromDayStart / 60) * cellHeight

            return (
              <div
                key={dayKey}
                className="flex min-w-0 flex-col border-r last:border-r-0"
              >
                <button
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`calendar-day-header flex flex-col items-center justify-center border-b py-2 transition-colors md:py-3 ${
                    isSameDay(day, selectedDate)
                      ? 'bg-purple-600 text-white'
                      : isToday(day)
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-white text-gray-700'
                  }`}
                  style={{ height: `${cellHeight}px` }}
                >
                  <span className="text-xs font-medium md:text-sm">
                    {format(day, 'EEE', { locale: ptBR }).replace(/^\w/, (c) =>
                      c.toUpperCase(),
                    )}
                  </span>
                  <span className="text-base font-semibold md:text-lg">
                    {format(day, 'd')}
                  </span>
                </button>

                <div className="relative">
                  {hours.map((hour) => {
                    const eventsInHour =
                      groupedConsultations[dayKey]?.[hour] ?? []

                    return (
                      <div
                        key={`hour-cell-${dayKey}-${hour}`}
                        className="hour-row relative border-b border-gray-100"
                        style={{ height: `${cellHeight}px` }}
                      >
                        {eventsInHour.map((item) => {
                          const minutesFromHourStart =
                            item.startDateTime.getMinutes()
                          const topOffset =
                            (minutesFromHourStart / 60) * cellHeight

                          const durationMinutes = differenceInMinutes(
                            item.endDateTime,
                            item.startDateTime,
                          )
                          const height = Math.max(
                            (durationMinutes / 60) * cellHeight,
                            minEventHeight,
                          )

                          // Renderizar ausência
                          if (isAbsence(item)) {
                            return (
                              <div
                                key={item.id}
                                className="absolute left-0.5 right-0.5 overflow-hidden rounded-lg border-2 p-1.5 shadow-sm md:left-1 md:right-1 md:rounded-2xl md:p-2.5"
                                style={{
                                  top: `${topOffset}px`,
                                  height: `${height}px`,
                                  borderColor: '#530570',
                                  backgroundColor: '#FAFAFA',
                                }}
                              >
                                <div className="flex items-center justify-end gap-0.5 text-[9px] font-semibold md:text-[11px]">
                                  <CalendarXIcon className="h-3 w-3 text-gray-600 md:h-4 md:w-4" />
                                </div>
                                <div className="mt-0.5 truncate text-xs font-bold leading-tight text-gray-800 md:mt-1.5 md:text-sm">
                                  Ausente
                                </div>
                                <span className="text-[10px] text-gray-800 md:text-xs">
                                  {format(item.startDateTime, 'HH:mm')} -{' '}
                                  {format(item.endDateTime, 'HH:mm')}
                                </span>
                              </div>
                            )
                          }

                          // Renderizar consulta
                          const consultation = item as AgendaConsultation
                          const statusKey =
                            (consultation.status?.toUpperCase() as keyof typeof STATUS_STYLE_MAP) ||
                            'SCHEDULED'
                          const statusConfig =
                            STATUS_STYLE_MAP[statusKey] ??
                            STATUS_STYLE_MAP.SCHEDULED

                          const formatLabel =
                            FORMAT_LABEL_MAP[
                              consultation.format?.toUpperCase() as keyof typeof FORMAT_LABEL_MAP
                            ] ?? 'Não informado'

                          return (
                            <button
                              key={consultation.id}
                              type="button"
                              onClick={() =>
                                onConsultationClick?.(consultation)
                              }
                              className="absolute left-0.5 right-0.5 overflow-hidden rounded-md border-2 p-1.5 text-left shadow-sm transition-shadow hover:shadow-md md:left-1 md:right-1 md:rounded-lg md:p-2.5"
                              style={{
                                top: `${topOffset}px`,
                                height: `${height}px`,
                                borderColor: statusConfig.borderColor,
                                backgroundColor: statusConfig.backgroundColor,
                              }}
                            >
                              <div className="flex items-center justify-between gap-0.5 text-[9px] font-semibold md:gap-1 md:text-[11px]">
                                <span
                                  className={`truncate ${statusConfig.textClassName}`}
                                >
                                  {format(consultation.startDateTime, 'HH:mm')}{' '}
                                  - {format(consultation.endDateTime, 'HH:mm')}
                                </span>
                                <span
                                  className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold md:rounded-md md:px-1.5 md:text-[10px] ${statusConfig.badgeClassName}`}
                                >
                                  {statusConfig.label}
                                </span>
                              </div>
                              <div
                                className={`mt-0.5 truncate text-xs font-bold leading-tight md:mt-1.5 md:text-sm ${statusConfig.textClassName}`}
                              >
                                {consultation.patientName}
                              </div>
                              <div className="mt-0.5 truncate text-[10px] text-gray-600 md:mt-1 md:text-xs">
                                {formatLabel}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}

                  {showIndicator && (
                    <div
                      className="pointer-events-none absolute left-1 right-1 md:left-2 md:right-2"
                      style={{ top: `${indicatorTop}px` }}
                    >
                      <div className="relative flex items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-600 md:h-2 md:w-2" />
                        <div className="ml-1 h-px flex-1 bg-purple-600 md:ml-2" />
                        <span className="ml-1 text-[10px] font-semibold text-purple-600 md:ml-2 md:text-xs">
                          {format(now, 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
