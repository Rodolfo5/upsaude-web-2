'use client'

import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { RestrictedButton } from '@/components/atoms/RestrictedButton/restrictedButton'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { ExerciseRecommendationDetailsModal } from '@/components/organisms/Modals/ExerciseRecommendationDetailsModal/exerciseRecommendationDetailsModal'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFindDoctorById } from '@/hooks/queries/useFindDoctorById'
import {
  useUpdateActivity,
  useDeleteActivity,
} from '@/hooks/queries/useHealthPillarActivities'
import { ActivityEntity, GoalEntity } from '@/types/entities/healthPillar'

interface ActivityCardProps {
  activity: ActivityEntity
  goal: GoalEntity | null
  patientId: string
  planId: string
  pillarId: string
  goalId: string
  onEdit: (activity: ActivityEntity) => void
  isBiomarker?: boolean // Indica se é uma atividade de biomarcador
  hasEditPermission?: boolean
  editTooltip?: string
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Ativa':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Realizada':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Desativada':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR').format(d)
  } catch {
    return '-'
  }
}

const formatActivityDescription = (
  description: string | undefined,
  activityName: string,
): string => {
  if (!description) return ''

  // Verificar se é meta de passos ou meta de gasto calórico
  const isStepsGoal = activityName === 'Meta de passos'
  const isCalorieGoal = activityName === 'Meta de gasto calórico'

  if (isStepsGoal || isCalorieGoal) {
    try {
      const parsed = JSON.parse(description)
      if (parsed.unit && parsed.quantity) {
        const formattedQuantity = new Intl.NumberFormat('pt-BR').format(
          parsed.quantity,
        )
        return `${formattedQuantity} ${parsed.unit.toLowerCase()}`
      }
    } catch {
      // Se não for JSON válido, retorna a descrição original
      return description
    }
  }

  return description
}

const formatExerciseFrequency = (activity: ActivityEntity) => {
  if (activity.frequencyValue && activity.frequencyUnit) {
    return `${activity.frequencyValue}x na ${activity.frequencyUnit.toLowerCase()}`
  }
  if (activity.frequency) {
    const match = activity.frequency.match(/^(\d+)x\s*(.+)$/)
    if (match) {
      return `${match[1]}x na ${match[2].toLowerCase()}`
    }
    return activity.frequency
  }
  return ''
}

const formatExerciseTitle = (activity: ActivityEntity) => {
  const modalityValue = Array.isArray(activity.modality)
    ? activity.modality
    : activity.modality
      ? [activity.modality]
      : []
  const categoryValue = Array.isArray(activity.category)
    ? activity.category
    : activity.category
      ? [activity.category]
      : []
  if (categoryValue.length > 0 && modalityValue.length > 0) {
    return `${modalityValue.join(', ')}: ${categoryValue.join(', ')}`
  }
  if (modalityValue.length > 0) {
    return `${modalityValue.join(', ')}`
  }
  if (categoryValue.length > 0) {
    return `${categoryValue.join(', ')}`
  }
  return activity.name
}

