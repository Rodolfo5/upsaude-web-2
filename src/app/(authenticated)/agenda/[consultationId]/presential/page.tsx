'use client'

import { ArrowLeft, Check, Pencil, Stethoscope, Pill, Phone, Circle } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import LoadingComponent from '@/components/atoms/Loading/loading'
import { CarouselCharts } from '@/components/molecules/CarouselCharts/carouselCharts'
import HealthCheckupCard from '@/components/organisms/CheckUp/HealthCheckupCard/healthCheckupCard'
import HealthScoreCard from '@/components/organisms/HealthScoreCard/healthScoreCard'
import { MedicamentsActiveCard } from '@/components/organisms/Medicaments/MedicamentsActiveCard/medicamentsActiveCard'
import { ComplementaryConsultationModal } from '@/components/organisms/Modals/ComplementaryConsultationModal/complementaryConsultationModal'
import { DischargePlanModal } from '@/components/organisms/Modals/DischargePlanModal/dischargePlanModal'
import { PrescriptionModal } from '@/components/organisms/Modals/PrescriptionModal/prescriptionModal'
import { SuccessModal } from '@/components/organisms/Modals/SuccessModal/successModal'
import NoteCard from '@/components/organisms/NoteCard/noteCard'
import {
  PatientBasicInfoCard,
  PatientGeneralDataCard,
} from '@/components/organisms/Patient'
import { Card, CardContent } from '@/components/ui/card'
import useAllConsultations from '@/hooks/queries/useAllConsultations'
import {
  useCurrentTherapeuticPlan,
  useHasDischargedPlan,
} from '@/hooks/queries/useTherapeuticPlan'
import { useAppToast } from '@/hooks/useAppToast'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import useDoctor from '@/hooks/useDoctor'
import { usePresentialConsultationSoap } from '@/hooks/usePresentialConsultationSoap'
import { updateConsultation } from '@/services/consultation'
import { uploadAudioFile } from '@/services/firebase/firebaseStorage'
import { getUserDoc } from '@/services/user'
import { PatientEntity } from '@/types/entities/user'

interface PresentialConsultationPageProps {
  params: Promise<{
    consultationId: string
  }>
}

