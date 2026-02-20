'use client'

import { Button } from '@/components/atoms/Button/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { ExerciseRecommendationDetailsModalProps } from './types'

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR').format(d)
  } catch {
    return '-'
  }
}

export function ExerciseRecommendationDetailsModal({
  isOpen,
  setIsOpen,
  activity,
}: ExerciseRecommendationDetailsModalProps) {
  if (!activity || activity.name !== 'Recomendação de exercício') {
    return null
  }

  const handleClose = () => {
    setIsOpen(false)
  }

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

  const trainingPrescriptions = activity.trainingPrescriptions || []

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white sm:max-w-2xl">
        <DialogTitle className="text-xl font-semibold text-[#530570]">
          Detalhes da Recomendação de Exercício
        </DialogTitle>

        <div className="space-y-6">
          {/* Modalidade */}
          {modalityValue.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Modalidade
              </h4>
              <p className="text-sm text-gray-900">
                {modalityValue.join(', ')}
              </p>
            </div>
          )}

          {/* Categoria / Foco */}
          {categoryValue.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Categoria / Foco
              </h4>
              <p className="text-sm text-gray-900">
                {categoryValue.join(', ')}
              </p>
            </div>
          )}

          {/* Intensidade */}
          {activity.intensity && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Intensidade
              </h4>
              <p className="text-sm text-gray-900">{activity.intensity}</p>
            </div>
          )}

          {/* Frequência */}
          {(activity.frequencyValue || activity.frequency) && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Frequência
              </h4>
              <p className="text-sm text-gray-900">
                {activity.frequencyValue && activity.frequencyUnit
                  ? `${activity.frequencyValue}x por ${activity.frequencyUnit.toLowerCase()}`
                  : activity.frequency}
              </p>
            </div>
          )}

          {/* Distância */}
          {activity.distanceKm && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Distância
              </h4>
              <p className="text-sm text-gray-900">{activity.distanceKm} km</p>
            </div>
          )}

          {/* Orientações ao Paciente */}
          {activity.patientGuidelines && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Orientações ao Paciente
              </h4>
              <p className="whitespace-pre-wrap text-sm text-gray-900">
                {activity.patientGuidelines}
              </p>
            </div>
          )}

          {/* Prescrições de Treino */}
          {trainingPrescriptions.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-gray-700">
                Prescrições de Treino
              </h4>
              <div className="space-y-3">
                {trainingPrescriptions
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((prescription) => (
                    <div
                      key={prescription.id}
                      className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                    >
                      <h5 className="mb-2 font-semibold text-gray-900">
                        {prescription.title}
                      </h5>
                      {prescription.description && (
                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                          {prescription.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">Status:</span>{' '}
                {activity.status}
              </div>
              {activity.endDate && (
                <div>
                  <span className="font-medium text-gray-700">Prazo:</span>{' '}
                  {`Até ${formatDate(activity.endDate)}`}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Criado em:</span>{' '}
                {formatDate(activity.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleClose} variant="secondary-gray">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
