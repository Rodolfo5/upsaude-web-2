'use client'

import { ArrowRight as ArrowForwardIcon } from 'lucide-react'
import { Check as CheckIcon } from 'lucide-react'
import { X as CloseIcon } from 'lucide-react'
import { Pencil as EditOutlinedIcon } from 'lucide-react'
import { ChevronUp as ExpandLessIcon } from 'lucide-react'
import { ChevronDown as ExpandMoreIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { RestrictedButton } from '@/components/atoms/RestrictedButton/restrictedButton'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { OrientationDetailsModal } from '@/components/organisms/Modals/OrientationDetailsModal/orientationDetailsModal'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DAYS_OF_WEEK } from '@/constants/menuRecommendation'
import {
  useDeleteOrientation,
  useUpdateOrientation,
} from '@/hooks/queries/useHealthPillarOrientations'
import { GoalEntity, OrientationEntity } from '@/types/entities/healthPillar'

interface OrientationCardProps {
  orientation: OrientationEntity
  goal: GoalEntity | null
  patientId: string
  planId: string
  pillarId: string
  goalId: string
  onEdit: (orientation: OrientationEntity) => void
  hasEditPermission?: boolean
  editTooltip?: string
}

const formatDate = (date: Date | string) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR').format(d)
  } catch {
    return '-'
  }
}

