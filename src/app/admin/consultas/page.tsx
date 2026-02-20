'use client'

import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import Input from '@/components/atoms/Input/input'
import LoadingComponent from '@/components/atoms/Loading/loading'
import Select from '@/components/atoms/Select/select'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { RescheduleConsultationModal } from '@/components/organisms/Modals/RescheduleConsultationModal/rescheduleConsultationModal'
import useAllConsultations, {
  getAllConsultationsQueryKey,
} from '@/hooks/queries/useAllConsultations'
import { useAppToast } from '@/hooks/useAppToast'
import { cancelConsultation, updateConsultation } from '@/services/consultation'
import { sendNotification } from '@/services/notification/notification'
import { getPatientsByIds } from '@/services/patient'
import { getUserDoc } from '@/services/user'

import {
  ConsultationWithNames,
  createAdminConsultationColumns,
} from './adminConsultationColumns'

export default function AdminConsultasPage() {
  const { data: consultations, isLoading } = useAllConsultations()
  const queryClient = useQueryClient()
  const { success: showSuccessToast, error: showErrorToast } = useAppToast()

  const [statusFilter, setStatusFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [professionalNameFilter, setProfessionalNameFilter] = useState('')

  const [selectedConsultation, setSelectedConsultation] =
    useState<ConsultationWithNames | null>(null)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const [consultationsWithNames, setConsultationsWithNames] = useState<
    ConsultationWithNames[]
  >([])
  const [isLoadingNames, setIsLoadingNames] = useState(false)

  useEffect(() => {
    const fetchNames = async () => {
      if (!consultations || consultations.length === 0) {
        setConsultationsWithNames([])
        return
      }

      setIsLoadingNames(true)
      try {
        const consultationsWithNamesPromises = consultations.map(
          async (consultation) => {
            const [doctorResult, patientResult] = await Promise.all([
              getUserDoc(consultation.doctorId),
              getUserDoc(consultation.patientId),
            ])

            return {
              ...consultation,
              doctorName: doctorResult.user?.name || 'Nome não disponível',
              patientName: patientResult.user?.name || 'Nome não disponível',
            }
          },
        )

        const consultationsWithNames = await Promise.all(
          consultationsWithNamesPromises,
        )
        setConsultationsWithNames(consultationsWithNames)
      } catch (error) {
        console.error('Erro ao buscar nomes:', error)
        showErrorToast('Erro ao carregar informações dos profissionais')
      } finally {
        setIsLoadingNames(false)
      }
    }

    fetchNames()
  }, [consultations, showErrorToast])

  const filteredConsultations = useMemo(() => {
    return consultationsWithNames.filter((consultation) => {
      if (statusFilter && consultation.status !== statusFilter) {
        return false
      }

      if (formatFilter && consultation.format !== formatFilter) {
        return false
      }

      if (
        professionalNameFilter &&
        !consultation.doctorName
          ?.toLowerCase()
          .includes(professionalNameFilter.toLowerCase())
      ) {
        return false
      }

      return true
    })
  }, [
    consultationsWithNames,
    statusFilter,
    formatFilter,
    professionalNameFilter,
  ])

  const handleReschedule = (consultation: ConsultationWithNames) => {
    setSelectedConsultation(consultation)
    setIsRescheduleModalOpen(true)
  }

  const handleCancelClick = (consultation: ConsultationWithNames) => {
    setSelectedConsultation(consultation)
    setIsCancelModalOpen(true)
  }

  const handleConfirmReschedule = async (
    consultationId: string,
    date: Date,
    hour: string,
  ) => {
    try {
      const result = await updateConsultation(consultationId, { date, hour })

      if (result.success) {
        showSuccessToast('Consulta remarcada com sucesso!')
        queryClient.invalidateQueries({
          queryKey: getAllConsultationsQueryKey(),
        })
      } else {
        showErrorToast(result.error || 'Erro ao remarcar consulta')
      }
    } catch (error) {
      console.error('Erro ao remarcar consulta:', error)
      showErrorToast('Erro ao remarcar consulta')
    }
  }

  const handleConfirmCancel = async () => {
    if (!selectedConsultation) return

    setIsCancelling(true)
    try {
      try {
        await fetch('/api/cancel-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocolNumber: selectedConsultation.protocolNumber ?? '',
          }),
        })
      } catch {
        // ignora erro do refund e segue com o cancelamento
      }

      const result = await cancelConsultation(selectedConsultation.id)

      if (result.success) {
        try {
          const { patients } = await getPatientsByIds([
            selectedConsultation.patientId,
          ])
          const patient = patients[0]
          const date =
            selectedConsultation.date instanceof Date
              ? selectedConsultation.date
              : new Date(selectedConsultation.date)
          const dateStr = format(date, 'dd/MM/yyyy', { locale: ptBR })
          await sendNotification({
            title: 'Consulta cancelada',
            content: `Sua consulta com Dr(a). ${selectedConsultation.doctorName ?? 'médico'} marcada para ${dateStr} às ${selectedConsultation.hour} foi cancelada.`,
            type: 'Consulta',
            users: [
              {
                userId: selectedConsultation.patientId,
                tokens: patient?.tokens ?? [],
              },
            ],
            status: '',
            date: null,
            hasSeenToUsers: [],
          })
        } catch {
          // ignora erro da notificação
        }
        showSuccessToast('Consulta cancelada com sucesso!')
        queryClient.invalidateQueries({
          queryKey: getAllConsultationsQueryKey(),
        })
        setIsCancelModalOpen(false)
      } else {
        showErrorToast(result.error || 'Erro ao cancelar consulta')
      }
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error)
      showErrorToast('Erro ao cancelar consulta')
    } finally {
      setIsCancelling(false)
    }
  }

  const columns = useMemo(
    () =>
      createAdminConsultationColumns({
        onReschedule: handleReschedule,
        onCancel: handleCancelClick,
      }),
    [],
  )

  const clearFilters = () => {
    setStatusFilter('')
    setFormatFilter('')
    setProfessionalNameFilter('')
  }

  const hasActiveFilters =
    statusFilter || formatFilter || professionalNameFilter

  if (isLoading || isLoadingNames) {
    return <LoadingComponent />
  }

  return (
    <div className="mt-44 flex w-full flex-col px-16">
      <h1 className="text-2xl font-bold text-brand-purple-dark">Consultas</h1>

      <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Status
            </label>
            <Select
              options={[
                { label: 'Todos', value: '' },
                { label: 'Agendado', value: 'SCHEDULED' },
                { label: 'Concluído', value: 'COMPLETED' },
                { label: 'Cancelado', value: 'CANCELLED' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Selecione o status"
              className="w-64"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Formato
            </label>
            <Select
              options={[
                { label: 'Todos', value: '' },
                { label: 'Online', value: 'ONLINE' },
                { label: 'Presencial', value: 'PRESENCIAL' },
              ]}
              value={formatFilter}
              onChange={setFormatFilter}
              placeholder="Selecione o formato"
              className="w-64"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Profissional
            </label>
            <Input
              type="text"
              placeholder="Buscar por nome do profissional..."
              value={professionalNameFilter}
              onChange={(e) => setProfessionalNameFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {filteredConsultations.length === consultationsWithNames.length ? (
          <span>
            Exibindo <strong>{filteredConsultations.length}</strong> consulta(s)
          </span>
        ) : (
          <span>
            Exibindo <strong>{filteredConsultations.length}</strong> de{' '}
            <strong>{consultationsWithNames.length}</strong> consulta(s)
          </span>
        )}
      </div>

      <div className="my-6">
        <DataTable
          columns={columns}
          data={filteredConsultations}
          tableDescription="Gerencie todas as consultas cadastradas."
        />
      </div>

      <RescheduleConsultationModal
        isOpen={isRescheduleModalOpen}
        setIsOpen={setIsRescheduleModalOpen}
        consultation={selectedConsultation}
        onConfirm={handleConfirmReschedule}
      />

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        setIsOpen={setIsCancelModalOpen}
        title="Cancelar Consulta"
        description="Tem certeza que deseja cancelar esta consulta?"
        content={
          selectedConsultation && (
            <div className="space-y-2">
              <p>
                <strong>Paciente:</strong> {selectedConsultation.patientName}
              </p>
              <p>
                <strong>Profissional:</strong> {selectedConsultation.doctorName}
              </p>
              <p>
                <strong>Horário:</strong> {selectedConsultation.hour}
              </p>
            </div>
          )
        }
        action={handleConfirmCancel}
        actionLabel="Sim, cancelar"
        actionButtonVariant="destructive"
        cancelLabel="Não, voltar"
        loading={isCancelling}
      />
    </div>
  )
}
