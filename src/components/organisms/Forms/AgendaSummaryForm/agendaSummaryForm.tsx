/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { CalendarDays as CalendarMonth } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, useMemo } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { SuccessModal } from '@/components/organisms/Modals/SuccessModal/successModal'
import { WEEK_DAYS_PT, WeekDay } from '@/constants/weekDays'
import { errorToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'

import { AgendaSummaryFormProps } from './types'

export function AgendaSummaryForm({
  onSuccess,
  onBack,
}: AgendaSummaryFormProps) {
  const { userUid } = useAuth()
  const { currentUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState<WeekDay | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const isEditMode = searchParams.get('mode') === 'edit'
  const successModalTitle = isEditMode
    ? 'Agenda atualizada com sucesso!'
    : 'Sua agenda foi configurada com sucesso!'
  const successModalSubtitle = isEditMode
    ? 'As novas configurações da sua agenda já estão ativas.'
    : 'Você já pode atender pacientes e desbravar sua conta Up Saúde'
  const successModalButtonText = isEditMode
    ? 'Voltar para agenda'
    : 'Explorar o Up Saúde'
  const successRedirectPath = isEditMode ? '/agenda' : '/dashboard'
  const successModalIllustration = isEditMode ? undefined : (
    <Image
      src="/ilustra-sucesso-agenda.png"
      alt="Summary"
      width={300}
      height={300}
    />
  )

  const selectedDays = useMemo(
    () => currentUser?.agenda?.selectedDays || [],
    [currentUser?.agenda?.selectedDays],
  )
  const consultationDuration =
    currentUser?.agenda?.complementaryConsultationDuration || 0
  const shifts = useMemo(
    () => currentUser?.agenda?.shifts || {},
    [currentUser?.agenda?.shifts],
  )

  const daysWithShifts = useMemo(() => {
    return selectedDays.filter(
      (day) =>
        shifts[day] && Array.isArray(shifts[day]) && shifts[day].length > 0,
    )
  }, [selectedDays, shifts])

  useEffect(() => {
    if (daysWithShifts.length > 0 && !activeDay) {
      setActiveDay(daysWithShifts[0] as WeekDay)
    }
  }, [daysWithShifts, activeDay])

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0min'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    let result = ''
    if (hours > 0) {
      result += `${hours}h`
    }
    if (remainingMinutes > 0) {
      result += `${hours > 0 ? ' ' : ''}${remainingMinutes}min`
    }
    return result
  }

  const formatShiftDescription = (shift: {
    startTime?: string
    endTime?: string
    consultationTypes?: string[]
    format?: string[]
    value?: number
    isPromotional?: boolean
  }) => {
    if (!shift.startTime || !shift.endTime) return ''

    const startTime = shift.startTime
    const endTime = shift.endTime
    const types = shift.consultationTypes?.join(' e ') || ''
    const formats = shift.format?.join(' e ') || ''
    const value = shift.value ? `R$${shift.value}` : ''
    const promotional = shift.isPromotional ? ' (turno promocional)' : ''

    return `Das ${startTime} às ${endTime}, consultas ${types} no formato ${formats}, por ${value}${promotional}`
  }

  const handleSave = async () => {
    if (!userUid) {
      errorToast('Usuário não autenticado.')
      return
    }

    setLoading(true)

    try {
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      errorToast('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  const formatShiftName = (index: number) => {
    if (index === 0) return 'Turno da manhã - '
    if (index === 1) return 'Turno da tarde - '
    if (index === 2) return 'Turno da noite - '
    return ''
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(successRedirectPath)
    }
  }

  const handleSuccessButtonClick = () => {
    setShowSuccessModal(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(successRedirectPath)
    }
  }

  return (
    <div className="flex w-full flex-col gap-8 p-4">
      <div className="flex flex-col gap-2 rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3">
          <CalendarMonth className="h-8 w-8 text-[#792EBD]" />
          <h1 className="text-2xl font-semibold text-[#792EBD]">
            Resumo da sua agenda
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="mt-2 h-12 w-1 bg-[#792EBD]"></div>
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">
                Duração da consulta complementar
              </p>
              <p className="text-lg font-semibold text-[#792EBD]">
                {formatDuration(consultationDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-2 h-12 w-1 bg-[#792EBD]"></div>
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">
                Dias da semana para atendimento
              </p>
              <p className="text-lg font-semibold text-[#792EBD]">
                {selectedDays.length > 0
                  ? selectedDays
                      .map((day) => WEEK_DAYS_PT[day as WeekDay] || day)
                      .join(', ')
                  : 'Nenhum dia selecionado'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-2 h-64 w-1 bg-[#792EBD]"></div>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">
                Turnos de trabalho e preços de consulta
              </p>

              {daysWithShifts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    {daysWithShifts.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setActiveDay(day as WeekDay)}
                        className={`pb-2 text-sm font-medium ${
                          activeDay === day
                            ? 'border-b-2 border-[#792EBD] text-[#792EBD]'
                            : 'text-gray-400'
                        }`}
                      >
                        {WEEK_DAYS_PT[day as WeekDay] || day}
                      </button>
                    ))}
                  </div>

                  {activeDay &&
                    shifts[activeDay] &&
                    Array.isArray(shifts[activeDay]) &&
                    shifts[activeDay].length > 0 && (
                      <div className="space-y-4">
                        {shifts[activeDay]
                          .filter(
                            (shift: any) => shift.startTime && shift.endTime,
                          )
                          .map((shift: any, index: number) => (
                            <div
                              key={`${activeDay}-${index}`}
                              className="flex flex-col gap-2"
                            >
                              <p className="text-sm font-medium text-gray-700">
                                {formatShiftName(index)}
                                {formatShiftDescription(shift)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-600">
                    Nenhum turno configurado ainda.
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Volte para configurar os turnos de trabalho dos dias
                    selecionados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
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
          onClick={handleSave}
          disabled={loading}
          loading={loading}
          className="px-6 py-2"
        >
          Salvar
        </Button>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={successModalTitle}
        subtitle={successModalSubtitle}
        buttonText={successModalButtonText}
        onButtonClick={handleSuccessButtonClick}
        illustration={successModalIllustration}
      />
    </div>
  )
}