export default function PresentialConsultationPage({
  params,
}: PresentialConsultationPageProps) {
  const router = useRouter()
  const { consultationId } = use(params)
  const { currentDoctor } = useDoctor()
  const { data: consultations, isLoading } = useAllConsultations()
  const { success: showSuccessToast, error: showErrorToast } = useAppToast()
  const [patient, setPatient] = useState<PatientEntity | null>(null)
  const [isLoadingPatient, setIsLoadingPatient] = useState(true)
  const [isComplementaryModalOpen, setIsComplementaryModalOpen] =
    useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [finalizationStatus, setFinalizationStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'prontuario' | 'soap'>('soap')
  const [selectedChart, setSelectedChart] = useState<
    'healthBiomarkers' | 'mentalHealth' | 'lifestyle'
  >('healthBiomarkers')

  const consultation = consultations?.find((c) => c.id === consultationId)
  const { data: currentPlan } = useCurrentTherapeuticPlan(
    consultation?.patientId || '',
  )
  const hasDischargedPlan = useHasDischargedPlan(consultation?.patientId || '')

  const isCareCoordinator =
    currentDoctor?.id === patient?.doctorId && consultation?.patientId
  const canDischarge =
    !hasDischargedPlan &&
    isCareCoordinator &&
    currentPlan &&
    !currentPlan.dischargedAt

  // Hook para gerenciar gravação de áudio
  const {
    isRecording,
    isPaused,
    blob: audioBlob,
    mediaBlobUrl,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useAudioRecorder()

  // Estado para rastrear o blob final após parar gravação
  const [finalAudioBlob, setFinalAudioBlob] = useState<Blob | null>(null)

  // Ref para rastrear mediaBlobUrl sem problemas de closure
  const mediaBlobUrlRef = useRef<string | null>(null)

  // Atualizar blob final quando o hook fornecer um novo blob
  useEffect(() => {
    if (audioBlob) {
      setFinalAudioBlob(audioBlob)
    }
  }, [audioBlob])

  // Atualizar ref quando mediaBlobUrl mudar
  useEffect(() => {
    if (mediaBlobUrl) {
      mediaBlobUrlRef.current = mediaBlobUrl
    }
  }, [mediaBlobUrl])

  // Hook para gerenciar dados SOAP
  const {
    soapData,
    editingFields,
    startEditing,
    saveField,
    cancelEditing,
    updateLocalData,
  } = usePresentialConsultationSoap({
    consultationId,
    enabled: !!consultationId,
  })

  // Fetch patient data
  useEffect(() => {
    if (consultation?.patientId) {
      setIsLoadingPatient(true)
      getUserDoc(consultation.patientId)
        .then((result) => {
          if (result.user) {
            setPatient(result.user as PatientEntity)
          }
          setIsLoadingPatient(false)
        })
        .catch(() => {
          setIsLoadingPatient(false)
        })
    } else {
      setIsLoadingPatient(false)
    }
  }, [consultation?.patientId])

  const handleFinishConsultation = async () => {
    if (!consultation) return

    try {
      setIsUploadingAudio(true)
      setFinalizationStatus('Preparando áudio para upload...')

      let finalBlob: Blob | null = null

      // Parar gravação se estiver ativa e aguardar blob
      if (isRecording || isPaused) {
        stopRecording()

        // Aguardar até que mediaBlobUrl esteja disponível (máximo 5 segundos)
        // Usamos um loop para verificar o ref atualizado via useEffect
        let attempts = 0
        const maxAttempts = 50 // 50 tentativas de 100ms = 5 segundos
        let blobUrlFound: string | null = null

        while (!blobUrlFound && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          attempts++

          // Verificar ref que é atualizado via useEffect
          // Isso evita problemas de closure
          if (mediaBlobUrlRef.current) {
            blobUrlFound = mediaBlobUrlRef.current
            break
          }
        }

        // Se encontramos a URL, fazer fetch do blob
        if (blobUrlFound) {
          try {
            const response = await fetch(blobUrlFound)
            finalBlob = await response.blob()
          } catch (error) {
            console.error('Erro ao obter blob:', error)
          }
        } else {
          console.warn(
            'mediaBlobUrl não encontrado após aguardar. Tentando fallbacks...',
          )
          // Fallback: tentar usar blob do estado se disponível
          finalBlob = finalAudioBlob || audioBlob
          if (finalBlob) {
            console.log(
              'Usando blob do estado como fallback, tamanho:',
              finalBlob.size,
            )
          }
        }
      } else {
        // Se não estava gravando, usar blob existente ou fazer fetch de mediaBlobUrl
        const existingBlobUrl = mediaBlobUrlRef.current || mediaBlobUrl
        if (existingBlobUrl) {
          try {
            const response = await fetch(existingBlobUrl)
            finalBlob = await response.blob()
            console.log(
              'Blob obtido de mediaBlobUrl existente, tamanho:',
              finalBlob.size,
            )
          } catch (error) {
            console.error('Erro ao obter blob existente:', error)
          }
        } else {
          finalBlob = finalAudioBlob || audioBlob
        }
      }

      let audioUrl: string | undefined

      // Fazer upload do áudio se houver blob
      if (finalBlob) {
        setFinalizationStatus('Enviando áudio para o prontuário...')
        const uploadResult = await uploadAudioFile(finalBlob, consultation.id)

        if (uploadResult.error) {
          console.error('Erro no upload:', uploadResult.error)
          showErrorToast(`Erro ao fazer upload do áudio: ${uploadResult.error}`)
          // Continuar mesmo se o upload falhar
        } else if (uploadResult.url) {
          audioUrl = uploadResult.url
        }
      } else {
        console.warn('Nenhum blob de áudio disponível para upload')
      }

      // Preparar dados de atualização
      setFinalizationStatus('Finalizando consulta...')
      const updateData: {
        status: string
        audioUrl?: string
        endedAt?: Date
      } = {
        status: 'COMPLETED',
        endedAt: new Date(),
      }

      // Incluir audioUrl apenas se houver uma URL válida
      if (audioUrl) {
        updateData.audioUrl = audioUrl
      } else {
        console.log('Nenhuma URL de áudio para salvar')
      }

      // Atualizar consulta com status, URL do áudio e endedAt
      const result = await updateConsultation(consultation.id, updateData)

      console.log('Resultado da atualização:', result)

      if (result.success) {
        // Iniciar transcrição em background se houver URL de áudio
        if (audioUrl) {
          try {
            const payload = JSON.stringify({
              consultationId: consultation.id,
              audioUrl,
            })

            // Preferir sendBeacon para não ser cancelado ao navegar
            if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
              const blob = new Blob([payload], {
                type: 'application/json',
              })
              navigator.sendBeacon('/api/transcribe', blob)
            } else {
              fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: payload,
                keepalive: true,
              }).catch((error) => {
                console.error(
                  'Erro ao iniciar transcrição em background:',
                  error,
                )
              })
            }
          } catch (error) {
            console.error('Erro ao iniciar transcrição em background:', error)
          }
        }

        setFinalizationStatus('Concluindo finalização...')
        showSuccessToast('Consulta finalizada com sucesso!')
        router.push('/agenda')
      } else {
        showErrorToast(result.error || 'Erro ao finalizar consulta')
      }
    } catch (error) {
      console.error('Erro ao finalizar consulta:', error)
      showErrorToast('Erro ao finalizar consulta')
    } finally {
      setIsUploadingAudio(false)
      setFinalizationStatus('')
    }
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      pauseRecording()
    } else if (isPaused) {
      resumeRecording()
    } else {
      startRecording()
    }
  }

  if (isLoading || isLoadingPatient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <LoadingComponent className="text-purple-600" />
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="flex h-screen w-full flex-col bg-white">
        <div className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/agenda')}
              className="mt-1 rounded-full p-2 transition-colors hover:bg-gray-100"
              title="Voltar para agenda"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-brand-purple-dark">
                Consulta não encontrada
              </h1>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">Consulta não encontrada</p>
          </div>
        </div>
      </div>
    )
  }

  const consultationTime = consultation.hour || 'N/A'
  const patientName =
    patient?.name || consultation.patientName || 'Nome do Paciente'

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      {isUploadingAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-8 py-6 text-center shadow-2xl">
            <LoadingComponent className="text-brand-purple" />
            <p className="mt-4 text-lg font-semibold text-brand-purple-dark">
              {finalizationStatus || 'Finalizando consulta...'}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Estamos salvando o áudio e preparando a transcrição. Esse processo
              pode levar alguns instantes.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brand-purple-dark">
            {consultationTime} | {patientName}
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary-color"
              onClick={handleToggleRecording}
              disabled={isUploadingAudio}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : isPaused
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-brand-purple text-white hover:bg-purple-700'
              }`}
            >
              <Circle className="fill-current" />
              {isRecording
                ? 'Pausar gravação'
                : isPaused
                  ? 'Retomar gravação'
                  : 'Iniciar gravação'}
            </Button>
            {recordingError && (
              <span className="text-xs text-red-600">{recordingError}</span>
            )}
            <Button
              variant="secondary-color"
              onClick={handleFinishConsultation}
              disabled={isUploadingAudio}
              className="flex items-center gap-2 rounded-full border-2 border-pink-500 bg-white px-4 py-2 text-sm font-semibold text-pink-500 transition-colors hover:bg-pink-50 disabled:opacity-50"
            >
              <Phone />
              {isUploadingAudio ? 'Finalizando...' : 'Finalizar consulta'}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('prontuario')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'prontuario'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Prontuário
            </button>
            <button
              onClick={() => setActiveTab('soap')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'soap'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Método SOAP
            </button>
          </div>
          <div className="flex items-center gap-3">
            {currentDoctor?.typeOfCredential === 'CRM' && (
              <Button
                variant="secondary-color"
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="flex items-center gap-2 rounded-full border-2 border-brand-purple bg-white px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:bg-purple-50"
              >
                <Pill />
                Prescrever com Memed
              </Button>
            )}
            <Button
              variant="secondary-color"
              onClick={() => setIsComplementaryModalOpen(true)}
              className="flex items-center gap-2 rounded-full border-2 border-brand-purple bg-white px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:bg-purple-50"
            >
              <Stethoscope />
              Solicitar consulta complementar
            </Button>
            <Button
              variant="secondary-color"
              onClick={() => setIsDischargeModalOpen(true)}
              className="flex items-center gap-2 rounded-full border-2 border-green-500 bg-white px-4 py-2 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canDischarge}
              title={
                hasDischargedPlan
                  ? 'Alta já realizada'
                  : !isCareCoordinator
                    ? 'Apenas o médico do paciente pode dar alta'
                    : !currentPlan
                      ? 'Nenhum plano terapêutico encontrado'
                      : 'Dar alta ao paciente'
              }
            >
              {hasDischargedPlan ? 'Alta realizada' : 'Dar alta'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {activeTab === 'soap' && (
          <div className="space-y-6">
            <Card className="rounded-xl border border-brand-purple bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-purple-dark">
                      Subjetivo
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Relato do paciente: queixas, sintomas, histórico e
                      percepções
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingFields.subjective && (
                      <button
                        onClick={() =>
                          saveField('subjective', soapData.subjective || '')
                        }
                        className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                        title="Salvar"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (editingFields.subjective) {
                          cancelEditing('subjective')
                        } else {
                          startEditing('subjective')
                        }
                      }}
                      className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                      title={
                        editingFields.subjective ? 'Cancelar edição' : 'Editar'
                      }
                    >
                      <Pencil />
                    </button>
                  </div>
                </div>
                {editingFields.subjective ? (
                  <textarea
                    value={soapData.subjective || ''}
                    onChange={(e) =>
                      updateLocalData('subjective', e.target.value)
                    }
                    className="mt-4 w-full rounded-lg border border-brand-purple p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                    rows={6}
                    placeholder="Digite o relato subjetivo do paciente..."
                  />
                ) : (
                  <div className="mt-4 min-h-[100px] rounded-lg border border-brand-purple bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {soapData.subjective ||
                        'Nenhum conteúdo adicionado ainda.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-brand-purple bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-purple-dark">
                      Objetivo
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Dados observados: sinais vitais, exame físico, exames
                      complementares
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingFields.objective && (
                      <button
                        onClick={() =>
                          saveField('objective', soapData.objective || '')
                        }
                        className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                        title="Salvar"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (editingFields.objective) {
                          cancelEditing('objective')
                        } else {
                          startEditing('objective')
                        }
                      }}
                      className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                      title={
                        editingFields.objective ? 'Cancelar edição' : 'Editar'
                      }
                    >
                      <Pencil />
                    </button>
                  </div>
                </div>
                {editingFields.objective ? (
                  <textarea
                    value={soapData.objective || ''}
                    onChange={(e) =>
                      updateLocalData('objective', e.target.value)
                    }
                    className="mt-4 w-full rounded-lg border border-brand-purple p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                    rows={6}
                    placeholder="Digite os dados objetivos observados..."
                  />
                ) : (
                  <div className="mt-4 min-h-[100px] rounded-lg border border-brand-purple bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {soapData.objective ||
                        'Nenhum conteúdo adicionado ainda.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-brand-purple bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-purple-dark">
                      Avaliação
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Interpretação clínica: hipóteses diagnósticas, diagnóstico
                      diferencial e justificativa
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingFields.assessment && (
                      <button
                        onClick={() =>
                          saveField('assessment', soapData.assessment || '')
                        }
                        className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                        title="Salvar"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (editingFields.assessment) {
                          cancelEditing('assessment')
                        } else {
                          startEditing('assessment')
                        }
                      }}
                      className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                      title={
                        editingFields.assessment ? 'Cancelar edição' : 'Editar'
                      }
                    >
                      <Pencil />
                    </button>
                  </div>
                </div>
                {editingFields.assessment ? (
                  <textarea
                    value={soapData.assessment || ''}
                    onChange={(e) =>
                      updateLocalData('assessment', e.target.value)
                    }
                    className="mt-4 w-full rounded-lg border border-brand-purple p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                    rows={6}
                    placeholder="Digite a avaliação clínica..."
                  />
                ) : (
                  <div className="mt-4 min-h-[100px] rounded-lg border border-brand-purple bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {soapData.assessment ||
                        'Nenhum conteúdo adicionado ainda.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-brand-purple bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-brand-purple-dark">
                      Plano
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Próximos passos do cuidado – exames, tratamentos,
                      encaminhamentos e orientações
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingFields.plan && (
                      <button
                        onClick={() => saveField('plan', soapData.plan || '')}
                        className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                        title="Salvar"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (editingFields.plan) {
                          cancelEditing('plan')
                        } else {
                          startEditing('plan')
                        }
                      }}
                      className="rounded-full p-2 text-brand-purple transition-colors hover:bg-purple-100"
                      title={editingFields.plan ? 'Cancelar edição' : 'Editar'}
                    >
                      <Pencil />
                    </button>
                  </div>
                </div>
                {editingFields.plan ? (
                  <textarea
                    value={soapData.plan || ''}
                    onChange={(e) => updateLocalData('plan', e.target.value)}
                    className="mt-4 w-full rounded-lg border border-brand-purple p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                    rows={6}
                    placeholder="Digite o plano de tratamento..."
                  />
                ) : (
                  <div className="mt-4 min-h-[100px] rounded-lg border border-brand-purple bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {soapData.plan || 'Nenhum conteúdo adicionado ainda.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'prontuario' && (
          <div className="mt-6 flex min-w-0 flex-col gap-8">
            {isLoadingPatient && (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Carregando prontuário...</p>
              </div>
            )}

            {!isLoadingPatient && !patient && (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Paciente não encontrado.</p>
              </div>
            )}

            {!isLoadingPatient && patient && (
              <>
                {/* Dados do paciente */}
                <div className="flex min-w-0 flex-col gap-6 md:flex-row lg:items-stretch">
                  <div className="w-auto">
                    <PatientBasicInfoCard patientId={patient.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <PatientGeneralDataCard patientId={patient.id} />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
                  {/* Coluna esquerda */}
                  <div className="flex min-w-0 flex-1 flex-col gap-8">
                    <div className="w-full min-w-0">
                      <CarouselCharts
                        selected={selectedChart}
                        setSelected={setSelectedChart}
                        patientId={patient?.id}
                      />
                    </div>

                    <div className="w-full min-w-0">
                      <MedicamentsActiveCard patientId={patient.id} />
                    </div>
                  </div>

                  {/* Coluna direita */}
                  <div className="flex w-full min-w-0 flex-col gap-6 lg:w-[350px] lg:flex-shrink-0 xl:w-[380px]">
                    <div className="w-full min-w-0">
                      <HealthScoreCard
                        patientId={patient.id}
                        className="w-full max-w-none"
                      />
                    </div>

                    <div className="w-full min-w-0">
                      <HealthCheckupCard patientId={patient.id} readOnly />
                    </div>

                    <div className="w-full min-w-0">
                      <NoteCard patientId={patient.id} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {consultation && (
        <>
          <ComplementaryConsultationModal
            isOpen={isComplementaryModalOpen}
            setIsOpen={setIsComplementaryModalOpen}
            consultationId={consultation.id}
            doctorId={consultation.doctorId}
            patientId={consultation.patientId}
            onSuccess={() => setIsSuccessModalOpen(true)}
          />
          <PrescriptionModal
            isOpen={isPrescriptionModalOpen}
            setIsOpen={setIsPrescriptionModalOpen}
            doctorId={consultation.doctorId}
            patientId={consultation.patientId}
            consultationId={consultation.id}
            onSuccess={() => {}}
          />
          {currentDoctor && currentPlan && (
            <DischargePlanModal
              isOpen={isDischargeModalOpen}
              setIsOpen={setIsDischargeModalOpen}
              patientId={consultation.patientId}
              planId={currentPlan.id}
              doctorId={currentDoctor.id}
              onSuccess={() => {
                router.refresh()
              }}
            />
          )}
        </>
      )}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="A consulta complementar foi solicitada com sucesso"
        subtitle="A solicitação foi registrada e será processada em breve."
        buttonText="Voltar"
        onButtonClick={() => setIsSuccessModalOpen(false)}
        illustration={
          <Image
            src="/cadastrocompleto.png"
            alt="Sucesso"
            width={300}
            height={300}
          />
        }
      />
    </div>
  )
}
