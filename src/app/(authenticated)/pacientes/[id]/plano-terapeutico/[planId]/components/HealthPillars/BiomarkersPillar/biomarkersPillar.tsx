'use client'

import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useMemo, useRef, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { RestrictedButton } from '@/components/atoms/RestrictedButton/restrictedButton'
import { ActivityModal } from '@/components/organisms/Modals/ActivityModal/activityModal'
import { BiomarkerModal } from '@/components/organisms/Modals/BiomarkerModal/biomarkerModal'
import { OrientationModal } from '@/components/organisms/Modals/OrientationModal/orientationModal'
import { useBiomarkersByPillar } from '@/hooks/queries/useBiomarkers'
import { useActivitiesByPillar } from '@/hooks/queries/useHealthPillarActivities'
import { useOrientationsByPillar } from '@/hooks/queries/useHealthPillarOrientations'
import { useTherapeuticPlanPermissions } from '@/hooks/useTherapeuticPlanPermissions'
import { BiomarkerEntity } from '@/types/entities/biomarker'
import {
  ActivityEntity,
  OrientationEntity,
} from '@/types/entities/healthPillar'

import { ActivityCard } from '../ActivityCard/activityCard'
import { BiomarkerCard } from '../BiomarkerCard/biomarkerCard'
import { OrientationCard } from '../OrientationCard/orientationCard'

interface BiomarkersPillarProps {
  patientId: string
  planId: string
  pillarId: string
}

