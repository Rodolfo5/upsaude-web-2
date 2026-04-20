'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Info as InfoIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import DurationPickerField from '@/components/molecules/DurationPickerField/durationPickerField'
import { errorToast, successToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import useUser from '@/hooks/useUser'
import { saveAgenda } from '@/services/firestore/user'
import AgendaSchema, { AgendaData } from '@/validations/agenda'

import { AgendaFormProps } from './types'

export function AgendaForm({ onSuccess }: AgendaFormProps) {
  const { userUid } = useAuth()
  const { currentUser, refreshUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const mode = searchParams.get('mode')
  const querySuffix = mode ? `?mode=${mode}` : ''

  const {
    handleSubmit,
    control,
    formState: { isValid },
    setValue,
  } = useForm<AgendaData>({
    mode: 'onChange',
    resolver: zodResolver(AgendaSchema),
    defaultValues: {
      complementaryConsultationDuration: undefined,
    },
  })

  useEffect(() => {
    if (currentUser?.agenda?.complementaryConsultationDuration) {
      setValue(
        'complementaryConsultationDuration',
        currentUser.agenda.complementaryConsultationDuration,
        {
          shouldDirty: false,
          shouldValidate: true,
        },
      )
    }
  }, [currentUser?.agenda?.complementaryConsultationDuration, setValue])

  const handleSubmitForm = async (data: AgendaData) => {
    if (!userUid) {
      errorToast('Usuário não autenticado')
      return
    }

    setLoading(true)

    try {
      const { success, error } = await saveAgenda(userUid, {
        complementaryConsultationDuration:
          data.complementaryConsultationDuration,
        currentStep: 1,
      })

      if (success) {
        successToast('Configurações salvas com sucesso!')

        await refreshUser()

        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/configure-agenda-step-2${querySuffix}`)
        }
      } else {
        errorToast(error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      errorToast('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Olá, {currentUser?.name}
        </h2>
        <p className="text-lg text-gray-800">
          Qual é o tempo de duração (em horas) das suas consultas
          complementares?*
        </p>
      </div>

      <form
        className="flex w-full flex-col gap-6"
        onSubmit={handleSubmit(handleSubmitForm)}
      >
        <DurationPickerField
          name="complementaryConsultationDuration"
          control={control}
          label="Selecione"
          required
          disabled={loading}
          minDuration={15}
          maxDuration={240}
          step={15}
        />

        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-100 p-2">
          <InfoIcon fontSize="small" className="text-blue-800" />

          <p className="text-sm text-blue-800">
            As consultas complementares contemplam o atendimento de pacientes já
            conhecidos, para revisão de casos, ajustes de tratamento ou dúvidas
            pontuais. Sua duração mínima é 15 minutos.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="px-8 py-3"
            disabled={!isValid || loading}
            loading={loading}
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  )
}
