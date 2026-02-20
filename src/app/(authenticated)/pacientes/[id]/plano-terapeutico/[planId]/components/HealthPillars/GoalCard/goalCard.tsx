'use client'

import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Moon, Frown, Smile, Target } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { RestrictedButton } from '@/components/atoms/RestrictedButton/restrictedButton'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useActivitiesByPillar } from '@/hooks/queries/useHealthPillarActivities'
import { useUpdateGoal } from '@/hooks/queries/useHealthPillarGoals'
import { GoalEntity, MentalHealthGoalType } from '@/types/entities/healthPillar'

interface GoalCardProps {
  goal: GoalEntity
  patientId: string
  planId: string
  pillarId: string
  onEdit: (goal: GoalEntity) => void
  hasEditPermission?: boolean
  editTooltip?: string
}

const getGoalIcon = (type?: MentalHealthGoalType) => {
  switch (type) {
    case 'Qualidade de Sono':
      return <Moon className="h-5 w-5 text-purple-600" />
    case 'Estresse':
      return <Frown className="h-5 w-5 text-purple-600" />
    case 'Humor':
      return <Smile className="h-5 w-5 text-purple-600" />
    case 'Outros':
      return <Target className="h-5 w-5 text-purple-600" />
    default:
      return null
  }
}

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    Ativa: 'bg-blue-100 text-blue-800 border-blue-200',
    Atingida: 'bg-green-100 text-green-800 border-green-200',
    Desativada: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const formatDate = (date: Date | string) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR').format(d)
  } catch {
    return '-'
  }
}

const getParameterLabel = (type?: MentalHealthGoalType) => {
  switch (type) {
    case 'Qualidade de Sono':
      return 'Horas desejadas'
    case 'Estresse':
      return 'Nível desejado'
    case 'Humor':
      return 'Nível desejado'
    default:
      return 'Parâmetro desejável'
  }
}

const formatParameter = (
  parameter: number | string | undefined,
  type?: MentalHealthGoalType,
) => {
  if (parameter === undefined || parameter === null) return null

  switch (type) {
    case 'Qualidade de Sono':
      return typeof parameter === 'number'
        ? `${parameter} Parâmetro desejável`
        : `${parameter} Parâmetro desejável`
    case 'Estresse':
      return String(parameter)
    case 'Humor':
      return String(parameter)
    default:
      return String(parameter)
  }
}

export function GoalCard({
  goal,
  patientId,
  planId,
  pillarId,
  onEdit,
  hasEditPermission = true,
  editTooltip,
}: GoalCardProps) {
  const { mutateAsync: updateGoal } = useUpdateGoal()
  const { data: allActivities = [] } = useActivitiesByPillar(
    patientId,
    planId,
    pillarId,
  )
  const [isUpdating, setIsUpdating] = useState(false)

  // Check if all activities for this custom goal are completed
  const goalActivities = allActivities.filter((a) => a.goalId === goal.id)

  const allActivitiesCompleted =
    goalActivities.length > 0 &&
    goalActivities.every((a) => a.status === 'Realizada')

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      await updateGoal({
        patientId,
        planId,
        pillarId,
        goalId: goal.id,
        data: {
          status: checked ? 'Ativa' : 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar status da meta:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await updateGoal({
        patientId,
        planId,
        pillarId,
        goalId: goal.id,
        data: {
          approvalStatus: 'approved',
        },
      })
    } catch (error) {
      console.error('Erro ao aprovar meta:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    setIsUpdating(true)
    try {
      await updateGoal({
        patientId,
        planId,
        pillarId,
        goalId: goal.id,
        data: {
          approvalStatus: 'rejected',
          status: 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao rejeitar meta:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const isActive = goal.status === 'Ativa'
  const isAchieved = goal.status === 'Atingida'
  const isPending =
    goal.aiGenerated &&
    (goal.approvalStatus === 'pending' || !goal.approvalStatus)
  const isApproved = goal.approvalStatus === 'approved'

  return (
    <Card
      className={`rounded-lg bg-white p-4 ${
        isPending
          ? 'border-2 border-dashed border-[#EB34EF]'
          : isApproved
            ? 'border-0 shadow-lg'
            : 'border border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start gap-3">
          {getGoalIcon(goal.type)}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4
                className={`text-sm font-medium ${
                  isPending
                    ? 'text-[#EB34EF]'
                    : isApproved
                      ? 'text-[#530570]'
                      : 'text-gray-900'
                }`}
              >
                {goal.type || goal.name}
              </h4>
              <Badge
                variant="outline"
                className={`${getStatusBadgeColor(goal.status)} border px-2 py-0.5 text-xs font-medium`}
              >
                {goal.status}
              </Badge>
              {/* {goal.aiGenerated && (
                <Badge
                  variant="secondary"
                  className={`ml-1 ${
                    isPending
                      ? 'border-pink-200 bg-pink-50 text-pink-700'
                      : 'border-purple-200 bg-purple-50 text-purple-700'
                  }`}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Gerado por IA
                </Badge>
              )} */}
            </div>
            {goal.type !== 'Outros' &&
              goal.desiredParameter !== undefined &&
              goal.desiredParameter !== null && (
                <p className="mb-2 text-xs text-gray-600">
                  {getParameterLabel(goal.type)}:{' '}
                  {formatParameter(goal.desiredParameter, goal.type)}
                </p>
              )}
            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-500">
                {goal.aiGenerated
                  ? 'Criado por IA'
                  : `Criado em ${formatDate(goal.createdAt)}`}
              </p>
              {isPending && (
                <div className="flex items-center gap-1">
                  <Button
                    onClick={handleApprove}
                    disabled={isUpdating}
                    className="rounded-full p-0.5 hover:bg-[#FCE4FF] disabled:opacity-50"
                    title="Aprovar"
                    variant="ghost"
                  >
                    <CheckIcon className="text-[#EB34EF]" fontSize="small" />
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isUpdating}
                    className="rounded-full p-0.5 hover:bg-[#FCE4FF] disabled:opacity-50"
                    title="Rejeitar"
                    variant="ghost"
                  >
                    <CloseIcon className="text-[#EB34EF]" fontSize="small" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={handleToggle}
                    disabled={isUpdating || isAchieved || !hasEditPermission}
                  />
                </span>
              </TooltipTrigger>
              {!hasEditPermission && editTooltip && (
                <TooltipContent className="max-w-xs bg-gray-900 text-white">
                  <p>{editTooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <RestrictedButton
            onClick={() => onEdit(goal)}
            hasPermission={hasEditPermission}
            tooltipMessage={editTooltip}
            className={`${
              isPending
                ? 'text-[#EB34EF] hover:text-[#EB34EF]'
                : isApproved
                  ? 'text-[#530570] hover:text-[#530570]'
                  : 'text-purple-600 hover:text-purple-800'
            }`}
            variant="ghost"
            icon={<EditOutlinedIcon fontSize="small" />}
          >
            {' '}
          </RestrictedButton>
        </div>
      </div>
    </Card>
  )
}
