'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useExercisesByTrack } from '@/hooks/queries/useHealthPillarExercises'
import { useUpdateTrack } from '@/hooks/queries/useHealthPillarTracks'
import {
  TrackEntity,
  GoalEntity,
  ExerciseEntity,
} from '@/types/entities/healthPillar'

interface TrackCardProps {
  track: TrackEntity
  goal: GoalEntity | null
  patientId: string
  planId: string
  pillarId: string
  goalId: string
}

const formatDate = (date: Date | string) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR').format(d)
  } catch {
    return '-'
  }
}

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'Finalizado':
      return (
        <Badge className="border-green-200 bg-green-100 text-green-800">
          Finalizado
        </Badge>
      )
    case 'Em progresso':
      return (
        <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
          Em progresso
        </Badge>
      )
    default:
      return (
        <Badge className="border-gray-200 bg-gray-100 text-gray-800">
          Não iniciado
        </Badge>
      )
  }
}

export function TrackCard({
  track,
  patientId,
  planId,
  pillarId,
  goalId,
}: TrackCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isActive, setIsActive] = useState(track.status !== 'Finalizado')
  const { mutateAsync: updateTrack } = useUpdateTrack()
  const { data: exercises = [] } = useExercisesByTrack(
    patientId,
    planId,
    pillarId,
    track.id,
  )

  const handleEdit = () => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}/trilha/${track.id}`,
    )
  }

  const handleToggleActive = async (checked: boolean) => {
    setIsActive(checked)
    try {
      await updateTrack({
        patientId,
        planId,
        pillarId,
        goalId,
        trackId: track.id,
        data: {
          status: checked ? 'Em progresso' : 'Finalizado',
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar status da trilha:', error)
      setIsActive(!checked)
    }
  }

  // Ordenar exercícios pela ordem definida
  const orderedExercises = [...exercises].sort((a, b) => {
    const orderA = a.order ?? 999
    const orderB = b.order ?? 999
    return orderA - orderB
  })

  return (
    <Card className="rounded-lg border border-gray-200 bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">
                {track.name}
              </h4>
              {getStatusBadge(track.status)}
            </div>
            <p className="mb-2 text-sm text-gray-600">{track.description}</p>
            <p className="text-xs text-gray-500">
              Criado em {formatDate(track.createdAt)}
            </p>
          </div>
          <div className="ml-4 flex items-center gap-3">
            <Button
              onClick={handleEdit}
              variant="ghost"
              className="text-purple-600 hover:text-purple-800"
              title="Editar"
              icon={<EditOutlinedIcon fontSize="small" />}
            >
              {' '}
            </Button>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleActive}
              className="data-[state=checked]:bg-purple-600"
            />
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800"
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? (
                <ExpandLessIcon fontSize="medium" />
              ) : (
                <ExpandMoreIcon fontSize="medium" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {orderedExercises.length > 0 ? (
            <div className="space-y-2">
              {orderedExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-start gap-3 rounded-lg bg-white p-3"
                >
                  <div className="mt-0.5 text-[#530570]">
                    <RadioButtonUncheckedIcon fontSize="small" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        {exercise.type}
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {exercise.name}
                      </p>
                    </div>
                    {exercise.description && (
                      <p className="mt-1 text-xs text-gray-600">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Nenhum exercício associado
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
