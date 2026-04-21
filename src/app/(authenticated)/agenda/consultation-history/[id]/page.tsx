'use client'

import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Check,
  FileText,
  Pencil,
  Pill,
  Sparkles,
  Stethoscope,
  BookOpen,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import LoadingComponent from '@/components/atoms/Loading/loading'
import { ComplementaryConsultationModal } from '@/components/organisms/Modals/ComplementaryConsultationModal/complementaryConsultationModal'
import { PrescriptionModal } from '@/components/organisms/Modals/PrescriptionModal/prescriptionModal'
import { SuccessModal } from '@/components/organisms/Modals/SuccessModal/successModal'
import { Card, CardContent } from '@/components/ui/card'
import useAllConsultations, {
  getAllConsultationsQueryKey,
} from '@/hooks/queries/useAllConsultations'
import { successToast } from '@/hooks/useAppToast'
import useDoctor from '@/hooks/useDoctor'
import { usePatient } from '@/hooks/usePatient'
import { updateConsultation } from '@/services/consultation-mutations'
import { calculateAge } from '@/utils/calculateAge'
import { generateConsultationPDF } from '@/utils/pdf/generateConsultationPDF'

const ReactMarkdown = dynamic(() => import('react-markdown'))

interface ConsultationDetailPageProps {
  params: Promise<{
    id: string
  }>
}
const formatConsultation = (presential: string, online: string) => {
  return presential === 'PRESENCIAL'
    ? 'Presencial'
    : online === 'ONLINE'
      ? 'Teleconsulta'
      : 'Não informado'
}

