import EditIcon from '@mui/icons-material/Edit'
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone'
import { useEffect, useState } from 'react'

import Textarea from '@/components/atoms/Textarea/textarea'
import { CarouselCharts } from '@/components/molecules/CarouselCharts/carouselCharts'
import HealthCheckupCard from '@/components/organisms/CheckUp/HealthCheckupCard/healthCheckupCard'
import HealthScoreCard from '@/components/organisms/HealthScoreCard/healthScoreCard'
import { MedicamentsActiveCard } from '@/components/organisms/Medicaments/MedicamentsActiveCard/medicamentsActiveCard'
import NoteCard from '@/components/organisms/NoteCard/noteCard'
import {
  PatientBasicInfoCard,
  PatientGeneralDataCard,
} from '@/components/organisms/Patient'
import { cn } from '@/lib/utils'
import { getUserDoc } from '@/services/user'
import { PatientEntity } from '@/types/entities/user'

import type { SoapNotesPanelProps, SoapFieldKey } from './types'

export function SoapNotesPanel({
  activeTab,
  onChangeTab,
  soapData,
  editingFields,
  startEditing,
  saveField,
  updateLocalData,
  patientId,
}: SoapNotesPanelProps) {
  const [patient, setPatient] = useState<PatientEntity | null>(null)
  const [isLoadingPatient, setIsLoadingPatient] = useState(false)
  const [selectedChart, setSelectedChart] = useState<
    'healthBiomarkers' | 'mentalHealth' | 'lifestyle'
  >('healthBiomarkers')

  useEffect(() => {
    if (patientId) {
      setIsLoadingPatient(true)
      getUserDoc(patientId)
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
      setPatient(null)
      setIsLoadingPatient(false)
    }
  }, [patientId])

  const handleSaveField = (field: SoapFieldKey) => {
    saveField(field, soapData[field])
  }

  const renderSection = (
    field: SoapFieldKey,
    title: string,
    description: string,
    placeholder: string,
  ) => (
    <div className="flex flex-col gap-y-6">
      <div className="gay-y-2 flex flex-col">
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-2xl font-medium text-primary-500">{title}</h3>
          <div className="flex flex-row items-center gap-x-4">
            {editingFields[field] && (
              <span
                className="cursor-pointer text-primary-500 hover:text-primary-500/60"
                onClick={() => handleSaveField(field)}
              >
                <FileDownloadDoneIcon fontSize="small" />
              </span>
            )}
            {!editingFields[field] && (
              <span
                className="cursor-pointer text-primary-500 hover:text-primary-500/60"
                onClick={() => startEditing(field)}
              >
                <EditIcon fontSize="small" />
              </span>
            )}
          </div>
        </div>
        <p className="text-lg text-gray-500">{description}</p>
      </div>
      <Textarea
        value={soapData[field]}
        onChange={(e) => updateLocalData(field, e.target.value)}
        disabled={!editingFields[field]}
        className="min-h-[160px] resize-none rounded-sm border border-primary-500 text-black"
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <>
      <div className="flex flex-row items-center justify-end gap-x-20">
        <span
          className={cn(
            'cursor-pointer text-sm font-bold text-gray-500',
            activeTab === 'prontuario' &&
              'border-b-2 border-primary-500 text-primary-500',
          )}
          onClick={() => onChangeTab('prontuario')}
        >
          Prontuário
        </span>
        <span
          className={cn(
            'cursor-pointer text-sm font-bold text-gray-500',
            activeTab === 'soap' &&
              'border-b-2 border-primary-500 text-primary-500',
          )}
          onClick={() => onChangeTab('soap')}
        >
          Método SOAP
        </span>
      </div>

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
                      patientId={patientId || undefined}
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

      {activeTab === 'soap' && (
        <div className="mb-20 space-y-6">
          {renderSection(
            'subjective',
            'Subjetivo',
            'Relato do paciente: queixas, sintomas, histórico e percepções',
            'Digite o relato do paciente...',
          )}

          {renderSection(
            'objective',
            'Objetivo',
            'Dados observados: sinais vitais, exame físico, exames complementares',
            'Digite os dados observados...',
          )}

          {renderSection(
            'assessment',
            'Avaliação',
            'Interpretação clínica: hipóteses diagnósticas, diagnóstico diferencial e justificativa',
            'Digite a interpretação clínica...',
          )}

          {renderSection(
            'plan',
            'Plano',
            'Próximos passos do cuidado — exames, tratamentos, encaminhamentos e orientações',
            'Digite o plano de cuidado...',
          )}
        </div>
      )}
    </>
  )
}
