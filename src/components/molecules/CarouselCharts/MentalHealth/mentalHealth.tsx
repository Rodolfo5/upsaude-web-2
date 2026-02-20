'use client'

import { useEffect, useState } from 'react'

import {
  getAllHumorData,
  getAllSleepTimeData,
  getAllStressData,
} from '@/services/mentalHealthData'
import { HumorEntity, SleepTimeEntity } from '@/types/entities/healthPillar'
import { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

import { CarouselChartGroup } from '../types'

import { MoodChart } from './charts/mood'
import { SleepDurationChart } from './charts/sleepDuration'
import { StressChart } from './charts/stress'

export function useMentalHealthCarousel(
  patientId?: string,
): CarouselChartGroup {
  const [sleepData, setSleepData] = useState<SleepTimeEntity[]>([])
  const [humorData, setHumorData] = useState<HumorEntity[]>([])
  const [stressData, setStressData] = useState<QuestionnaireEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const [sleep, humor, stress] = await Promise.all([
          getAllSleepTimeData(patientId),
          getAllHumorData(patientId),
          getAllStressData(patientId),
        ])

        setSleepData(sleep)
        setHumorData(humor)
        setStressData(stress)
      } catch (error) {
        console.error('Erro ao buscar dados de saúde mental:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [patientId])

  return {
    label: 'Saúde Mental',
    slides: [
      {
        id: 'sleep-duration',
        title: 'Tempo de Sono',
        chart: <SleepDurationChart data={sleepData} />,
      },
      {
        id: 'stress',
        title: 'Estresse',
        chart: <StressChart data={stressData} />,
      },
      {
        id: 'mood',
        title: 'Humor',
        chart: <MoodChart data={humorData} />,
      },
    ],
  }
}

// Export para compatibilidade com código existente (dados mockados)
export const mentalHealthCarousel: CarouselChartGroup = {
  label: 'Saúde Mental',
  slides: [
    {
      id: 'sleep-duration',
      title: 'Tempo de Sono',
      chart: <SleepDurationChart />,
    },
    {
      id: 'stress',
      title: 'Estresse',
      chart: <StressChart data={[]} />,
    },
    {
      id: 'mood',
      title: 'Humor',
      chart: <MoodChart />,
    },
  ],
}