const formatCPF = (cpf?: string): string => {
  if (!cpf) return 'N/A'
  const cleanCPF = cpf.replace(/\D/g, '')
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const DEFAULT_AI_SUMMARY_PLACEHOLDER =
  'O sumário gerado por IA será exibido aqui'

export default function ConsultationDetailPage({
  params,
}: ConsultationDetailPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { currentDoctor } = useDoctor()
  const { data: consultations, isLoading } = useAllConsultations()
  const { id } = use(params)
  const [isEditingSOAP, setIsEditingSOAP] = useState(false)
  const [isEditingAISummary, setIsEditingAISummary] = useState(false)
  const [isComplementaryModalOpen, setIsComplementaryModalOpen] =
    useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isSavingAISummary, setIsSavingAISummary] = useState(false)

  const [soapData, setSoapData] = useState({
    subjective:
      'Paciente relata dor abdominal há 3 dias, intensidade moderada, piora após refeições. Nega febre.',
    objective:
      'Abdome doloroso à palpação em quadrante superior direito. Sem icterícia. Pressão 120/80 mmHg, FC 78 bpm.',
    assessment:
      'Suspeita de colecistite leve. Sem sinais de gravidade no momento.',
    plan: 'Solicitar ultrassom de abdome. Orientar dieta leve. Prescrever analgésico. Retorno em 7 dias ou se piora.',
  })

  const consultation = consultations?.find((c) => c.id === id)
  const { patient, loading: patientLoading } = usePatient(
    consultation?.patientId,
  )

  const [aiSummary, setAiSummary] = useState<string>(
    consultation?.aiSummary || DEFAULT_AI_SUMMARY_PLACEHOLDER,
  )

  // Atualizar aiSummary quando consulta mudar (apenas se não estiver editando)
  useEffect(() => {
    if (!isEditingAISummary && consultation?.aiSummary) {
      setAiSummary(consultation.aiSummary)
    } else if (!isEditingAISummary && !consultation?.aiSummary) {
      setAiSummary(DEFAULT_AI_SUMMARY_PLACEHOLDER)
    }
  }, [consultation?.aiSummary, isEditingAISummary])

  const hasAiSummary =
    !!consultation?.aiSummary ||
    (aiSummary && aiSummary !== DEFAULT_AI_SUMMARY_PLACEHOLDER)

  const handleSaveAISummary = async () => {
    if (!consultation?.id) return
    setIsSavingAISummary(true)
    try {
      const result = await updateConsultation(consultation.id, {
        aiSummary,
        aiSummaryUpdatedAt: new Date(),
      })

      if (!result.success) {
        throw new Error(result.error ?? 'Erro ao salvar sumário')
      }

      // Invalidar cache para atualizar a lista de consultas
      await queryClient.invalidateQueries({
        queryKey: getAllConsultationsQueryKey(),
      })
      successToast('Sumário de IA salvo com sucesso')
      setIsEditingAISummary(false)
    } catch (error) {
      console.error('Erro ao salvar sumário de IA:', error)
      alert(
        error instanceof Error ? error.message : 'Erro ao salvar sumário de IA',
      )
    } finally {
      setIsSavingAISummary(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (!consultation?.id) return

    setIsGeneratingSummary(true)
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId: consultation.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar sumário')
      }

      // Invalidar cache para atualizar a lista de consultas
      await queryClient.invalidateQueries({
        queryKey: getAllConsultationsQueryKey(),
      })

      successToast('Sumário de IA gerado com sucesso')
      setAiSummary(data.aiSummary)
    } catch (error) {
      console.error('Erro ao gerar sumário:', error)
      alert(
        error instanceof Error ? error.message : 'Erro ao gerar sumário com IA',
      )
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  if (isLoading || patientLoading) {
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
            <Button
              onClick={() => router.back()}
              className="mt-1 rounded-full p-2 transition-colors hover:bg-gray-100"
              title="Voltar para histórico"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
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

  const consultationDate = consultation.date
    ? format(new Date(consultation.date), 'dd/MM/yyyy', { locale: ptBR })
    : 'N/A'

  const consultationTime = consultation.hour || 'N/A'
  const timeRange =
    consultationTime !== 'N/A' && consultationTime.includes(':')
      ? (() => {
          const [hours, minutes] = consultationTime.split(':')
          const startMinutes = parseInt(minutes || '0', 10)
          const endMinutes = startMinutes + 45
          const endHours =
            parseInt(hours || '0', 10) + Math.floor(endMinutes / 60)
          const finalMinutes = endMinutes % 60
          return `${consultationTime} - ${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`
        })()
      : consultationTime

  const patientName =
    patient?.name || consultation.patientName || 'Nome do Paciente'
  const patientAge = calculateAge(patient?.birthDate)
  const patientCPF = formatCPF(patient?.cpf)

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mt-1 rounded-full p-2 transition-colors hover:bg-gray-100"
              title="Voltar para histórico"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-brand-purple-dark">
                {patientName}
              </h1>
              <div className="flex flex-col items-start gap-1 text-sm text-gray-600">
                <span>Idade | {patientAge}</span>
                <span>CPF | {patientCPF}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-lg font-bold text-[#530570]">
              {consultationDate}
            </span>

            <span className="text-sm font-medium text-gray-900">
              Horário | {timeRange}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              {consultation.format === 'PRESENTIAL'
                ? 'Presencial'
                : formatConsultation(
                    consultation.format,
                    consultation.formatOnline,
                  )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          {currentDoctor?.typeOfCredential === 'CRM' && (
            <Button
              variant="secondary-color"
              onClick={() => setIsPrescriptionModalOpen(true)}
            >
              <Pill className="h-4 w-4" />
              Prescrever com Memed
            </Button>
          )}
          <Button
            variant="secondary-color"
            onClick={() => {
              console.log('Ver plano terapêutico')
            }}
            className="flex items-center gap-2 rounded-full border-2 border-brand-purple px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:bg-purple-50"
          >
            <BookOpen className="h-4 w-4" />
            Ver plano terapêutico
          </Button>
          <Button
            variant="secondary-color"
            onClick={async () => {
              if (consultation) {
                try {
                  await generateConsultationPDF({
                    consultation,
                    patient,
                    soapData,
                    aiSummary:
                      aiSummary !== DEFAULT_AI_SUMMARY_PLACEHOLDER
                        ? aiSummary
                        : undefined,
                  })
                } catch (error) {
                  console.error('Erro ao gerar PDF:', error)
                  alert('Erro ao gerar PDF. Por favor, tente novamente.')
                }
              }
            }}
            className="flex items-center gap-2 rounded-full border-2 border-brand-purple px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:bg-purple-50"
          >
            <FileText className="h-4 w-4" />
            Criar documento
          </Button>
          <Button
            variant="secondary-color"
            onClick={() => setIsComplementaryModalOpen(true)}
            className="flex items-center gap-2 rounded-full border-2 border-brand-purple px-4 py-2 text-sm font-semibold text-brand-purple transition-colors hover:bg-purple-50"
          >
            <Stethoscope className="h-4 w-4" />
            Solicitar consulta complementar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-600" />
              <h2 className="text-2xl font-bold text-red-600">
                Sumário gerado por IA
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {!hasAiSummary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={
                    isGeneratingSummary || !consultation?.audioTranscription
                  }
                  className="flex items-center gap-1 rounded-md bg-brand-purple px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Gerar sumário com IA"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGeneratingSummary ? 'Gerando...' : 'Gerar'}
                </button>
              )}
              {isEditingAISummary && (
                <button
                  onClick={handleSaveAISummary}
                  disabled={isSavingAISummary}
                  className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Salvar sumário"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setIsEditingAISummary(!isEditingAISummary)}
                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title={isEditingAISummary ? 'Cancelar edição' : 'Editar'}
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>
          </div>

          <Card className="rounded-xl border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-6">
                {isEditingAISummary ? (
                  <textarea
                    value={aiSummary}
                    onChange={(e) => setAiSummary(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                    rows={6}
                    placeholder="Digite o sumário gerado por IA..."
                  />
                ) : (
                  <div className="prose prose-sm prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700 max-w-none py-4">
                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-purple-dark">
            Método SOAP
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('Marcar como completo')
              }}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
              title="Marcar como completo"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsEditingSOAP(!isEditingSOAP)}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
              title="Editar"
            >
              <Pencil className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Card className="rounded-xl border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-brand-purple-dark">
                  Subjetivo
                </h3>
                {isEditingSOAP ? (
                    <>
                      <label htmlFor="soap-subjective" className="sr-only">Subjetivo</label>
                      <textarea
                        id="soap-subjective"
                        value={soapData.subjective}
                        onChange={(e) =>
                          setSoapData({ ...soapData, subjective: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                        rows={3}
                      />
                    </>
                ) : (
                  <p className="text-sm text-gray-700">{soapData.subjective}</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-brand-purple-dark">
                  Objetivo
                </h3>
                {isEditingSOAP ? (
                    <>
                      <label htmlFor="soap-objective" className="sr-only">Objetivo</label>
                      <textarea
                        id="soap-objective"
                        value={soapData.objective}
                        onChange={(e) =>
                          setSoapData({ ...soapData, objective: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                        rows={3}
                      />
                    </>
                ) : (
                  <p className="text-sm text-gray-700">{soapData.objective}</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-brand-purple-dark">
                  Avaliação
                </h3>
                {isEditingSOAP ? (
                    <>
                      <label htmlFor="soap-assessment" className="sr-only">Avaliação</label>
                      <textarea
                        id="soap-assessment"
                        value={soapData.assessment}
                        onChange={(e) =>
                          setSoapData({ ...soapData, assessment: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                        rows={3}
                      />
                    </>
                ) : (
                  <p className="text-sm text-gray-700">{soapData.assessment}</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-brand-purple-dark">
                  Plano
                </h3>
                {isEditingSOAP ? (
                    <>
                      <label htmlFor="soap-plan" className="sr-only">Plano</label>
                      <textarea
                        id="soap-plan"
                        value={soapData.plan}
                        onChange={(e) =>
                          setSoapData({ ...soapData, plan: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-100"
                        rows={3}
                      />
                    </>
                ) : (
                  <p className="text-sm text-gray-700">{soapData.plan}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
