'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { Calendar as CalendarTodayOutlinedIcon } from 'lucide-react'
import { Pencil as EditIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { ComplementaryConsultationModal } from '@/components/organisms/Modals/ComplementaryConsultationModal/complementaryConsultationModal'
import { Card } from '@/components/ui/card'
import useConsultationPlanById from '@/hooks/queries/useConsultationPlanById'
import useConsultationsByPlan from '@/hooks/queries/useConsultationsByPlan'
import { useFindDoctorById } from '@/hooks/queries/useFindDoctorById'
import { useInvalidateConsultationPlanQueries } from '@/hooks/useInvalidateConsultationPlanQueries'
import { timestampToDate } from '@/lib/utils'
interface Props {
  params: Promise<{
    id: string
    planId: string
    planConsultationId: string
  }>
}

export default function PlanConsultationDetailsPage({ params }: Props) {
  const { id: patientId, planId, planConsultationId } = use(params)
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const {
    data: plan,
    isLoading,
    isError,
    error,
  } = useConsultationPlanById(planId, planConsultationId, patientId)
  const { data: doctor } = useFindDoctorById(plan?.doctorId || '')
  const { data: consultations } = useConsultationsByPlan(planConsultationId)
  const invalidateQueries = useInvalidateConsultationPlanQueries(
    planId,
    planConsultationId,
    patientId,
    plan?.doctorId,
  )

  const createdAtDate = plan
    ? timestampToDate(plan.createdAt as unknown as Timestamp)
    : null
  const createdAtLabel = createdAtDate
    ? format(createdAtDate, 'dd/MM/yyyy', { locale: ptBR })
    : '-'
  const updatedAtDate = plan
    ? timestampToDate(plan.updatedAt as unknown as Timestamp)
    : null
  const updatedAtLabel = updatedAtDate
    ? format(updatedAtDate, 'dd/MM/yyyy', { locale: ptBR })
    : '-'

  if (isLoading) {
    return (
      <div className="mt-8 px-4 pb-20 md:px-8 lg:px-20">
        Carregando dados do plano...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-8 px-4 pb-20 md:px-8 lg:px-20">
        Erro ao buscar plano: {(error as Error)?.message || 'Erro desconhecido'}
      </div>
    )
  }

  const frequency = plan?.frequency
  type ConsultationPlanInterval = 'days' | 'weeks' | 'month'
  const intervalLabels: Record<ConsultationPlanInterval, string> = {
    days: 'dias',
    weeks: 'semanas',
    month: 'mês',
  }
  const frequencyLabel = frequency
    ? `A cada ${frequency.quantity} ${intervalLabels[frequency.interval as ConsultationPlanInterval]}`
    : '-'

  const totalConsultations = plan?.totalConsultations ?? '-'

  const handleEditPlan = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    // Invalidate the queries to refresh the data
    invalidateQueries()
  }
  return (
    <div className="mt-8 px-4 pb-20 md:px-8 lg:px-20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-purple-800 hover:text-purple-600"
          >
            <ArrowBackOutlinedIcon fontSize="large" />
          </Button>
          <div>
            <h1 className="text-2xl font-medium text-brand-purple-dark-500">
              Plano de Consultas{' '}
              <span className="ml-2 inline-block rounded-md bg-purple-100 px-2 py-2 text-sm font-medium text-brand-purple-dark-500">
                ID {planConsultationId}
              </span>
            </h1>
          </div>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={handleEditPlan}
        >
          <EditIcon className="h-4 w-4" />
          Editar
        </Button>
      </div>
      <div className="mt-4 flex items-start justify-between pl-6">
        <p className="text-sm text-gray-300">
          <strong>Criado em</strong> {createdAtLabel} por Dr.{' '}
          {doctor?.name || '-'}
        </p>
        {updatedAtDate && (
          <p className="text-sm text-gray-300">
            <strong>Atualizado em</strong> {updatedAtLabel}
          </p>
        )}
      </div>

      <div className="rounded-lg p-6">
        <hr className="my-4 ml-5 text-[#CAC4D0]" />
        <h2 className="mb-4 text-xl font-normal text-brand-purple-dark-700">
          Detalhes
        </h2>

        <div className="mb-6 grid grid-cols-3 gap-6 text-sm text-gray-700">
          <div>
            <div className="text-xs text-gray-400">Especialidade</div>
            <div className="mt-2 font-medium">{plan?.specialty || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Frequência recomendada</div>
            <div className="mt-2">{frequencyLabel}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">
              Quantidade de consultas necessárias
            </div>
            <div className="mt-2">{totalConsultations}</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs text-gray-400">Justificativa</div>
          <div className="mt-2 text-sm text-gray-700">
            {plan?.reason || '-'}
          </div>
        </div>

        <hr className="my-4 ml-5 text-[#CAC4D0]" />

        <h3 className="mb-4 text-xl font-normal text-brand-purple-dark-700">
          Consultas realizadas
        </h3>

        {consultations && consultations.length > 0 ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {consultations.map((consultation, index) => {
              const dateLabel = consultation.date
                ? format(consultation.date, 'dd/MM/yyyy', { locale: ptBR })
                : '-'

              return (
                <Card
                  key={consultation.id}
                  className="w-full rounded-[28px] border-none bg-[#ECE6F0] p-6 shadow-none"
                >
                  <div className="text-sm font-normal text-gray-500">
                    Realizado em
                  </div>
                  <div className="flex items-center gap-2 text-2xl text-gray-500">
                    <div className="mt-2 text-2xl font-normal text-gray-800">
                      {dateLabel}
                    </div>
                    <CalendarTodayOutlinedIcon />
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Consulta {index + 1} de {totalConsultations}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {doctor?.name || '-'} ({doctor?.typeOfCredential}{' '}
                    {doctor?.credential}
                    {doctor?.state})
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="link"
                      onClick={() =>
                        router.push(
                          `/agenda/consultation-history/${consultation.id}`,
                        )
                      }
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">
              Ainda não foi realizada nenhuma consulta deste plano
            </p>
          </div>
        )}
      </div>

      <ComplementaryConsultationModal
        isOpen={isEditModalOpen}
        setIsOpen={setIsEditModalOpen}
        consultationId={planId}
        doctorId={plan?.doctorId || ''}
        patientId={patientId}
        onSuccess={handleEditSuccess}
        isPlan={true}
        isEdit={true}
        editData={
          plan
            ? {
                specialty: plan.specialty,
                frequencyValue: String(plan.frequency?.quantity || ''),
                frequencyUnit: plan.frequency?.interval || '',
                requiredConsultations: String(plan.totalConsultations || ''),
                reason: plan.reason,
                planId: planConsultationId,
              }
            : undefined
        }
      />
    </div>
  )
}
