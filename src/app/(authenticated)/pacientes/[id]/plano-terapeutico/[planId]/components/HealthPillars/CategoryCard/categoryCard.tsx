'use client'

import { Check as CheckIcon } from 'lucide-react'
import { X as CloseIcon } from 'lucide-react'
import { Pencil as EditOutlinedIcon } from 'lucide-react'
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
import { useUpdateLifestyleCategory } from '@/hooks/queries/useHealthPillarLifestyleCategories'
import { LifestyleCategoryEntity } from '@/types/entities/healthPillar'
interface CategoryCardProps {
  category: LifestyleCategoryEntity
  patientId: string
  planId: string
  pillarId: string
  onEdit: (category: LifestyleCategoryEntity) => void
  hasEditPermission?: boolean
  editTooltip?: string
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

const formatWeightParameter = (
  desiredParameter: number | string | object | undefined,
) => {
  if (!desiredParameter) return ''

  // Se já for um objeto, converte para string primeiro
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
    // Se for objeto (novo formato), usar diretamente
    const parsed: Record<string, unknown> = desiredParameter as Record<
      string,
      unknown
    >

    if (typeof parsed === 'object' && parsed !== null) {
      const parts: string[] = []
      if (parsed.currentWeight) {
        parts.push(`Peso atual: ${parsed.currentWeight}kg`)
      }
      if (parsed.objective && parsed.quantity) {
        const objectiveText =
          parsed.objective === 'Perder' ? 'Perder' : 'Ganhar'
        parts.push(`Objetivo: ${objectiveText} ${parsed.quantity}kg`)
      }
      if (parsed.deadline && parsed.deadlineUnit) {
        const deadlineUnitText =
          parsed.deadlineUnit === 'Meses'
            ? 'meses'
            : parsed.deadlineUnit === 'Semanas'
              ? 'semanas'
              : 'dias'
        parts.push(`Prazo: ${parsed.deadline} ${deadlineUnitText}`)
      }
      return parts.join(' • ')
    }
    return `${desiredParameter}kg`
  } catch {
    // Se não for objeto ou JSON, retorna como número simples
    return `${desiredParameter}kg`
  }
}

const formatStepsParameter = (
  desiredParameter: number | string | object | undefined,
) => {
  if (!desiredParameter) return ''

  try {
    // Se for objeto (novo formato), usar diretamente
    const parsed: Record<string, unknown> = desiredParameter as Record<
      string,
      unknown
    >

    if (typeof parsed === 'object' && parsed !== null && parsed.unit) {
      const quantity =
        (parsed.quantity as number) ||
        (parsed.desiredParameter as number) ||
        (desiredParameter as number)
      const unit = parsed.unit === 'Km' ? 'km' : 'passos'
      const formattedQuantity = new Intl.NumberFormat('pt-BR').format(quantity)
      return `${formattedQuantity} ${unit}`
    }
    // Se não for objeto, assume passos
    const formattedQuantity = new Intl.NumberFormat('pt-BR').format(
      Number(desiredParameter),
    )
    return `${formattedQuantity} passos`
  } catch {
    // Se não for objeto ou JSON, retorna como número simples (assume passos)
    return `${desiredParameter} passos`
  }
}

const formatCalorieValue = (value: number | string | object | undefined) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number') {
    return `${new Intl.NumberFormat('pt-BR').format(value)}kcal`
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return `${new Intl.NumberFormat('pt-BR').format(parsed)}kcal`
    }
    return `${value}kcal`
  }
  if (typeof value === 'object') {
    const parsedValue =
      (value as { quantity?: number; desiredParameter?: number }).quantity ||
      (value as { quantity?: number; desiredParameter?: number })
        .desiredParameter
    if (parsedValue !== undefined) {
      return `${new Intl.NumberFormat('pt-BR').format(parsedValue)}kcal`
    }
  }
  return ''
}

