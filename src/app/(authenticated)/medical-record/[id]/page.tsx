'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { Pencil as CreateOutlinedIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState, use, useEffect } from 'react'

import { Button } from '@/components/atoms/Button/button'
import HealthCheckupCard from '@/components/organisms/CheckUp/HealthCheckupCard/healthCheckupCard'
import {
  PatientBasicInfoCard,
  PatientGeneralDataCard,
  PatientConsultationsTable,
} from '@/components/organisms/Patient'

const CarouselCharts = dynamic(
  () => import('@/components/molecules/CarouselCharts/carouselCharts').then(m => m.CarouselCharts),
  { ssr: false },
)
const RequestNewCheckup = dynamic(
  () => import('@/components/organisms/CheckUp/RequestNewCheckup/requestNewCheckup').then(m => m.RequestNewCheckup),
  { ssr: false },
)
const HealthScoreCard = dynamic(
  () => import('@/components/organisms/HealthScoreCard/healthScoreCard'),
  { ssr: false },
)
const MedicamentsActiveCard = dynamic(
  () => import('@/components/organisms/Medicaments/MedicamentsActiveCard/medicamentsActiveCard').then(m => m.MedicamentsActiveCard),
  { ssr: false },
)
const ComplementaryConsultationModal = dynamic(
  () => import('@/components/organisms/Modals/ComplementaryConsultationModal/complementaryConsultationModal').then(m => m.ComplementaryConsultationModal),
  { ssr: false },
)
const DischargePlanModal = dynamic(
  () => import('@/components/organisms/Modals/DischargePlanModal/dischargePlanModal').then(m => m.DischargePlanModal),
  { ssr: false },
)
const PrescriptionModal = dynamic(
  () => import('@/components/organisms/Modals/PrescriptionModal/prescriptionModal').then(m => m.PrescriptionModal),
  { ssr: false },
)
const NoteCard = dynamic(
  () => import('@/components/organisms/NoteCard/noteCard'),
  { ssr: false },
)
const TimelinePatient = dynamic(
  () => import('@/components/organisms/TimelinePatient/timelinePatient').then(m => m.TimelinePatient),
  { ssr: false },
)
import {
  useCurrentTherapeuticPlan,
  useHasDischargedPlan,
} from '@/hooks/queries/useTherapeuticPlan'
import useDoctor from '@/hooks/useDoctor'
import { useIsQRCodePendingDoctor } from '@/hooks/useIsQRCodePendingDoctor'
import { usePatient } from '@/hooks/usePatient'
interface Props {
  params: Promise<{
    id: string
  }>
}