export function OrientationCard({
  orientation,
  goal,
  patientId,
  planId,
  pillarId,
  goalId,
  onEdit,
  hasEditPermission = true,
  editTooltip,
}: OrientationCardProps) {
  const { mutateAsync: deleteOrientation, isPending: isDeleting } =
    useDeleteOrientation()
  const { mutateAsync: updateOrientation } = useUpdateOrientation()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Estado para cardápio
  const isMenu =
    orientation.tags?.includes('cardápio') || !!orientation.menuData
  const [selectedDay, setSelectedDay] = useState<string>('Segunda')
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())

  const mealsForSelectedDay =
    orientation.menuData?.meals.filter(
      (meal) => meal.dayOfWeek === selectedDay,
    ) || []

  const toggleMealExpansion = (mealId: string) => {
    setExpandedMeals((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(mealId)) {
        newSet.delete(mealId)
      } else {
        newSet.add(mealId)
      }
      return newSet
    })
  }

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      await updateOrientation({
        patientId,
        planId,
        pillarId,
        goalId,
        orientationId: orientation.id,
        data: {
          status: checked ? 'Ativa' : 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar status da orientação:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOrientation({
        patientId,
        planId,
        pillarId,
        goalId,
        orientationId: orientation.id,
      })
      setDeleteModalOpen(false)
    } catch (error) {
      console.error('Erro ao deletar orientação:', error)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await updateOrientation({
        patientId,
        planId,
        pillarId,
        goalId,
        orientationId: orientation.id,
        data: {
          approvalStatus: 'approved',
        },
      })
    } catch (error) {
      console.error('Erro ao aprovar orientação:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    setIsUpdating(true)
    try {
      await updateOrientation({
        patientId,
        planId,
        pillarId,
        goalId,
        orientationId: orientation.id,
        data: {
          approvalStatus: 'rejected',
          status: 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao rejeitar orientação:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const isPending =
    orientation.aiGenerated &&
    (orientation.approvalStatus === 'pending' || !orientation.approvalStatus)
  const isApproved = orientation.approvalStatus === 'approved'

  return (
    <>
      <Card
        className={`rounded-lg bg-white p-4 ${
          isPending
            ? 'border-2 border-dashed border-[#EB34EF]'
            : isApproved
              ? 'border-0 shadow-lg'
              : 'border border-gray-200'
        } ${orientation.status === 'Desativada' ? 'opacity-60' : ''} ${
          isMenu ? 'col-span-full' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`border px-2 py-0.5 text-xs font-medium ${
                  orientation.status === 'Ativa'
                    ? 'border-purple-200 bg-purple-100 text-purple-800'
                    : 'border-gray-200 bg-gray-100 text-gray-800'
                }`}
              >
                {orientation.status}
              </Badge>
              {orientation.area && (
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                >
                  {orientation.area}
                </Badge>
              )}
              {isMenu && (
                <Badge
                  variant="outline"
                  className="border-pink-200 bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-800"
                >
                  Cardápio
                </Badge>
              )}
              {!orientation.area && !isMenu && goal && (
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                >
                  {goal.type || goal.name}
                </Badge>
              )}
            </div>
            <h4 className="mb-1 text-sm font-medium text-gray-900">
              {orientation.title}
            </h4>
            {orientation.description && (
              <p className="mb-2 line-clamp-2 text-xs text-gray-600">
                {orientation.description}
              </p>
            )}

            {/* Exibir refeições se for cardápio */}
            {isMenu && orientation.menuData?.meals && (
              <div className="mb-2 mt-3">
                {/* Tabs de dias da semana */}
                <div className="mb-3 flex gap-1 border-b border-gray-200">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setSelectedDay(day.value)}
                      className={`px-2 py-1 text-xs font-medium transition-colors ${
                        selectedDay === day.value
                          ? 'border-b-2 border-purple-600 text-purple-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {day.label.substring(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Lista de refeições do dia selecionado */}
                <div className="space-y-1">
                  {mealsForSelectedDay.length === 0 ? (
                    <p className="py-2 text-center text-xs text-gray-500">
                      Nenhuma refeição para este dia
                    </p>
                  ) : (
                    mealsForSelectedDay.map((meal) => {
                      const isExpanded = expandedMeals.has(meal.id)
                      const totalKcal = meal.foods.reduce(
                        (sum, food) => sum + parseFloat(food.kcal || '0'),
                        0,
                      )

                      return (
                        <div
                          key={meal.id}
                          className="rounded border border-gray-100 bg-gray-50"
                        >
                          <button
                            type="button"
                            onClick={() => toggleMealExpansion(meal.id)}
                            className="flex w-full items-center justify-between p-2 text-left"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ExpandLessIcon fontSize="small" />
                              ) : (
                                <ExpandMoreIcon fontSize="small" />
                              )}
                              <span className="text-xs font-medium text-gray-900">
                                {meal.mealType}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({meal.foods.length} alimento
                                {meal.foods.length !== 1 ? 's' : ''} •{' '}
                                {totalKcal} kcal)
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-white p-2">
                              <div className="space-y-1">
                                {meal.foods.map((food) => (
                                  <div
                                    key={food.id}
                                    className="rounded border border-gray-100 bg-gray-50 p-2"
                                  >
                                    <p className="text-xs font-medium text-gray-900">
                                      {food.name}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {food.portion} {food.portionUnit} •{' '}
                                      {food.kcal} kcal
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs text-gray-500">
                  {orientation.aiGenerated
                    ? 'Criado por IA'
                    : `Criado em ${formatDate(orientation.createdAt)}`}
                </p>
                {!isMenu && (
                  <Button
                    onClick={() => setDetailsModalOpen(true)}
                    variant="ghost"
                    className="flex items-center gap-1 text-xs text-[#530570] hover:text-[#792EBD]"
                  >
                    <ArrowForwardIcon fontSize="small" />
                    Ver mais
                  </Button>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Switch
                      checked={orientation.status === 'Ativa'}
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
            <RestrictedButton
              onClick={() => onEdit(orientation)}
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

      <ConfirmationModal
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta orientação?"
        content={`Orientação: ${orientation.title}`}
        actionLabel="Excluir"
        actionButtonVariant="destructive"
        action={handleDelete}
        loading={isDeleting}
      />

      <OrientationDetailsModal
        isOpen={detailsModalOpen}
        setIsOpen={setDetailsModalOpen}
        orientation={orientation}
        goalName={goal?.type || goal?.name}
      />
    </>
  )
}
