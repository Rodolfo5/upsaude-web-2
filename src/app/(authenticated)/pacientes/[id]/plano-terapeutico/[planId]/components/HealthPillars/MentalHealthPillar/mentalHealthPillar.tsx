'use client'

import { Plus as AddOutlinedIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { RestrictedButton } from '@/components/atoms/RestrictedButton/restrictedButton'
import { ActivityModal } from '@/components/organisms/Modals/ActivityModal/activityModal'
import { GoalModal } from '@/components/organisms/Modals/GoalModal/goalModal'
import { OrientationModal } from '@/components/organisms/Modals/OrientationModal/orientationModal'
import { useActivitiesByPillar } from '@/hooks/queries/useHealthPillarActivities'
import { useGoals } from '@/hooks/queries/useHealthPillarGoals'
import { useOrientationsByPillar } from '@/hooks/queries/useHealthPillarOrientations'
import { useTracksByPillar } from '@/hooks/queries/useHealthPillarTracks'
import { useTherapeuticPlanPermissions } from '@/hooks/useTherapeuticPlanPermissions'
import {
  GoalEntity,
  ActivityEntity,
  OrientationEntity,
} from '@/types/entities/healthPillar'

import { ActivityCard } from '../ActivityCard/activityCard'
import { GoalCard } from '../GoalCard/goalCard'
import { OrientationCard } from '../OrientationCard/orientationCard'
import { TrackCard } from '../TrackCard/trackCard'

interface MentalHealthPillarProps {
  patientId: string
  planId: string
  pillarId: string
}

const mentalHealthGoalTypes: Array<'Qualidade de Sono' | 'Estresse' | 'Humor'> =
  ['Qualidade de Sono', 'Estresse', 'Humor']

export function MentalHealthPillar({
  patientId,
  planId,
  pillarId,
}: MentalHealthPillarProps) {
  const { permissions } = useTherapeuticPlanPermissions(planId, patientId)
  const { data: goals = [] } = useGoals(patientId, planId, pillarId)
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
  const { data: allTracks = [] } = useTracksByPillar(
    patientId,
    planId,
    pillarId,
  )

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<GoalEntity | null>(null)
  const [defaultGoalType, setDefaultGoalType] = useState<
    'Qualidade de Sono' | 'Estresse' | 'Humor' | 'Outros' | undefined
  >(undefined)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityEntity | null>(null)
  const [orientationModalOpen, setOrientationModalOpen] = useState(false)
  const [selectedOrientation, setSelectedOrientation] =
    useState<OrientationEntity | null>(null)
  const router = useRouter()
  const [defaultGoalId, setDefaultGoalId] = useState<string>('')

  const handleAddActivity = (goalId?: string) => {
    setDefaultGoalId(goalId || '')
    setSelectedActivity(null)
    setActivityModalOpen(true)
  }

  const handleAddOrientation = (goalId?: string) => {
    setDefaultGoalId(goalId || '')
    setSelectedOrientation(null)
    setOrientationModalOpen(true)
  }

  const handleAddTrack = () => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}/trilha/new`,
    )
  }

  return (
    <div className="space-y-8">
      {/* Metas Section */}
      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">Metas</h3>
          <p className="text-sm text-gray-600">
            Defina os objetivos clínicos e acompanhe o progresso do paciente ao
            longo do tratamento
          </p>
        </div>

        {/* Botão à esquerda + cards de metas à direita */}
        <div className="flex flex-wrap items-stretch gap-4">
          <RestrictedButton
            hasPermission={permissions.canEditGoal('Saúde Mental')}
            tooltipMessage={permissions.getTooltip('Saúde Mental')}
            onClick={() => {
              setSelectedGoal(null)
              setDefaultGoalType(undefined)
              setGoalModalOpen(true)
            }}
            variant="outline"
            className="flex min-h-[150px] w-40 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="small" />
            <span className="text-sm font-medium">Adicionar meta</span>
          </RestrictedButton>

          <div className="flex flex-1 flex-wrap gap-4">
            {mentalHealthGoalTypes.map((type) => {
              const goal = goals.find((g) => g.type === type)
              if (goal) {
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    patientId={patientId}
                    planId={planId}
                    pillarId={pillarId}
                    onEdit={(g) => {
                      setSelectedGoal(g)
                      setGoalModalOpen(true)
                    }}
                    hasEditPermission={permissions.canEditGoal('Saúde Mental')}
                    editTooltip={permissions.getTooltip('Saúde Mental')}
                  />
                )
              }
              return null
            })}
            {goals
              .filter((g) => g.type === 'Outros')
              .map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  patientId={patientId}
                  planId={planId}
                  pillarId={pillarId}
                  onEdit={(g) => {
                    setSelectedGoal(g)
                    setGoalModalOpen(true)
                  }}
                  hasEditPermission={permissions.canEditGoal('Saúde Mental')}
                  editTooltip={permissions.getTooltip('Saúde Mental')}
                />
              ))}
          </div>
        </div>
      </section>

      {/* Atividades Section */}
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
            const goal = goals.find((g) => g.id === activity.goalId) || null
            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                goal={goal}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={activity.goalId}
                onEdit={(a) => {
                  setSelectedActivity(a)
                  setActivityModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateActivity(
                  'Saúde Mental',
                )}
                editTooltip={permissions.getTooltip('Saúde Mental')}
              />
            )
          })}
          <RestrictedButton
            onClick={() => handleAddActivity()}
            hasPermission={permissions.canCreateActivity('Saúde Mental')}
            tooltipMessage={permissions.getTooltip('Saúde Mental')}
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
            const goal = goals.find((g) => g.id === orientation.goalId) || null
            return (
              <OrientationCard
                key={orientation.id}
                orientation={orientation}
                goal={goal}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={orientation.goalId}
                onEdit={(o) => {
                  setSelectedOrientation(o)
                  setOrientationModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateOrientation(
                  'Saúde Mental',
                )}
                editTooltip={permissions.getTooltip('Saúde Mental')}
              />
            )
          })}
          <RestrictedButton
            onClick={() => handleAddOrientation()}
            hasPermission={permissions.canCreateOrientation('Saúde Mental')}
            tooltipMessage={permissions.getTooltip('Saúde Mental')}
            className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="large" />
            <span className="text-sm font-medium">Adicionar</span>
          </RestrictedButton>
        </div>
      </section>

      {/* Trilhas Section */}
      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Trilhas
          </h3>
          <p className="text-sm text-gray-600">
            Crie uma jornada de atividades
          </p>
        </div>
        <div className="space-y-4">
          {allTracks.map((track) => {
            const goal = goals.find((g) => g.id === track.goalId) || null
            return (
              <TrackCard
                key={track.id}
                track={track}
                goal={goal}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={track.goalId}
              />
            )
          })}
          <RestrictedButton
            onClick={() => handleAddTrack()}
            hasPermission={permissions.canEditTrack()}
            tooltipMessage={permissions.getTooltip('Saúde Mental')}
            variant="outline"
            className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="small" className="mr-2" />
            Adicionar
          </RestrictedButton>
        </div>
      </section>

      {/* Modals */}
      <GoalModal
        isOpen={goalModalOpen}
        setIsOpen={setGoalModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        pillarType="Saúde Mental"
        goal={selectedGoal}
        defaultType={defaultGoalType}
        onSuccess={() => {
          setSelectedGoal(null)
          setDefaultGoalType(undefined)
        }}
      />

      <ActivityModal
        isOpen={activityModalOpen}
        setIsOpen={setActivityModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        pillarType="Saúde Mental"
        goals={goals}
        activity={selectedActivity}
        defaultGoalId={defaultGoalId}
        onSuccess={() => {
          setSelectedActivity(null)
          setDefaultGoalId('')
        }}
      />

      <OrientationModal
        isOpen={orientationModalOpen}
        setIsOpen={setOrientationModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        goals={goals}
        orientation={selectedOrientation}
        defaultGoalId={defaultGoalId}
        onSuccess={() => {
          setSelectedOrientation(null)
          setDefaultGoalId('')
        }}
      />
    </div>
  )
}