export default function PatientRecordPage({ params }: Props) {
  const { id } = use(params)
  const { currentDoctor } = useDoctor()
  const { patient } = usePatient(id)
  const { isQRCodePendingDoctor } = useIsQRCodePendingDoctor()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const { data: currentPlan } = useCurrentTherapeuticPlan(id)
  const hasDischargedPlan = useHasDischargedPlan(id)

  const [selectedChart, setSelectedChart] = useState<
    'healthBiomarkers' | 'mentalHealth' | 'lifestyle'
  >('healthBiomarkers')
  const [isComplementaryModalOpen, setIsComplementaryModalOpen] =
    useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [isRequestNewCheckupModalOpen, setIsRequestNewCheckupModalOpen] =
    useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)
  const isCareCoordinator = currentDoctor?.id === patient?.doctorId
  const canDischarge =
    !hasDischargedPlan &&
    isCareCoordinator &&
    currentPlan &&
    !currentPlan.dischargedAt

  const handleRequestNewCheckup = () => {
    setIsRequestNewCheckupModalOpen(true)
  }

  const handleSetRecurrence = () => {
    router.push(`/medical-record/${id}/checkups/recurrence`)
  }

  const handleOpenHistory = () => {
    router.push(`/medical-record/${id}/checkups`)
  }

  // Clear the QR Code callback from localStorage when accessing the medical record
  useEffect(() => {
    const callback = localStorage.getItem('medicalRecordCallback')
    if (callback) {
      try {
        const url = new URL(callback)
        const patientId = url.searchParams.get('patientId')
        // Only clear if we're accessing the correct patient
        if (patientId === id) {
          localStorage.removeItem('medicalRecordCallback')
        }
      } catch {
        // Invalid URL, clear it anyway
        localStorage.removeItem('medicalRecordCallback')
      }
    }
  }, [id])

  const handleOpenComplementaryModal = () => {
    setIsComplementaryModalOpen(true)
  }

  const handleOpenPrescriptionModal = () => {
    setIsPrescriptionModalOpen(true)
  }

  return (
    <div className="mt-12 px-4 md:px-8 lg:px-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {returnTo ? (
            <Button
              variant={'ghost'}
              className="flex cursor-pointer items-center gap-4 text-purple-800 hover:text-purple-600"
              onClick={() => router.push(returnTo)}
            >
              <ArrowBackOutlinedIcon fontSize="medium" />
              <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
                Voltar para o Plano Terapêutico
              </h1>
            </Button>
          ) : (
            <Button
              variant={'ghost'}
              className="flex cursor-pointer items-center gap-4 text-purple-800 hover:text-purple-600"
              onClick={() => router.push(`/pacientes/`)}
            >
              <ArrowBackOutlinedIcon fontSize="medium" />
              <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
                Prontuário
              </h1>
            </Button>
          )}
        </div>
        {!isQRCodePendingDoctor && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {currentDoctor?.typeOfCredential === 'CRM' && (
              <Button
                variant="outline"
                size="sm"
                icon={<CreateOutlinedIcon />}
                onClick={handleOpenPrescriptionModal}
                className="w-full sm:w-auto"
              >
                Prescrever com Memed
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenComplementaryModal}
              className="w-full sm:w-auto"
            >
              Solicitar consulta complementar
            </Button>
            <Button
              variant="success"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setIsDischargeModalOpen(true)}
              disabled={!canDischarge}
              title={
                hasDischargedPlan
                  ? 'Alta já realizada'
                  : !isCareCoordinator
                    ? 'Apenas o coordenador de cuidado pode dar alta'
                    : !currentPlan
                      ? 'Nenhum plano terapêutico encontrado'
                      : currentPlan.dischargedAt
                        ? 'Plano já foi dado alta'
                        : 'Dar alta ao paciente'
              }
            >
              {hasDischargedPlan ? 'Alta realizada' : 'Dar alta'}
            </Button>
          </div>
        )}
      </div>

      {/* Layout Principal com Grid/Flex Responsivo */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Coluna Esquerda (Principal) */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {/* Cartões de Informação do Paciente */}
          <div className="flex flex-col gap-6 md:flex-row lg:items-stretch">
            <div className="w-auto">
              <PatientBasicInfoCard
                patientId={id}
                isQRCodePendingDoctor={isQRCodePendingDoctor}
              />
            </div>
            <div className="min-w-0 flex-1">
              <PatientGeneralDataCard patientId={id} />
            </div>
          </div>
          {/* Áreas da Vida (Gráficos) */}
          <div className="w-full min-w-0">
            <CarouselCharts
              selected={selectedChart}
              setSelected={setSelectedChart}
              patientId={id}
            />
          </div>
          <TimelinePatient patientId={id} />
          <PatientConsultationsTable patientId={id} />
          {/* Medicamentos Ativos */}
          <div className="w-full min-w-0">
            <MedicamentsActiveCard
              patientId={id}
              isQRCodePendingDoctor={isQRCodePendingDoctor}
            />
          </div>
        </div>

        {/* Coluna Direita (Lateral) */}
        <div className="flex w-full flex-col gap-6 lg:w-[350px] lg:flex-shrink-0 xl:w-[380px]">
          {/* Score de Saúde */}
          <div className="w-full">
            <HealthScoreCard
              patientId={id}
              className="w-full max-w-none"
              isQRCodePendingDoctor={isQRCodePendingDoctor}
            />
          </div>

          {/* Observações */}
          <div className="flex w-full flex-col gap-4">
            <div className="w-full">
              <HealthCheckupCard
                patientId={id}
                onRequestNew={handleRequestNewCheckup}
                onSetRecurrence={handleSetRecurrence}
                onOpenHistory={handleOpenHistory}
                isQRCodePendingDoctor={isQRCodePendingDoctor}
              />
            </div>
            <NoteCard
              patientId={id}
              isQRCodePendingDoctor={isQRCodePendingDoctor}
            />
          </div>
        </div>
      </div>

      <ComplementaryConsultationModal
        isOpen={isComplementaryModalOpen}
        setIsOpen={setIsComplementaryModalOpen}
        doctorId={currentDoctor?.id || ''}
        patientId={id}
        onSuccess={() => {}}
      />
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        setIsOpen={setIsPrescriptionModalOpen}
        doctorId={currentDoctor?.id || ''}
        patientId={id}
        onSuccess={() => {}}
      />
      <RequestNewCheckup
        isOpen={isRequestNewCheckupModalOpen}
        setIsOpen={setIsRequestNewCheckupModalOpen}
        patientId={id}
      />
      {currentDoctor && currentPlan && (
        <DischargePlanModal
          isOpen={isDischargeModalOpen}
          setIsOpen={setIsDischargeModalOpen}
          patientId={id}
          planId={currentPlan.id}
          doctorId={currentDoctor.id}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