export function CategoryCard({
  category,
  patientId,
  planId,
  pillarId,
  onEdit,
  hasEditPermission = true,
  editTooltip,
}: CategoryCardProps) {
  const { mutateAsync: updateCategory } = useUpdateLifestyleCategory()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      await updateCategory({
        patientId,
        planId,
        pillarId,
        categoryId: category.id,
        data: {
          status: checked ? 'Ativa' : 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar status da categoria:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await updateCategory({
        patientId,
        planId,
        pillarId,
        categoryId: category.id,
        data: {
          approvalStatus: 'approved',
        },
      })
    } catch (error) {
      console.error('Erro ao aprovar categoria:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    setIsUpdating(true)
    try {
      await updateCategory({
        patientId,
        planId,
        pillarId,
        categoryId: category.id,
        data: {
          approvalStatus: 'rejected',
          status: 'Desativada',
        },
      })
    } catch (error) {
      console.error('Erro ao rejeitar categoria:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const isActive = category.status === 'Ativa'
  const isAchieved = category.status === 'Atingida'
  const isPending =
    category.aiGenerated &&
    (category.approvalStatus === 'pending' || !category.approvalStatus)
  const isApproved = category.approvalStatus === 'approved'
  const isMovementGoal =
    category.type === 'Movimentos - Passos' ||
    category.type === 'Movimentos - Gasto Calórico'
  const movementGoalBadgeLabel =
    category.type === 'Movimentos - Passos'
      ? 'Meta de passos diários'
      : 'Meta de gasto calórico'
  const stepsTitleValue = formatStepsParameter(category.desiredParameter)
  const calorieTitleValue = formatCalorieValue(category.desiredParameter)
  const movementTitle =
    category.type === 'Movimentos - Passos'
      ? stepsTitleValue
        ? `${stepsTitleValue}`
        : 'Meta de passos diários'
      : calorieTitleValue
        ? `Gastar ${calorieTitleValue}`
        : 'Meta de gasto calórico'

  if (isMovementGoal) {
    return (
      <Card
        className={`rounded-2xl bg-white p-4 ${
          isPending
            ? 'border-2 border-dashed border-[#EB34EF]'
            : isApproved
              ? 'border-0 shadow-lg'
              : 'border border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`${getStatusBadgeColor(category.status)} border px-2 py-0.5 text-xs font-medium`}
              >
                {category.status}
              </Badge>
              <Badge
                variant="outline"
                className={`${
                  isPending
                    ? 'border-pink-200 bg-pink-50 text-pink-700'
                    : 'border-purple-200 bg-purple-50 text-purple-700'
                } px-2 py-0.5 text-xs font-medium`}
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
                {movementGoalBadgeLabel}
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
              {movementTitle}
            </h4>
            <p className="mt-1 text-sm text-gray-600">Diariamente</p>
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {category.aiGenerated
                    ? 'Criado por IA'
                    : `Criado em ${formatDate(category.createdAt)}`}
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
            <RestrictedButton
              onClick={() => onEdit(category)}
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
          </div>
        </div>
      </Card>
    )
  }

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
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900">
                {category.type}
              </h4>
              <Badge
                variant="outline"
                className={`${getStatusBadgeColor(category.status)} border px-2 py-0.5 text-xs font-medium`}
              >
                {category.status}
              </Badge>
            </div>
            {category.desiredParameter && (
              <p className="mb-2 text-xs text-gray-600">
                {category.type === 'Peso'
                  ? formatWeightParameter(category.desiredParameter)
                  : category.type === 'Hidratação'
                    ? `Parâmetro desejável: ${category.desiredParameter}ml`
                    : category.type === 'Movimentos - Gasto Calórico'
                      ? `Parâmetro desejável: ${category.desiredParameter} kcal`
                      : category.type === 'Movimentos - Passos'
                        ? `Parâmetro desejável: ${formatStepsParameter(category.desiredParameter)}`
                        : category.type === 'Alimentação'
                          ? `Parâmetro desejável: ${category.desiredParameter} kcal`
                          : `Parâmetro desejável: ${category.desiredParameter}ml`}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-500">
                {category.aiGenerated
                  ? 'Criado por IA'
                  : `Criado em ${formatDate(category.createdAt)}`}
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
            onClick={() => onEdit(category)}
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
