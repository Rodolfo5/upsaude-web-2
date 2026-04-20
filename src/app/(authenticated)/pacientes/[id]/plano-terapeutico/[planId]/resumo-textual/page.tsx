'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { Badge } from '@/components/ui/badge'
import { useDiagnostics } from '@/hooks/queries/useDiagnostics'
import { useActivitiesByPillar } from '@/hooks/queries/useHealthPillarActivities'
import { useExercisesByTrack } from '@/hooks/queries/useHealthPillarExercises'
import { useGoals } from '@/hooks/queries/useHealthPillarGoals'
import { useLifestyleCategories } from '@/hooks/queries/useHealthPillarLifestyleCategories'
import { useOrientationsByPillar } from '@/hooks/queries/useHealthPillarOrientations'
import { useHealthPillars } from '@/hooks/queries/useHealthPillars'
import { useTracksByPillar } from '@/hooks/queries/useHealthPillarTracks'
import { useTherapeuticPlan } from '@/hooks/queries/useTherapeuticPlan'
import { usePatient } from '@/hooks/usePatient'
import { DiagnosticEntity } from '@/types/entities/diagnostic'

// Componente auxiliar para renderizar exercícios de uma trilha
function TrackExercises({
  patientId,
  planId,
  pillarId,
  trackId,
}: {
  patientId: string
  planId: string
  pillarId: string
  trackId: string
}) {
  const { data: exercises = [] } = useExercisesByTrack(
    patientId,
    planId,
    pillarId,
    trackId,
  )

  if (exercises.length === 0) return null

  const exerciseNames = exercises
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((ex, idx) => `${idx + 1}) ${ex.name || ex.type}`)
    .join(', ')

  return <span className="text-gray-700">{exerciseNames}</span>
}

interface PageProps {
  params: Promise<{
    id: string
    planId: string
  }>
}

const formatDesiredParameter = (
  parameter: string | number | object | undefined,
  type?: string,
): string => {
  if (!parameter) return ''

  if (typeof parameter === 'number') {
    return parameter.toString()
  }

  // Se já for um objeto, usar diretamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try {
    if (typeof parameter === 'string') {
      parsed = JSON.parse(parameter)
    } else if (typeof parameter === 'object' && parameter !== null) {
      parsed = parameter
    } else {
      return String(parameter)
    }
  } catch {
    // Se não conseguir fazer parse e não for objeto, retorna como string
    return typeof parameter === 'string' ? parameter : String(parameter)
  }

  try {
    switch (type) {
      case 'Peso': {
        const parts: string[] = []
        if (parsed.currentWeight) {
          parts.push(`Peso atual: ${parsed.currentWeight}kg`)
        }
        if (parsed.objective && parsed.quantity) {
          const objectiveText =
            parsed.objective === 'Perder'
              ? 'Perder'
              : parsed.objective === 'Ganhar'
                ? 'Ganhar'
                : parsed.objective
          parts.push(`Objetivo: ${objectiveText} ${parsed.quantity}kg`)
        }
        if (parsed.deadline && parsed.deadlineUnit) {
          const deadlineUnitText =
            parsed.deadlineUnit === 'Meses'
              ? 'meses'
              : parsed.deadlineUnit === 'Semanas'
                ? 'semanas'
                : parsed.deadlineUnit === 'Dias'
                  ? 'dias'
                  : parsed.deadlineUnit.toLowerCase()
          parts.push(`Prazo: ${parsed.deadline} ${deadlineUnitText}`)
        }
        return parts.join(' • ')
      }

      case 'Movimentos': {
        if (parsed.unit && parsed.quantity) {
          const formattedQuantity = new Intl.NumberFormat('pt-BR').format(
            parsed.quantity,
          )
          return `${formattedQuantity} ${parsed.unit.toLowerCase()}`
        }
        if (parsed.quantity) {
          return new Intl.NumberFormat('pt-BR').format(parsed.quantity)
        }
        return ''
      }

      case 'Hidratação': {
        if (parsed.quantity && parsed.unit) {
          return `${parsed.quantity}${parsed.unit} de água`
        }
        if (parsed.quantity) {
          return `${parsed.quantity} ml de água`
        }
        return ''
      }

      case 'Alimentação': {
        if (parsed.quantity) {
          const formattedQuantity = new Intl.NumberFormat('pt-BR').format(
            parsed.quantity,
          )
          return `${formattedQuantity} kcal`
        }
        return ''
      }

      default:
        if (parsed.quantity) {
          return parsed.quantity.toString()
        }
        return ''
    }
  } catch {
    // Garante que sempre retorna uma string, mesmo em caso de erro
    if (typeof parameter === 'object' && parameter !== null) {
      try {
        return JSON.stringify(parameter)
      } catch {
        return 'Parâmetro inválido'
      }
    }
    return typeof parameter === 'string' ? parameter : String(parameter)
  }
}

