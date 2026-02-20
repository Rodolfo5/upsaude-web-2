import { CarouselChartGroup } from '../types'

import { DietChart } from './charts/diet'
import { ExerciseMonthChart } from './charts/exerciseMonth'
import { ExerciseWeekChart } from './charts/exerciseWeek'
import { WeightProgressChart } from './charts/weightProgress'

export const lifestyleCarousel: CarouselChartGroup = {
  label: 'Estilo de Vida',
  helperText: 'Hábitos que impactam diretamente a evolução clínica.',
  slides: [
    {
      id: 'weight-progress',
      title: 'Progresso de Peso',
      actionLabel: 'Ver detalhes',
      actionHref: '#',
      chart: <WeightProgressChart />,
    },
    {
      id: 'diet',
      title: 'Alimentação',
      actionLabel: 'Ver detalhes',
      actionHref: '#',
      chart: <DietChart />,
    },
    {
      id: 'exercise-month',
      title: 'Exercício Físico',
      actionLabel: 'Ver detalhes',
      actionHref: '#',
      chart: <ExerciseMonthChart />,
    },
    {
      id: 'exercise-week',
      title: 'Exercício Físico',
      actionLabel: 'Ver detalhes',
      actionHref: '#',
      chart: <ExerciseWeekChart />,
    },
  ],
}
