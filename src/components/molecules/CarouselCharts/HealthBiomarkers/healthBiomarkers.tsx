import { useEffect, useState } from 'react'

import {
  getAllBloodPressureData,
  getAllGlycemiaData,
  getAllHeartRateData,
  getAllOximetryData,
  getAllTemperatureData,
} from '@/services/healthBiomarkersData'
import {
  BloodGlucoseEntity,
  BloodPressureEntity,
  HeartRateEntity,
  OximetryEntity,
  TemperatureEntity,
} from '@/types/entities/biomarkers'

import { CarouselChartGroup } from '../types'

import { BloodPressureChart } from './charts/bloodPressure'
import { GlycemiaChart } from './charts/glycemia'
import { HeartRateChart } from './charts/heartRate'
import { OximetryChart } from './charts/oximetry'
import { TemperatureChart } from './charts/temperature'

export function useHealthBiomarkersCarousel(
  patientId?: string,
): CarouselChartGroup {
  const [bloodPressureData, setBloodPressureData] = useState<
    BloodPressureEntity[]
  >([])
  const [glycemiaData, setGlycemiaData] = useState<BloodGlucoseEntity[]>([])
  const [oximetryData, setOximetryData] = useState<OximetryEntity[]>([])
  const [temperatureData, setTemperatureData] = useState<TemperatureEntity[]>(
    [],
  )
  const [heartRateData, setHeartRateData] = useState<HeartRateEntity[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) {
        return
      }
      try {
        const [bloodPressure, glycemia, oximetry, temperature, heartRate] =
          await Promise.all([
            getAllBloodPressureData(patientId),
            getAllGlycemiaData(patientId),
            getAllOximetryData(patientId),
            getAllTemperatureData(patientId),
            getAllHeartRateData(patientId),
          ])
        setBloodPressureData(bloodPressure)
        setGlycemiaData(glycemia)
        setOximetryData(oximetry)
        setTemperatureData(temperature)
        setHeartRateData(heartRate)
      } catch (error) {
        console.error('Erro ao buscar dados de biomarcadores de saúde:', error)
      }
    }
    fetchData()
  }, [patientId])

  return {
    label: 'Biomarcadores de Saúde',
    helperText: 'Monitore os principais sinais vitais do paciente.',
    slides: [
      {
        id: 'blood-pressure',
        title: 'Pressão Arterial (mmHg)',
        chart: <BloodPressureChart data={bloodPressureData} />,
      },
      {
        id: 'glycemia',
        title: 'Glicemia (mg/dL)',
        chart: <GlycemiaChart data={glycemiaData} />,
      },
      {
        id: 'oximetry',
        title: 'Oximetria (%)',
        chart: <OximetryChart data={oximetryData} />,
      },
      {
        id: 'temperature',
        title: 'Temperatura (°C)',
        chart: <TemperatureChart data={temperatureData} />,
      },
      {
        id: 'heart-rate',
        title: 'Frequência Cardíaca (bpm)',
        chart: <HeartRateChart data={heartRateData} />,
      },
    ],
  }
}

export const healthBiomarkersCarousel: CarouselChartGroup = {
  label: 'Biomarcadores de Saúde',
  helperText: 'Monitore os principais sinais vitais do paciente.',
  slides: [
    {
      id: 'blood-pressure',
      title: 'Pressão Arterial (mmHg)',
      actionLabel: 'Ver detalhes',
      actionHref: '#',
      chart: <BloodPressureChart data={[]} />,
    },
    {
      id: 'glycemia',
      title: 'Glicemia (mg/dL)',
      chart: <GlycemiaChart data={[]} />,
    },
    {
      id: 'oximetry',
      title: 'Oximetria (%)',
      chart: <OximetryChart data={[]} />,
    },
    {
      id: 'temperature',
      title: 'Temperatura (°C)',
      chart: <TemperatureChart data={[]} />,
    },
    {
      id: 'heart-rate',
      title: 'Frequência Cardíaca (bpm)',
      chart: <HeartRateChart data={[]} />,
    },
  ],
}
