'use client'

import { Pencil as EditOutlinedIcon } from 'lucide-react'
import { ChevronUp as ExpandLessIcon } from 'lucide-react'
import { ChevronDown as ExpandMoreIcon } from 'lucide-react'
import { useState } from 'react'

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
import { DAYS_OF_WEEK } from '@/constants/menuRecommendation'
import { useDoctor } from '@/hooks/queries/useDoctor'
import { useUpdateMenu } from '@/hooks/queries/useHealthPillarMenu'
import { MenuEntity } from '@/types/entities/healthPillar'
interface MenuCardProps {
  menu: MenuEntity
  patientId: string
  planId: string
  pillarId: string
  onEdit: (menu: MenuEntity) => void
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

export function MenuCard({
  menu,
  patientId,
  planId,
  pillarId,
  onEdit,
  hasEditPermission = true,
  editTooltip,
}: MenuCardProps) {
  const { mutateAsync: updateMenu } = useUpdateMenu()
  const [isUpdating, setIsUpdating] = useState(false)

  const [selectedDay, setSelectedDay] = useState<string>('Segunda')
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())

  const mealsForSelectedDay =
    menu.menuData?.meals.filter((meal) => meal.dayOfWeek === selectedDay) || []

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
      await updateMenu({
        patientId,
        planId,
        pillarId,
        menuId: menu.id,
        data: {
          status: checked ? 'Ativa' : 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar status do cardápio:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card
      className={`col-span-full rounded-lg border border-gray-200 bg-white p-4 ${
        menu.status === 'Desativada' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className={`border px-2 py-0.5 text-xs font-medium ${
                menu.status === 'Ativa'
                  ? 'border-purple-200 bg-purple-100 text-purple-800'
                  : 'border-gray-200 bg-gray-100 text-gray-800'
              }`}
            >
              {menu.status}
            </Badge>
            <Badge
              variant="outline"
              className="border-pink-200 bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-800"
            >
              Cardápio
            </Badge>
          </div>
          <h4 className="mb-1 text-sm font-medium text-gray-900">
            {menu.title}
          </h4>
          {menu.description && (
            <p className="mb-2 line-clamp-2 text-xs text-gray-600">
              {menu.description}
            </p>
          )}
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <p className="text-xs text-gray-500">
              Criado em {formatDate(menu.createdAt)} por{' '}
              {useDoctor(menu.doctorId)?.name || 'Desconhecido'}
            </p>
          </div>

          {/* Exibir refeições */}
          {menu.menuData?.meals && (
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
                              {meal.foods.length !== 1 ? 's' : ''} • {totalKcal}{' '}
                              kcal)
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
        </div>
        <div className="ml-4 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch
                    checked={menu.status === 'Ativa'}
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
            onClick={() => onEdit(menu)}
            hasPermission={hasEditPermission}
            tooltipMessage={editTooltip}
            className="text-purple-600 hover:text-purple-800"
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
