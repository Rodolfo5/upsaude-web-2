/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  ListFilter,
  FileText,
  MessageSquare,
  Map,
  ListCheck,
  Pencil,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import Select from '@/components/atoms/Select/select'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { AddNewPatientForm } from '@/components/organisms/Modals/AddNewPatient/addNewPatient'
import { PrescriptionModal } from '@/components/organisms/Modals/PrescriptionModal/prescriptionModal'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import useChatsByDoctor from '@/hooks/queries/useChatsByDoctor'
import useClassifiedPatientsByDoctor from '@/hooks/queries/useClassifiedPatientsByDoctor'
import { useCreateChat } from '@/hooks/queries/useCreateChat'
import { useCreateRequestQuestionnaire } from '@/hooks/queries/useCreateRequestQuestionnaire'
import { useTherapeuticPlans } from '@/hooks/queries/useTherapeuticPlan'
import useDoctor from '@/hooks/useDoctor'
import { findLatestHealthCheckup } from '@/services/healthCheckups'
import { getMedicationAdherence } from '@/services/medicationAdherence'
import { sendNotification } from '@/services/notification/notification'
import { getPatientsByIds } from '@/services/patient'
import { NotificationEntity } from '@/types/entities/notification'
import { RequestQuestionnairesType } from '@/types/entities/requestQuestionnaires'
import { getQuestionnaireType } from '@/utils/questionnaire/getQuestionnairePdfPath'

import { questionnaires } from '../questionarios/column'

import { patientsColumns } from './columns'

