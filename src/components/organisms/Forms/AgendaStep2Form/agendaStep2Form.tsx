'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { DayTabs } from '@/components/atoms/DayTabs/dayTabs'
import DaySelectorField from '@/components/molecules/DaySelectorField/daySelectorField'
import { ShiftConfiguration } from '@/components/organisms/ShiftConfiguration/shiftConfiguration'
import { WeekDay, WEEK_DAYS_PT } from '@/constants/weekDays'
import { errorToast, successToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
import { invalidateQueries } from '@/providers/QueryClientApp/queryClient'
import { saveAgenda } from '@/services/firestore/user'
import AgendaStep2Schema, { AgendaStep2Data } from '@/validations/agendaStep2'

import { AgendaStep2FormProps } from './types'

const createEmptyShift = () => ({
  startTime: '',
  endTime: '',
  consultationTypes: [],
  format: [],
  value: 0,
  isPromotional: false,
})

export function AgendaStep2Form({ onSuccess, onBack }: AgendaStep2FormProps) {
  const { userUid } = useAuth()
  const { currentUser, refreshUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState<WeekDay | null>(null)
  const [savedShifts, setSavedShifts] = useState<
    Record<string, Array<Record<string, unknown>>>
  >({})

  const mode = searchParams.get('mode')
  const querySuffix = mode ? `?mode=${mode}` : ''

  const { control, watch, setValue } = useForm<AgendaStep2Data>({
    mode: 'onChange',
    resolver: zodResolver(AgendaStep2Schema),
    defaultValues: {
      selectedDays: [],
      shifts: {},
    },
  })

  const selectedDays = watch('selectedDays')
  const shiftsValue = watch('shifts')
  const shifts = useMemo(() => shiftsValue || {}, [shiftsValue])

  useEffect(() => {
    if (!currentUser?.agenda) return

    const { selectedDays: savedDays, shifts: savedShiftsFromDB } =
      currentUser.agenda

    if (savedDays && Array.isArray(savedDays) && savedDays.length > 0) {
      setValue('selectedDays', savedDays as WeekDay[])
      if (savedShiftsFromDB && typeof savedShiftsFromDB === 'object') {
        setSavedShifts(
          savedShiftsFromDB as Record<string, Array<Record<string, unknown>>>,
        )
      }
    }
  }, [currentUser?.agenda, setValue])

  useEffect(() => {
    if (selectedDays.length > 0 && !activeDay) {
      setActiveDay(selectedDays[0])
    }
  }, [selectedDays, activeDay])

  useEffect(() => {
    if (!activeDay) return

    if (savedShifts[activeDay]) {
      setValue('shifts', {
        ...shifts,
        [activeDay]: savedShifts[activeDay],
      })
    } else {
      if (!shifts[activeDay]) {
        setValue('shifts', {
          ...shifts,
          [activeDay]: [
            createEmptyShift(),
            createEmptyShift(),
            createEmptyShift(),
          ],
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, setValue])

  const handleSaveCurrentDay = useCallback(async () => {
    if (!userUid) {
      errorToast('Usuário não autenticado')
      return
    }

    if (!activeDay) {
      errorToast('Nenhum dia selecionado')
      return
    }

    const currentDayShifts = shifts[activeDay]
    if (!currentDayShifts || currentDayShifts.length === 0) {
      errorToast('Configure pelo menos um turno')
      return
    }

    const hasValidShift = currentDayShifts.some(
      (shift: Record<string, unknown>) => shift.startTime && shift.endTime,
    )

    if (!hasValidShift) {
      errorToast('Configure pelo menos um turno com horários válidos')
      return
    }

    setLoading(true)

    try {
      const updatedShifts = {
        ...savedShifts,
        [activeDay]: currentDayShifts,
      }

      const { success, error } = await saveAgenda(userUid, {
        selectedDays,
        shifts: updatedShifts,
        currentStep: 2,
      })

      if (success) {
        setSavedShifts(updatedShifts)
        successToast(`Turnos de ${WEEK_DAYS_PT[activeDay]} salvos com sucesso!`)
        // Recarregar dados do usuário para atualizar o cache
        await refreshUser()
      } else {
        errorToast(error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      errorToast('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }, [userUid, activeDay, shifts, savedShifts, selectedDays, refreshUser])

  const handleContinue = useCallback(() => {
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(`/configure-agenda-summary${querySuffix}`)
    }
    invalidateQueries(['users', 'current'])
  }, [onSuccess, querySuffix, router])

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }, [onBack, router])

  return (
    <div className="mt-10 flex w-full flex-col gap-8 bg-white">
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Quais dias da semana você deseja atender?*
          </h2>
          <DaySelectorField
            name="selectedDays"
            control={control}
            required
            disabled={loading}
          />
        </div>

        {selectedDays && selectedDays.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="min-w-0 flex-1 text-base font-semibold text-gray-800 sm:text-lg">
                Configure seus turnos de trabalho e os respectivos preços de
                consulta*
              </h3>
              <div className="group relative shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 text-white">
                  <span className="text-sm font-bold">i</span>
                </div>
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded bg-gray-800 px-3 py-2 text-sm text-white group-hover:block">
                  As consultas Iniciais só podem ser online
                </div>
              </div>
            </div>

            <DayTabs
              selectedDays={selectedDays}
              activeDay={activeDay}
              onDayChange={setActiveDay}
            >
              {activeDay && shifts[activeDay] ? (
                <div className="space-y-6">
                  {shifts[activeDay].map((_, index) => (
                    <ShiftConfiguration
                      key={`${activeDay}-${index}`}
                      shiftName={`Turno ${index === 0 ? 'da manhã' : index === 1 ? 'da tarde' : 'da noite'}`}
                      control={control}
                      disabled={loading}
                      activeDay={activeDay}
                      index={index}
                    />
                  ))}

                  {savedShifts[activeDay] && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Turnos de {WEEK_DAYS_PT[activeDay]} já salvos</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500">
                    Configure os turnos para{' '}
                    {activeDay ? WEEK_DAYS_PT[activeDay] : 'o dia selecionado'}
                  </p>
                </div>
              )}
            </DayTabs>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            className="text-[#792EBD] hover:underline disabled:opacity-50"
            onClick={handleSaveCurrentDay}
            disabled={loading || !activeDay}
          >
            Salvar configurações
          </button>

          <div className="mb-10 flex gap-4">
            <Button
              type="button"
              variant="secondary-gray"
              onClick={handleBack}
              disabled={loading}
              className="px-6 py-2 text-[#792EBD]"
            >
              Voltar
            </Button>

            <Button
              type="button"
              onClick={handleContinue}
              className="px-6 py-2"
              disabled={selectedDays.length === 0 || loading}
              loading={loading}
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