export function BiomarkersPillar({
  patientId,
  planId,
  pillarId,
}: BiomarkersPillarProps) {
  const { permissions } = useTherapeuticPlanPermissions(planId, patientId)
  const { data: biomarkers = [], isLoading } = useBiomarkersByPillar(
    patientId,
    planId,
    pillarId,
  )
  const { data: allActivities = [] } = useActivitiesByPillar(
    patientId,
    planId,
    pillarId,
  )
  const { data: allOrientations = [] } = useOrientationsByPillar(
    patientId,
    planId,
    pillarId,
  )

  const [biomarkerModalOpen, setBiomarkerModalOpen] = useState(false)
  const [selectedBiomarker, setSelectedBiomarker] =
    useState<BiomarkerEntity | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityEntity | null>(null)
  const [orientationModalOpen, setOrientationModalOpen] = useState(false)
  const [selectedOrientation, setSelectedOrientation] =
    useState<OrientationEntity | null>(null)
  const [defaultBiomarkerId, setDefaultBiomarkerId] = useState<string>('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const orderedBiomarkers = useMemo(() => biomarkers, [biomarkers])

  const getBiomarkerLabel = (type: string): string => {
    const map: Record<string, string> = {
      glicemia: 'Glicemia',
      bloodGlucose: 'Glicemia',
      pressao_arterial: 'Pressão Arterial',
      bloodPressure: 'Pressão Arterial',
      frequencia_cardiaca: 'Frequência Cardíaca',
      heartRate: 'Frequência Cardíaca',
      oximetria: 'Oximetria',
      oximetry: 'Oximetria',
      temperatura: 'Temperatura',
      temperature: 'Temperatura',
    }
    return map[type] || type
  }

  // Converter biomarkers para formato de goals para usar nos modais
  const biomarkersAsGoals = useMemo(() => {
    return biomarkers.map((biomarker) => ({
      id: biomarker.id,
      pillarId: biomarker.pillarId,
      name: getBiomarkerLabel(biomarker.type),
      type: undefined,
      status: 'Ativa' as const,
      doctorId: biomarker.editedBy || biomarker.createdBy,
      createdAt: biomarker.createdAt,
      updatedAt: biomarker.updatedAt,
    }))
  }, [biomarkers])

  const handleAddActivity = (biomarkerId?: string) => {
    setDefaultBiomarkerId(biomarkerId || '')
    setSelectedActivity(null)
    setActivityModalOpen(true)
  }

  const handleAddOrientation = (biomarkerId?: string) => {
    setDefaultBiomarkerId(biomarkerId || '')
    setSelectedOrientation(null)
    setOrientationModalOpen(true)
  }

  const handlePrev = () => {
    if (listRef.current) {
      const cardWidth = 320 + 16
      listRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (listRef.current) {
      const cardWidth = 320 + 16
      listRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!listRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - listRef.current.offsetLeft)
    setScrollLeft(listRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !listRef.current) return
    e.preventDefault()
    const x = e.pageX - listRef.current.offsetLeft
    const walk = x - startX
    listRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!listRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - listRef.current.offsetLeft)
    setScrollLeft(listRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !listRef.current) return
    const x = e.touches[0].pageX - listRef.current.offsetLeft
    const walk = x - startX
    listRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  if (isLoading) {
    return <LoadingComponent />
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-lg font-semibold text-primary-700">
              Biomarcadores de Saúde (Valores de Referência)
            </h3>
            <p className="text-sm text-gray-600">
              Consulte e defina os parâmetros normais para interpretar medições
              de sinais vitais com precisão
            </p>
          </div>
          {orderedBiomarkers.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="rounded-full border border-gray-200 p-2 hover:bg-gray-100"
                title="Anterior"
              >
                <ChevronLeftIcon fontSize="small" />
              </button>
              <button
                onClick={handleNext}
                className="rounded-full border border-gray-200 p-2 hover:bg-gray-100"
                title="Próximo"
              >
                <ChevronRightIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>
        {orderedBiomarkers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              Nenhum biomarcador cadastrado ainda.
            </p>
          </div>
        ) : (
          <div
            ref={listRef}
            className="flex cursor-grab select-none snap-x snap-mandatory gap-24 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {orderedBiomarkers.map((biomarker) => (
              <div
                key={biomarker.id}
                className="w-[320px] shrink-0 snap-center"
              >
                <BiomarkerCard
                  biomarker={biomarker}
                  patientId={patientId}
                  planId={planId}
                  pillarId={pillarId}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Atividades
          </h3>
          <p className="text-sm text-gray-600">
            Registre as ações práticas que devem ser realizadas pelo paciente
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allActivities.map((activity) => {
            const biomarker =
              biomarkers.find((b) => b.id === activity.goalId) || null
            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                goal={
                  biomarker
                    ? {
                        id: biomarker.id,
                        pillarId: biomarker.pillarId,
                        name: getBiomarkerLabel(biomarker.type),
                        status: 'Ativa',
                        doctorId: biomarker.editedBy || biomarker.createdBy,
                        createdAt: biomarker.createdAt,
                        updatedAt: biomarker.updatedAt,
                      }
                    : null
                }
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={activity.goalId}
                isBiomarker={true}
                onEdit={(a) => {
                  setSelectedActivity(a)
                  setActivityModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateActivity(
                  'Biomarcadores de Saúde',
                )}
                editTooltip={permissions.getTooltip('Biomarcadores de Saúde')}
              />
            )
          })}
          <RestrictedButton
            onClick={() => handleAddActivity()}
            hasPermission={permissions.canCreateActivity(
              'Biomarcadores de Saúde',
            )}
            tooltipMessage={permissions.getTooltip('Biomarcadores de Saúde')}
            className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="large" />
            <span className="text-sm font-medium">Adicionar</span>
          </RestrictedButton>
        </div>
      </section>

      {/* Orientações Section */}
      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Orientações
          </h3>
          <p className="text-sm text-gray-600">
            Disponibilize recomendações e instruções personalizadas para o
            cuidado contínuo do paciente
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allOrientations.map((orientation) => {
            const biomarker =
              biomarkers.find((b) => b.id === orientation.goalId) || null
            return (
              <OrientationCard
                key={orientation.id}
                orientation={orientation}
                goal={
                  biomarker
                    ? {
                        id: biomarker.id,
                        pillarId: biomarker.pillarId,
                        name: getBiomarkerLabel(biomarker.type),
                        status: 'Ativa',
                        doctorId: biomarker.editedBy || biomarker.createdBy,
                        createdAt: biomarker.createdAt,
                        updatedAt: biomarker.updatedAt,
                      }
                    : null
                }
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={orientation.goalId}
                onEdit={(o) => {
                  setSelectedOrientation(o)
                  setOrientationModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateOrientation(
                  'Biomarcadores de Saúde',
                )}
                editTooltip={permissions.getTooltip('Biomarcadores de Saúde')}
              />
            )
          })}
          <RestrictedButton
            onClick={() => handleAddOrientation()}
            hasPermission={permissions.canCreateOrientation(
              'Biomarcadores de Saúde',
            )}
            tooltipMessage={permissions.getTooltip('Biomarcadores de Saúde')}
            className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="large" />
            <span className="text-sm font-medium">Adicionar</span>
          </RestrictedButton>
        </div>
      </section>

      <BiomarkerModal
        isOpen={biomarkerModalOpen}
        setIsOpen={setBiomarkerModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        biomarker={selectedBiomarker}
        onSuccess={() => {
          setSelectedBiomarker(null)
        }}
      />

      <ActivityModal
        isOpen={activityModalOpen}
        setIsOpen={setActivityModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        pillarType="Biomarcadores de Saúde"
        goals={biomarkersAsGoals}
        activity={selectedActivity}
        defaultGoalId={defaultBiomarkerId}
        onSuccess={() => {
          setSelectedActivity(null)
          setDefaultBiomarkerId('')
        }}
      />

      <OrientationModal
        isOpen={orientationModalOpen}
        setIsOpen={setOrientationModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        goals={biomarkersAsGoals}
        orientation={selectedOrientation}
        defaultGoalId={defaultBiomarkerId}
        onSuccess={() => {
          setSelectedOrientation(null)
          setDefaultBiomarkerId('')
        }}
      />
    </div>
  )
}
