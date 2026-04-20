'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { Pencil as CreateOutlinedIcon } from 'lucide-react'
import { Map as MapOutlinedIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState, use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { CarouselCharts } from '@/components/molecules/CarouselCharts/carouselCharts'
import { RequestNewCheckup } from '@/components/organisms/CheckUp/RequestNewCheckup/requestNewCheckup'
import FollowUpCard from '@/components/organisms/FollowUpCard/followUpCard'
import HealthScoreCard from '@/components/organisms/HealthScoreCard/healthScoreCard'
import { MedicamentsActiveCard } from '@/components/organisms/Medicaments/MedicamentsActiveCard/medicamentsActiveCard'
import { ComplementaryConsultationModal } from '@/components/organisms/Modals/ComplementaryConsultationModal/complementaryConsultationModal'
import { DischargePlanModal } from '@/components/organisms/Modals/DischargePlanModal/dischargePlanModal'
import { PrescriptionModal } from '@/components/organisms/Modals/PrescriptionModal/prescriptionModal'
import NoteCard from '@/components/organisms/NoteCard/noteCard'
import {
  PatientBasicInfoCard,
  PatientGeneralDataCard,
  PatientLocationCard,
  PatientAccountHolderCard,
} from '@/components/organisms/Patient'
import ShortcurtCard from '@/components/organisms/Patient/ShortcurtCard/shortcurtCard'
import TherapeuticAdjustmentsCard from '@/components/organisms/TherapeuticAdjustmentsCard/therapeuticAdjustmentsCard'
import {
  useCurrentTherapeuticPlan,
  useHasDischargedPlan,
  useTherapeuticPlans,
} from '@/hooks/queries/useTherapeuticPlan'
import useDoctor from '@/hooks/useDoctor'
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
  const router = useRouter()

  const { data: therapeuticPlans } = useTherapeuticPlans(id)
  const { data: currentPlan } = useCurrentTherapeuticPlan(id)
  const hasDischargedPlan = useHasDischargedPlan(id)

  const isCareCoordinator = currentDoctor?.id === patient?.doctorId
  const canDischarge =
    !hasDischargedPlan &&
    isCareCoordinator &&
    currentPlan &&
    !currentPlan.dischargedAt

  const [isComplementaryModalOpen, setIsComplementaryModalOpen] =
    useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [isRequestNewCheckupModalOpen, setIsRequestNewCheckupModalOpen] =
    useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)
  const [selectedCarouselCharts, setSelectedCarouselCharts] = useState<
    'healthBiomarkers' | 'mentalHealth' | 'lifestyle'
  >('healthBiomarkers')

  const handleOpenComplementaryModal = () => {
    setIsComplementaryModalOpen(true)
  }
  const handleViewTherapeuticPlan = () => {
    // Se existe plano, redireciona para o mais recente, senão cria novo
    if (therapeuticPlans && therapeuticPlans.length > 0) {
      const latestPlan = therapeuticPlans[0] // Já está ordenado por data desc
      router.push(`/pacientes/${id}/plano-terapeutico/${latestPlan.id}`)
    } else {
      router.push(`/pacientes/${id}/plano-terapeutico/new`)
    }
  }

  return (
    <div className="mt-12 px-4 md:px-8 lg:px-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant={'ghost'}
          className="flex cursor-pointer items-center gap-4 text-purple-800 hover:text-purple-600"
          onClick={() => router.push(`/pacientes/`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          <h1 className="text-2xl font-semibold text-purple-800 md:text-2xl">
            Detalhes do Paciente
          </h1>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {currentDoctor?.typeOfCredential === 'CRM' && (
            <Button
              variant="outline"
              size="sm"
              icon={<CreateOutlinedIcon />}
              onClick={() => setIsPrescriptionModalOpen(true)}
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
            variant="outline"
            size="sm"
            icon={<MapOutlinedIcon />}
            onClick={handleViewTherapeuticPlan}
            className="w-full sm:w-auto"
          >
            Ver plano terapêutico
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

      <div className="mt-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-auto lg:w-auto">
            <PatientBasicInfoCard patientId={id} />
          </div>
          <div className="min-w-0 lg:flex-1">
            <PatientGeneralDataCard patientId={id} />
          </div>
          <div className="lg:w-auto lg:flex-shrink-0">
            <HealthScoreCard patientId={id} />
          </div>
        </div>
        <div
          className={`mt-6 grid gap-6 ${
            patient?.accountHolder
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {patient?.accountHolder && (
            <div className="h-full">
              <PatientAccountHolderCard
                accountHolderId={patient.accountHolder}
              />
            </div>
          )}
          <div className="h-full">
            <PatientLocationCard
              patientId={id}
              hasAccountHolder={!!patient?.accountHolder}
            />
          </div>
          <div className="h-full">
            <FollowUpCard patientId={id} />
          </div>
        </div>
        <ShortcurtCard patientId={id} />
        {/* Últimas consultas do paciente */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-col space-y-6 lg:flex-1">
            <CarouselCharts
              selected={selectedCarouselCharts}
              setSelected={setSelectedCarouselCharts}
              patientId={id}
            />
            <MedicamentsActiveCard patientId={id} />
          </div>
          <div className="min-w-0 space-y-6 lg:w-auto lg:min-w-[340px] lg:flex-shrink-0">
            <TherapeuticAdjustmentsCard patientId={id} />
            <NoteCard patientId={id} />
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