export default function TherapeuticPlanTextualSummaryPage({
  params,
}: PageProps) {
  const { id: patientId, planId } = use(params)
  const router = useRouter()
  const { patient } = usePatient(patientId)
  const { data: plan, isLoading: isLoadingPlan } = useTherapeuticPlan(
    patientId,
    planId,
  )

  const { data: diagnostics = [] } = useDiagnostics(patientId, planId)
  const { data: healthPillars = [] } = useHealthPillars(patientId, planId)

  const mentalHealthPillar = healthPillars.find(
    (p) => p.type === 'Saúde Mental',
  )
  const biomarkersPillar = healthPillars.find(
    (p) => p.type === 'Biomarcadores de Saúde',
  )
  const lifestylePillar = healthPillars.find((p) => p.type === 'Estilo de Vida')

  // Buscar dados de Saúde Mental
  const { data: mentalHealthGoals = [] } = useGoals(
    patientId,
    planId,
    mentalHealthPillar?.id || '',
  )
  const { data: mentalHealthActivities = [] } = useActivitiesByPillar(
    patientId,
    planId,
    mentalHealthPillar?.id || '',
  )
  const { data: mentalHealthOrientations = [] } = useOrientationsByPillar(
    patientId,
    planId,
    mentalHealthPillar?.id || '',
  )
  const { data: mentalHealthTracks = [] } = useTracksByPillar(
    patientId,
    planId,
    mentalHealthPillar?.id || '',
  )

  // Buscar dados de Biomarcadores
  const { data: biomarkerActivities = [] } = useActivitiesByPillar(
    patientId,
    planId,
    biomarkersPillar?.id || '',
  )
  const { data: biomarkerOrientations = [] } = useOrientationsByPillar(
    patientId,
    planId,
    biomarkersPillar?.id || '',
  )

  // Buscar dados de Estilo de Vida
  const { data: lifestyleCategories = [] } = useLifestyleCategories(
    patientId,
    planId,
    lifestylePillar?.id || '',
  )
  const { data: lifestyleActivities = [] } = useActivitiesByPillar(
    patientId,
    planId,
    lifestylePillar?.id || '',
  )
  const { data: lifestyleOrientations = [] } = useOrientationsByPillar(
    patientId,
    planId,
    lifestylePillar?.id || '',
  )

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  }

  const calculateReevaluationDate = () => {
    if (!plan) return null
    const created =
      typeof plan.createdAt === 'string'
        ? new Date(plan.createdAt)
        : plan.createdAt
    const reevaluation = new Date(created)

    if (plan.reevaluationPeriodUnit === 'Meses') {
      reevaluation.setMonth(reevaluation.getMonth() + plan.reevaluationPeriod)
    } else if (plan.reevaluationPeriodUnit === 'Semanas') {
      reevaluation.setDate(reevaluation.getDate() + plan.reevaluationPeriod * 7)
    } else if (plan.reevaluationPeriodUnit === 'Dias') {
      reevaluation.setDate(reevaluation.getDate() + plan.reevaluationPeriod)
    }

    return reevaluation
  }

  if (isLoadingPlan) {
    return (
      <div className="mt-12 flex items-center justify-center px-4 md:px-8 lg:px-20">
        <p className="text-gray-500">Carregando resumo do plano...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mt-12 flex items-center justify-center px-4 md:px-8 lg:px-20">
        <p className="text-gray-500">Plano não encontrado</p>
      </div>
    )
  }

  const reevaluationDate = calculateReevaluationDate()

  return (
    <div className="mt-8 px-4 pb-20 md:px-8 lg:px-20">
      <div className="mb-6 flex justify-between gap-4">
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            className="flex w-fit cursor-pointer items-center gap-2 text-purple-800 hover:text-purple-600"
            onClick={() =>
              router.push(`/pacientes/${patientId}/plano-terapeutico/${planId}`)
            }
          >
            <ArrowBackOutlinedIcon fontSize="medium" />
            <span className="text-xl font-semibold">
              Plano Terapêutico textual
            </span>
          </Button>
          <Badge
            variant="outline"
            className="border-purple-600 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-800"
          >
            ID {planId.substring(0, 8)}
          </Badge>
        </div>

        <div className="flex flex-col items-end gap-1 text-[#792EBD]">
          <div>
            <span className="font-medium">Paciente | </span>
            {patient?.name || 'Carregando...'}
          </div>
          <div className="text-sm text-gray-600">
            Criado em {formatDate(plan.createdAt)} por {plan.createdBy}
          </div>
          {plan.updatedAt && (
            <div className="text-sm text-gray-600">
              Atualizado em {formatDate(plan.updatedAt)} por {plan.createdBy}
            </div>
          )}
          {reevaluationDate && (
            <div className="text-sm text-gray-600">
              Reavaliação prevista em {formatDate(reevaluationDate)}
            </div>
          )}
        </div>
      </div>

      <p className="mb-6 border-b border-gray-200 pb-6 text-sm text-gray-600">
        Defina metas, exercícios e orientações personalizadas para o paciente
      </p>

      {/* Conteúdo do Resumo */}
      <div className="space-y-8">
        {/* 1. Definições Iniciais */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#792EBD]">
            1. Definições Iniciais
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">
                Objetivo principal:{' '}
              </span>
              <span className="text-gray-900">{plan.objective}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reavaliação: </span>
              <span className="text-gray-900">
                Em {plan.reevaluationPeriod}{' '}
                {plan.reevaluationPeriodUnit.toLowerCase()}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Diagnósticos */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#792EBD]">
            2. Diagnósticos
          </h2>
          {diagnostics.length === 0 ? (
            <p className="text-gray-500">Nenhum diagnóstico registrado</p>
          ) : (
            <div className="space-y-2">
              {diagnostics.map((diagnostic: DiagnosticEntity) => (
                <div key={diagnostic.id} className="text-gray-700">
                  {diagnostic.name} (CID {diagnostic.cid}) Categoria:{' '}
                  {diagnostic.category}, registrado em{' '}
                  {formatDate(diagnostic.registeredAt)} por{' '}
                  {diagnostic.registeredBy} - Status: {diagnostic.status}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Pilares de Saúde */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#792EBD]">
            3. Pilares de Saúde
          </h2>

          {/* 3.1 Saúde Mental */}
          {mentalHealthPillar && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#792EBD]">
                3.1 Saúde Mental
              </h3>

              {/* Metas */}
              {mentalHealthGoals.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">Metas:</h4>
                  <ul className="ml-4 list-disc space-y-1">
                    {mentalHealthGoals.map((goal) => (
                      <li key={goal.id} className="text-gray-700">
                        {goal.type || goal.name}
                        {goal.desiredParameter &&
                          ` - ${formatDesiredParameter(
                            goal.desiredParameter,
                            goal.type,
                          )}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Atividades */}
              {mentalHealthActivities.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">
                    Atividades:
                  </h4>
                  <ul className="ml-4 list-disc space-y-1">
                    {mentalHealthActivities.map((activity) => (
                      <li key={activity.id} className="text-gray-700">
                        {activity.name}
                        {activity.frequency && ` (${activity.frequency})`}
                        {activity.endDate &&
                          ` por ${formatDate(activity.endDate)}`}
                        {activity.description && `. ${activity.description}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Orientações */}
              {mentalHealthOrientations.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">
                    Orientações:
                  </h4>
                  <ul className="ml-4 list-disc space-y-1">
                    {mentalHealthOrientations.map((orientation) => (
                      <li key={orientation.id} className="text-gray-700">
                        {orientation.title}
                        {orientation.description &&
                          ` - ${orientation.description}`}
                        {orientation.supportMaterial &&
                          ' - Leia o guia prático aqui'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trilhas */}
              {mentalHealthTracks.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">Trilha:</h4>
                  <ul className="ml-4 list-disc space-y-1">
                    {mentalHealthTracks.map((track) => (
                      <li key={track.id} className="text-gray-700">
                        {mentalHealthPillar && (
                          <TrackExercises
                            patientId={patientId}
                            planId={planId}
                            pillarId={mentalHealthPillar.id}
                            trackId={track.id}
                          />
                        )}
                        {!mentalHealthPillar && track.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 3.2 Biomarcadores de Saúde */}
          {biomarkersPillar && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#792EBD]">
                3.2 Biomarcadores de Saúde
              </h3>

              {/* Atividades */}
              {biomarkerActivities.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">
                    Atividades:
                  </h4>
                  <ul className="ml-4 list-disc space-y-1">
                    {biomarkerActivities.map((activity) => (
                      <li key={activity.id} className="text-gray-700">
                        {activity.name}
                        {activity.frequency &&
                          `, frequência: ${activity.frequency}`}
                        {activity.deadlineValue &&
                          activity.deadlineUnit &&
                          `, prazo: ${activity.deadlineValue} ${activity.deadlineUnit.toLowerCase()}`}
                        {activity.description && `. ${activity.description}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Orientações */}
              {biomarkerOrientations.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">
                    Orientações:
                  </h4>
                  <ul className="ml-4 list-disc space-y-1">
                    {biomarkerOrientations.map((orientation) => (
                      <li key={orientation.id} className="text-gray-700">
                        {orientation.title}
                        {orientation.description &&
                          ` - ${orientation.description}`}
                        {orientation.supportMaterial && ' - Material de apoio'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 3.3 Estilo de Vida */}
          {lifestylePillar && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-[#792EBD]">
                3.3 Estilo de Vida
              </h3>

              {/* Hidratação */}
              {(() => {
                const hydrationCategory = lifestyleCategories.find(
                  (c) => c.type === 'Hidratação',
                )
                if (!hydrationCategory) return null

                return (
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium text-gray-700">
                      Hidratação
                    </h4>
                    {hydrationCategory.desiredParameter && (
                      <div className="ml-4 text-gray-700">
                        <span className="font-medium">Meta: </span>
                        {formatDesiredParameter(
                          hydrationCategory.desiredParameter,
                          'Hidratação',
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Peso */}
              {(() => {
                const weightCategory = lifestyleCategories.find(
                  (c) => c.type === 'Peso',
                )
                const weightActivities = weightCategory
                  ? lifestyleActivities.filter(
                      (a) => a.goalId === weightCategory.id,
                    )
                  : []

                if (!weightCategory) return null

                return (
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium text-gray-700">Peso</h4>
                    <div className="ml-4 space-y-1">
                      {weightCategory.desiredParameter && (
                        <div className="text-gray-700">
                          <span className="font-medium">Meta: </span>
                          {formatDesiredParameter(
                            weightCategory.desiredParameter,
                            'Peso',
                          )}
                        </div>
                      )}
                      {weightActivities.map((activity) => (
                        <div key={activity.id} className="text-gray-700">
                          <span className="font-medium">
                            Atividade de pesagem:{' '}
                          </span>
                          {activity.frequency || 'Semanalmente'}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Movimentos */}
              {(() => {
                const movementsCategory = lifestyleCategories.find(
                  (c) => c.type === 'Movimentos - Passos',
                )
                const movementsActivities = movementsCategory
                  ? lifestyleActivities.filter(
                      (a) => a.goalId === movementsCategory.id,
                    )
                  : []
                const stepsActivity = movementsActivities.find(
                  (a) => a.name === 'Meta de passos',
                )

                if (!movementsCategory) return null

                return (
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium text-gray-700">
                      Movimentação
                    </h4>
                    <div className="ml-4 space-y-1">
                      {stepsActivity && (
                        <div className="text-gray-700">
                          <span className="font-medium">
                            Meta de passos diários:{' '}
                          </span>
                          {(() => {
                            if (stepsActivity.description) {
                              try {
                                const parsed = JSON.parse(
                                  stepsActivity.description,
                                )
                                if (parsed.quantity && parsed.unit) {
                                  return `Caminhar ${new Intl.NumberFormat('pt-BR').format(parsed.quantity)} ${parsed.unit.toLowerCase()}`
                                }
                              } catch {
                                return stepsActivity.description
                              }
                            }
                            return ''
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Alimentação */}
              {(() => {
                const nutritionCategory = lifestyleCategories.find(
                  (c) => c.type === 'Alimentação',
                )
                const nutritionOrientations = lifestyleOrientations.filter(
                  (o) => o.area === 'Alimentação',
                )

                if (!nutritionCategory && nutritionOrientations.length === 0)
                  return null

                return (
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium text-gray-700">
                      Alimentação
                    </h4>
                    <div className="ml-4 space-y-1">
                      {nutritionCategory?.desiredParameter && (
                        <div className="text-gray-700">
                          <span className="font-medium">Meta: </span>
                          {formatDesiredParameter(
                            nutritionCategory.desiredParameter,
                            'Alimentação',
                          )}
                        </div>
                      )}
                      {nutritionOrientations.map((orientation) => (
                        <div key={orientation.id} className="text-gray-700">
                          <span className="font-medium">
                            {orientation.title === 'Recomendação nutricional'
                              ? 'Recomendação nutricional'
                              : orientation.title === 'Recomendação de cardápio'
                                ? 'Recomendação de cardápio'
                                : orientation.title}
                            :{' '}
                          </span>
                          {orientation.description ||
                            'Veja o cardápio completo no app'}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </section>

        {/* 4. Plano de Consultas */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#792EBD]">
            4. Plano de Consultas
          </h2>
          <p className="text-gray-500">
            Conteúdo de Plano de Consultas será implementado em breve.
          </p>
        </section>

        {/* 5. Plano Medicamentoso */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#792EBD]">
            5. Plano Medicamentoso
          </h2>
          <p className="text-gray-500">
            Conteúdo de Plano Medicamentoso será implementado em breve.
          </p>
        </section>
      </div>
    </div>
  )
}
