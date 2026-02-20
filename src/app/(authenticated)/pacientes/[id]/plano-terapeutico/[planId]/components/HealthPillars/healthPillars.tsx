'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/atoms/Button/button'
import {
  useHealthPillar,
  useCreateHealthPillar,
} from '@/hooks/queries/useHealthPillars'
import { HealthPillarType } from '@/types/entities/healthPillar'

import { BiomarkersPillar } from './BiomarkersPillar/biomarkersPillar'
import { LifestylePillar } from './LifestylePillar/lifestylePillar'
import { MentalHealthPillar } from './MentalHealthPillar/mentalHealthPillar'

interface HealthPillarsProps {
  patientId: string
  planId: string
}

const pillarTypes: HealthPillarType[] = [
  'Saúde Mental',
  'Biomarcadores de Saúde',
  'Estilo de Vida',
]

export function HealthPillars({ patientId, planId }: HealthPillarsProps) {
  const [activePillar, setActivePillar] =
    useState<HealthPillarType>('Saúde Mental')
  const { mutateAsync: createHealthPillar } = useCreateHealthPillar()

  const mentalHealthPillar = useHealthPillar(patientId, planId, 'Saúde Mental')
  const biomarkersPillar = useHealthPillar(
    patientId,
    planId,
    'Biomarcadores de Saúde',
  )
  const lifestylePillar = useHealthPillar(patientId, planId, 'Estilo de Vida')

  useEffect(() => {
    const ensurePillarExists = async (type: HealthPillarType) => {
      let pillar
      switch (type) {
        case 'Saúde Mental':
          pillar = mentalHealthPillar.data
          break
        case 'Biomarcadores de Saúde':
          pillar = biomarkersPillar.data
          break
        case 'Estilo de Vida':
          pillar = lifestylePillar.data
          break
      }

      if (!pillar && !mentalHealthPillar.isLoading) {
        try {
          await createHealthPillar({ patientId, planId, type })
        } catch (error) {
          console.error(`Erro ao criar pilar ${type}:`, error)
        }
      }
    }

    if (planId !== 'new') {
      pillarTypes.forEach((type) => ensurePillarExists(type))
    }
  }, [
    patientId,
    planId,
    mentalHealthPillar.data,
    biomarkersPillar.data,
    lifestylePillar.data,
    mentalHealthPillar.isLoading,
    createHealthPillar,
  ])

  const getPillarId = (type: HealthPillarType): string | null => {
    switch (type) {
      case 'Saúde Mental':
        return mentalHealthPillar.data?.id || null
      case 'Biomarcadores de Saúde':
        return biomarkersPillar.data?.id || null
      case 'Estilo de Vida':
        return lifestylePillar.data?.id || null
    }
  }

  const currentPillarId = getPillarId(activePillar)

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {pillarTypes.map((type) => (
          <Button
            key={type}
            variant="ghost"
            onClick={() => setActivePillar(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activePillar === type
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            {type}
          </Button>
        ))}
      </div>
      {activePillar === 'Saúde Mental' && currentPillarId && (
        <MentalHealthPillar
          patientId={patientId}
          planId={planId}
          pillarId={currentPillarId}
        />
      )}

      {activePillar === 'Biomarcadores de Saúde' && currentPillarId && (
        <BiomarkersPillar
          patientId={patientId}
          planId={planId}
          pillarId={currentPillarId}
        />
      )}

      {activePillar === 'Estilo de Vida' && currentPillarId && (
        <LifestylePillar
          patientId={patientId}
          planId={planId}
          pillarId={currentPillarId}
        />
      )}
    </div>
  )
}
