'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState, use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { CarouselCharts } from '@/components/molecules/CarouselCharts/carouselCharts'
import HealthCheckupCard from '@/components/organisms/CheckUp/HealthCheckupCard/healthCheckupCard'
import HealthScoreCard from '@/components/organisms/HealthScoreCard/healthScoreCard'
import { MedicamentsActiveCard } from '@/components/organisms/Medicaments/MedicamentsActiveCard/medicamentsActiveCard'
import NoteCard from '@/components/organisms/NoteCard/noteCard'
import {
  PatientBasicInfoCard,
  PatientGeneralDataCard,
  PatientConsultationsTable,
} from '@/components/organisms/Patient'
import { TimelinePatient } from '@/components/organisms/TimelinePatient/timelinePatient'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default function PatientRecordPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()

  const [selectedChart, setSelectedChart] = useState<
    'healthBiomarkers' | 'mentalHealth' | 'lifestyle'
  >('healthBiomarkers')

  const handleOpenHistory = () => {
    router.push(`/admin/medical-record/${id}/checkups`)
  }

  const handleViewDetails = (checkupId: string) => {
    router.push(`/admin/medical-record/${id}/checkups/${checkupId}`)
  }

  return (
    <div className="mt-24 px-4 md:px-8 lg:px-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={'ghost'}
            className="flex cursor-pointer items-center gap-4 text-purple-800 hover:text-purple-600"
            onClick={() => router.push(`/admin/usuarios`)}
          >
            <ArrowBackOutlinedIcon fontSize="medium" />
            <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
              Prontuário
            </h1>
          </Button>
        </div>
      </div>

      {/* Layout Principal com Grid/Flex Responsivo */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Coluna Esquerda (Principal) */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {/* Cartões de Informação do Paciente */}
          <div className="flex flex-col gap-6 md:flex-row lg:items-stretch">
            <div className="w-auto">
              <PatientBasicInfoCard patientId={id} isAdmin />
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
            <MedicamentsActiveCard patientId={id} isAdmin />
          </div>
        </div>

        {/* Coluna Direita (Lateral) */}
        <div className="flex w-full flex-col gap-6 lg:w-[350px] lg:flex-shrink-0 xl:w-[380px]">
          {/* Score de Saúde */}
          <div className="w-full">
            <HealthScoreCard
              patientId={id}
              className="w-full max-w-none"
              isAdmin
            />
          </div>

          {/* Observações */}
          <div className="flex w-full flex-col gap-4">
            <div className="w-full">
              <HealthCheckupCard
                patientId={id}
                readOnly
                onOpenHistory={handleOpenHistory}
                onViewDetails={handleViewDetails}
              />
            </div>
            <NoteCard patientId={id} isAdmin />
          </div>
        </div>
      </div>
    </div>
  )
}