export default function PacientesPage() {
  const { data } = useClassifiedPatientsByDoctor()
  const patients = useMemo(() => data?.all || [], [data])
  const patientIds = useMemo(() => patients.map((p) => p.id), [patients])

  // Batch query: busca checkup e aderência de TODOS pacientes em paralelo
  // em vez de 2N queries individuais
  const { data: checkupMap } = useQuery({
    queryKey: ['latest-checkups-batch', patientIds],
    queryFn: async () => {
      const results = await Promise.all(
        patientIds.map(async (id) => {
          const checkup = await findLatestHealthCheckup(id)
          return [id, checkup] as const
        }),
      )
      return Object.fromEntries(results)
    },
    enabled: patientIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const { data: adherenceMap } = useQuery({
    queryKey: ['medication-adherence-batch', patientIds],
    queryFn: async () => {
      const results = await Promise.all(
        patientIds.map(async (id) => {
          const adherence = await getMedicationAdherence(id)
          return [id, adherence] as const
        }),
      )
      return Object.fromEntries(results)
    },
    enabled: patientIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const patientsWithCheckupStatus = useMemo(() => {
    return patients.map((patient) => {
      const checkup = checkupMap?.[patient.id]
      const adherence = adherenceMap?.[patient.id]
      const hasPendingCheckup =
        checkup?.status === 'IN_PROGRESS' || checkup?.status === 'REQUESTED'
      const isNotAdheringToMedication = adherence?.isAdhering === false
      return {
        ...patient,
        hasPendingCheckup,
        isNotAdheringToMedication,
      }
    })
  }, [patients, checkupMap, adherenceMap])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const createRequestMutation = useCreateRequestQuestionnaire()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] =
    useState<string | null>(null)
  const [isApplyQuestionnaireOpen, setIsApplyQuestionnaireOpen] =
    useState(false)
  const [selectedQuestionnaireName, setSelectedQuestionnaireName] = useState<
    string | null
  >(null)
  const [isSaving, setIsSaving] = useState(false)

  const router = useRouter()
  const { currentDoctor } = useDoctor()
  const { data: chats } = useChatsByDoctor()
  const { mutate: createChat } = useCreateChat()

  const filteredPatients = useMemo(() => {
    return patientsWithCheckupStatus.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterType
        ? patient.patientType === filterType
        : true

      return matchesSearch && matchesFilter
    })
  }, [patientsWithCheckupStatus, searchTerm, filterType])

  const handleRowSelectionChange = useCallback((selectedRows: any[]) => {
    const selectedIds = selectedRows.map((row) => row.original.id)
    setSelectedPatients(selectedIds)
  }, [])

  const { data: therapeuticPlans } = useTherapeuticPlans(
    selectedPatients.length === 1 ? selectedPatients[0] : '',
  )

  const handleSendMessage = () => {
    if (selectedPatients.length !== 1 || !currentDoctor?.id) return

    const patientId = selectedPatients[0]
    const existingChat = chats?.find((chat) => chat.patientId === patientId)

    if (existingChat) {
      router.push(`/chat?chatId=${existingChat.id}`)
    } else {
      createChat(
        {
          patientId,
          doctorId: currentDoctor.id,
        },
        {
          onSuccess: (result) => {
            if (!result.error && result.id) {
              router.push(`/chat?chatId=${result.id}`)
            }
          },
        },
      )
    }
  }

  const handleViewTherapeuticPlan = () => {
    if (selectedPatients.length !== 1) return

    const patientId = selectedPatients[0]
    // Se existe plano, redireciona para o mais recente, senão cria novo
    if (therapeuticPlans && therapeuticPlans.length > 0) {
      const latestPlan = therapeuticPlans[0] // Já está ordenado por data desc
      router.push(`/pacientes/${patientId}/plano-terapeutico/${latestPlan.id}`)
    } else {
      router.push(`/pacientes/${patientId}/plano-terapeutico/new`)
    }
  }

  const handleOpenApplyQuestionnaire = async () => {
    if (selectedPatients.length === 0) return
    setIsApplyQuestionnaireOpen(true)
  }

  const handleConfirmApplyQuestionnaire = async () => {
    if (!selectedQuestionnaireName || selectedPatients.length === 0) return
    setIsSaving(true)
    try {
      if (!currentDoctor?.id) return
      const questionnaireType = getQuestionnaireType(selectedQuestionnaireName)
      await createRequestMutation.mutateAsync({
        doctorId: currentDoctor.id,
        patientIds: selectedPatients,
        questionnaireName: selectedQuestionnaireName,
        text: '',
        type: questionnaireType as RequestQuestionnairesType,
      })

      const { patients } = await getPatientsByIds(selectedPatients)
      const patientsById = Object.fromEntries(
        patients.map((p) => [p.id, p] as [string, (typeof patients)[0]]),
      )

      const notificationData: Omit<NotificationEntity, 'id' | 'createdAt'> = {
        title: `Questionário aplicado: ${selectedQuestionnaireName}`,
        content: `Dr(a). ${currentDoctor.name} aplicou o questionário ${selectedQuestionnaireName} para você.`,
        type: 'Questionários de Saúde',
        users: selectedPatients.map((patientId) => ({
          userId: patientId,
          tokens: patientsById[patientId]?.tokens ?? [],
        })),
        status: '',
        date: null,
        hasSeenToUsers: [],
      }

      await sendNotification(notificationData)

      if (!createRequestMutation.isError) {
        setIsApplyQuestionnaireOpen(false)
        setSelectedQuestionnaireName(null)
        setSelectedPatients([])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-8 flex h-auto w-full flex-col items-start justify-start gap-10 px-4 md:mt-12 md:px-10 lg:px-20">
      <div className="flex w-full flex-col gap-6 pb-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start justify-start gap-3 text-center md:text-left">
          <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
            Meus Pacientes
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            Gerencie seus pacientes em uma lista única, com acesso rápido a
            informações e acompanhamentos.
          </p>
        </div>

        <Button
          className="flex w-full items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 md:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Cadastrar paciente
        </Button>
      </div>

      {selectedPatients.length === 0 && (
        <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-end">
          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative w-full">
              <Input
                icon={<Search className="h-5 w-5 text-primary-500" />}
                iconPosition="left"
                placeholder="Pesquisar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-primary-500 text-primary-500 hover:bg-white"
              />
            </div>
            <div className="relative w-full md:w-48">
              <Select
                icon={<ListFilter className="h-5 w-5 text-primary-500" />}
                iconPosition="left"
                placeholder="Tipo de paciente"
                value={filterType}
                onChange={(value) => setFilterType(value)}
                options={[
                  { value: '', label: 'Todos os tipos' },
                  { value: 'complementar', label: 'Complementar' },
                  { value: 'acompanhamento', label: 'Acompanhamento' },
                ]}
                className="rounded-md border border-primary-500 bg-white text-primary-500 hover:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {selectedPatients.length > 0 && (
        <div className="flex w-full flex-wrap items-center justify-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {selectedPatients.length === 1 && (
              <>
                <Button
                  variant="secondary-color"
                  size="sm"
                  onClick={handleViewTherapeuticPlan}
                >
                  <Map className="h-4 w-4" />
                  Visualizar plano
                </Button>

                <Button
                  variant="secondary-color"
                  size="sm"
                  onClick={() =>
                    router.push(`/medical-record/${selectedPatients[0]}`)
                  }
                >
                  <FileText className="h-4 w-4" />
                  Visualizar prontuário
                </Button>
                {currentDoctor?.typeOfCredential === 'CRM' && (
                  <Button
                    variant="secondary-color"
                    size="sm"
                    onClick={() => {
                      setSelectedPatientForPrescription(selectedPatients[0])
                      setIsPrescriptionModalOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Prescrever com Memed
                  </Button>
                )}

                <Button
                  variant="secondary-color"
                  size="sm"
                  onClick={handleSendMessage}
                >
                  <MessageSquare className="h-4 w-4" />
                  Enviar mensagem
                </Button>
              </>
            )}

            <Button
              variant="secondary-color"
              size="sm"
              onClick={handleOpenApplyQuestionnaire}
            >
              <ListCheck className="h-4 w-4" />
              Aplicar questionário
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="w-full flex-1 overflow-auto px-2 py-4 md:px-4 md:py-6">
        <TooltipProvider>
          <DataTable
            columns={patientsColumns}
            data={filteredPatients}
            onRowSelectionChange={handleRowSelectionChange}
          />
        </TooltipProvider>
      </div>
      <AddNewPatientForm isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
      {selectedPatientForPrescription && currentDoctor?.id && (
        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          setIsOpen={setIsPrescriptionModalOpen}
          doctorId={currentDoctor.id}
          patientId={selectedPatientForPrescription}
          onSuccess={() => {
            setSelectedPatientForPrescription(null)
          }}
        />
      )}

      <Dialog
        open={isApplyQuestionnaireOpen}
        onOpenChange={setIsApplyQuestionnaireOpen}
      >
        <DialogContent className="flex max-h-[60vh] max-w-2xl flex-col bg-white">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-semibold text-brand-purple-dark">
              Aplicar questionário
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {questionnaires.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nenhum questionário encontrado.
              </p>
            ) : (
              <div className="space-y-2">
                {questionnaires.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionnaireName(q.name)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                      selectedQuestionnaireName === q.name
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">
                        {q.name}
                      </span>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border ${
                        selectedQuestionnaireName === q.name
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-shrink-0 gap-2">
            <Button
              variant="secondary-color"
              disabled={!selectedQuestionnaireName || isSaving}
              onClick={handleConfirmApplyQuestionnaire}
            >
              {isSaving ? 'Aplicando...' : 'Confirmar'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsApplyQuestionnaireOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