export function ActivityCard({
  activity,
  goal,
  patientId,
  planId,
  pillarId,
  goalId,
  onEdit,
  isBiomarker = false,
  hasEditPermission = true,
  editTooltip,
}: ActivityCardProps) {
  const { mutateAsync: updateActivity } = useUpdateActivity()
  const { mutateAsync: deleteActivity, isPending: isDeleting } =
    useDeleteActivity()
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const { data: doctor } = useFindDoctorById(activity.doctorId)

  // Verificar se é recomendação de exercício
  const isExerciseRecommendation = activity.name === 'Recomendação de exercício'

  // Detectar se é biomarcador baseado no nome da atividade ou goal
  const isBiomarkerActivity =
    isBiomarker ||
    (goal &&
      (goal.name?.includes('Glicemia') ||
        goal.name?.includes('Pressão') ||
        goal.name?.includes('Frequência') ||
        goal.name?.includes('Oximetria') ||
        goal.name?.includes('Temperatura') ||
        activity.name?.toLowerCase().includes('medir') ||
        activity.name?.toLowerCase().includes('aferir')))

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      await updateActivity({
        patientId,
        planId,
        pillarId,
        goalId,
        activityId: activity.id,
        data: {
          status: checked ? 'Ativa' : 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar status da atividade:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteActivity({
        patientId,
        planId,
        pillarId,
        goalId,
        activityId: activity.id,
      })
      setDeleteModalOpen(false)
    } catch (error) {
      console.error('Erro ao deletar atividade:', error)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await updateActivity({
        patientId,
        planId,
        pillarId,
        goalId,
        activityId: activity.id,
        data: {
          approvalStatus: 'approved',
        },
      })
    } catch (error) {
      console.error('Erro ao aprovar atividade:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    setIsUpdating(true)
    try {
      await updateActivity({
        patientId,
        planId,
        pillarId,
        goalId,
        activityId: activity.id,
        data: {
          approvalStatus: 'rejected',
          status: 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao rejeitar atividade:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const isPending =
    activity.aiGenerated &&
    (activity.approvalStatus === 'pending' || !activity.approvalStatus)
  const isApproved = activity.approvalStatus === 'approved'

  // Formatar frequência para biomarcadores
  const formatFrequency = () => {
    if (activity.frequencyValue && activity.frequencyUnit) {
      return `${activity.frequencyValue}x na ${activity.frequencyUnit.toLowerCase()}`
    }
    if (activity.frequency) {
      // Parse formato "3x Semana"
      const match = activity.frequency.match(/^(\d+)x\s*(.+)$/)
      if (match) {
        return `${match[1]}x na ${match[2].toLowerCase()}`
      }
      return activity.frequency
    }
    return ''
  }

  if (isBiomarkerActivity) {
    return (
      <>
        <Card
          className={`rounded-lg bg-white p-4 ${
            isPending
              ? 'border-2 border-dashed border-[#EB34EF]'
              : isApproved
                ? 'border-0 shadow-lg'
                : 'border border-gray-200'
          } ${activity.status === 'Desativada' ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${getStatusBadgeColor(activity.status)} border px-2 py-0.5 text-xs font-medium`}
                >
                  {activity.status}
                </Badge>
                {goal && (
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                  >
                    {goal.type || goal.name}
                  </Badge>
                )}
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-900">
                {activity.name}
              </h4>
              {activity.description && (
                <>
                  <p className="mb-2 text-sm text-gray-900">
                    {showMore
                      ? activity.description
                      : activity.description.length > 50
                        ? `${activity.description.substring(0, 50)}...`
                        : activity.description}
                  </p>
                  {activity.description.length > 50 && (
                    <button
                      onClick={() => setShowMore(!showMore)}
                      className="mb-3 text-sm font-medium text-purple-600 hover:text-purple-800"
                    >
                      {showMore ? 'Ver menos' : 'Ver mais...'}
                    </button>
                  )}
                </>
              )}
              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex flex-col gap-2">
                    {formatFrequency() && (
                      <span className="font-medium text-gray-900">
                        {formatFrequency()}
                      </span>
                    )}
                    <span className="text-gray-500">
                      {activity.aiGenerated
                        ? 'Criado por IA'
                        : `Criado em ${formatDate(activity.createdAt)}`}
                    </span>
                    {activity.endDate && (
                      <span className="font-medium text-gray-900">
                        Até {formatDate(activity.endDate)}
                      </span>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={handleApprove}
                        disabled={isUpdating}
                        className="rounded-full p-0.5 hover:bg-[#FCE4FF] disabled:opacity-50"
                        title="Aprovar"
                        variant="ghost"
                      >
                        <CheckIcon
                          className="text-[#EB34EF]"
                          fontSize="small"
                        />
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isUpdating}
                        className="rounded-full p-0.5 hover:bg-[#FCE4FF] disabled:opacity-50"
                        title="Rejeitar"
                        variant="ghost"
                      >
                        <CloseIcon
                          className="text-[#EB34EF]"
                          fontSize="small"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center gap-2">
              {activity.status !== 'Realizada' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={activity.status === 'Ativa'}
                          onCheckedChange={handleToggle}
                          disabled={isUpdating || !hasEditPermission}
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
              )}
              <RestrictedButton
                onClick={() => onEdit(activity)}
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
              >
                <EditOutlinedIcon fontSize="small" />
              </RestrictedButton>
            </div>
          </div>
        </Card>

        <ConfirmationModal
          isOpen={deleteModalOpen}
          setIsOpen={setDeleteModalOpen}
          title="Confirmar exclusão"
          description="Tem certeza que deseja excluir esta atividade?"
          content={`Atividade: ${activity.name}`}
          actionLabel="Excluir"
          actionButtonVariant="destructive"
          action={handleDelete}
          loading={isDeleting}
        />
      </>
    )
  }

  if (isExerciseRecommendation) {
    const approvalDate = activity.updatedAt || activity.createdAt
    const approvalText = activity.aiGenerated
      ? `Criado por IA${
          doctor?.name ? ` e aprovado por Dr. ${doctor.name}` : ''
        } em ${formatDate(approvalDate)}`
      : `Criado em ${formatDate(activity.createdAt)}`
    const exerciseFrequency = formatExerciseFrequency(activity)
    const intensityLabel = activity.intensity
      ? `Intensidade ${activity.intensity.toLowerCase()}`
      : ''
    const patientGuidelines = activity.patientGuidelines || activity.description

    return (
      <>
        <Card
          className={`rounded-2xl bg-white p-4 ${
            isPending
              ? 'border-2 border-dashed border-[#EB34EF]'
              : isApproved
                ? 'border-0 shadow-lg'
                : 'border border-gray-200 shadow-sm'
          } ${activity.status === 'Desativada' ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${getStatusBadgeColor(activity.status)} border px-2 py-0.5 text-xs font-medium`}
                >
                  {activity.status}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
                >
                  Movimentação
                </Badge>
                <Badge
                  variant="outline"
                  className={`${
                    isPending
                      ? 'border-pink-200 bg-pink-50 text-pink-700'
                      : 'border-purple-200 bg-purple-50 text-purple-700'
                  } px-2 py-0.5 text-xs font-medium`}
                >
                  Recomendação de exercício
                </Badge>
              </div>
              <h4
                className={`mt-3 text-base font-semibold ${
                  isPending
                    ? 'text-[#EB34EF]'
                    : isApproved
                      ? 'text-[#530570]'
                      : 'text-gray-900'
                }`}
              >
                {formatExerciseTitle(activity)}
              </h4>
              {patientGuidelines && (
                <p className="mt-1 text-sm text-gray-600">
                  {patientGuidelines}
                </p>
              )}
              <button
                onClick={() => setDetailsModalOpen(true)}
                className="mt-1 text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                Ver mais...
              </button>
              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{intensityLabel}</span>
                  <span>{exerciseFrequency}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {activity.aiGenerated
                      ? 'Criado por IA'
                      : `Criado em ${formatDate(activity.createdAt)}`}
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
                        <CheckIcon
                          className="text-[#EB34EF]"
                          fontSize="small"
                        />
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={isUpdating}
                        className="rounded-full p-0.5 hover:bg-[#FCE4FF] disabled:opacity-50"
                        title="Rejeitar"
                        variant="ghost"
                      >
                        <CloseIcon
                          className="text-[#EB34EF]"
                          fontSize="small"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activity.status !== 'Realizada' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={activity.status === 'Ativa'}
                          onCheckedChange={handleToggle}
                          disabled={isUpdating || !hasEditPermission}
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
              )}
              <RestrictedButton
                onClick={() => onEdit(activity)}
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
              >
                <EditOutlinedIcon fontSize="small" />
              </RestrictedButton>
            </div>
          </div>
        </Card>

        <ConfirmationModal
          isOpen={deleteModalOpen}
          setIsOpen={setDeleteModalOpen}
          title="Confirmar exclusão"
          description="Tem certeza que deseja excluir esta atividade?"
          content={`Atividade: ${activity.name}`}
          actionLabel="Excluir"
          actionButtonVariant="destructive"
          action={handleDelete}
          loading={isDeleting}
        />

        <ExerciseRecommendationDetailsModal
          isOpen={detailsModalOpen}
          setIsOpen={setDetailsModalOpen}
          activity={activity}
        />
      </>
    )
  }

  return (
    <>
      <Card
        className={`rounded-lg bg-white p-4 ${
          isPending
            ? 'border-2 border-dashed border-[#EB34EF]'
            : isApproved
              ? 'border-0 shadow-lg'
              : 'border border-gray-200'
        } ${activity.status === 'Desativada' ? 'opacity-60' : ''} ${
          activity.status === 'Realizada' ? '' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getStatusBadgeColor(activity.status)} border px-2 py-0.5 text-xs font-medium`}
              >
                {activity.status}
              </Badge>
              {goal && (
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                >
                  {goal.type || goal.name}
                </Badge>
              )}
            </div>
            <h4
              className={`mb-1 text-sm font-medium ${
                isPending
                  ? 'text-[#EB34EF]'
                  : isApproved
                    ? 'text-[#530570]'
                    : 'text-gray-900'
              }`}
            >
              {(() => {
                // Para recomendações de exercício, exibir categoria/esporte específico
                if (activity.name === 'Recomendação de exercício') {
                  const modalityValue = Array.isArray(activity.modality)
                    ? activity.modality
                    : activity.modality
                      ? [activity.modality]
                      : []
                  const categoryValue = Array.isArray(activity.category)
                    ? activity.category
                    : activity.category
                      ? [activity.category]
                      : []

                  // Priorizar exibir a categoria específica (esporte/categoria)
                  // Se temos categoria, exibir ela (é o mais específico)
                  if (categoryValue.length > 0) {
                    return categoryValue.join(', ')
                  }

                  // Se só temos modalidade, exibir ela como fallback
                  if (modalityValue.length > 0) {
                    return modalityValue.join(', ')
                  }
                }
                return activity.name
              })()}
            </h4>
            {activity.description && (
              <p className="mb-2 text-xs text-gray-600">
                {formatActivityDescription(activity.description, activity.name)}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {activity.frequency && <span>{activity.frequency}</span>}
              {activity.endDate && (
                <span>Até {formatDate(activity.endDate)}</span>
              )}
            </div>
            {/* Botão Ver mais para recomendações de exercício */}
            {isExerciseRecommendation && (
              <div className="mt-3 flex justify-start border-t border-gray-200 pt-2">
                <button
                  onClick={() => setDetailsModalOpen(true)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-800"
                >
                  Ver mais
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
              <span className="text-xs text-gray-500">
                {activity.aiGenerated
                  ? 'Criado por IA'
                  : `Criado em ${formatDate(activity.createdAt)}`}
              </span>
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
          <div className="ml-4 flex items-center gap-2">
            {activity.status !== 'Realizada' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Switch
                        checked={activity.status === 'Ativa'}
                        onCheckedChange={handleToggle}
                        disabled={isUpdating || !hasEditPermission}
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
            )}
            <RestrictedButton
              onClick={() => onEdit(activity)}
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
            >
              <EditOutlinedIcon fontSize="small" />
            </RestrictedButton>
          </div>
        </div>
      </Card>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta atividade?"
        content={`Atividade: ${activity.name}`}
        actionLabel="Excluir"
        actionButtonVariant="destructive"
        action={handleDelete}
        loading={isDeleting}
      />

      {isExerciseRecommendation && (
        <ExerciseRecommendationDetailsModal
          isOpen={detailsModalOpen}
          setIsOpen={setDetailsModalOpen}
          activity={activity}
        />
      )}
    </>
  )
}
