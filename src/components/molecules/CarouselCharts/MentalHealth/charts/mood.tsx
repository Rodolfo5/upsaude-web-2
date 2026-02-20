import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartContainer } from '@/components/ui/chart'
import { HumorEntity } from '@/types/entities/healthPillar'

interface MoodChartProps {
  data?: HumorEntity[]
}

export function MoodChart({ data: humorData }: MoodChartProps) {
  // Agrupar humor por mês
  const chartData = humorData
    ? Object.entries(
        humorData.reduce(
          (acc, item) => {
            const date = item.createdAt ? new Date(item.createdAt) : new Date()
            const monthKey = format(date, 'MMM', { locale: ptBR })

            if (!acc[monthKey]) {
              acc[monthKey] = { good: 0, medium: 0, bad: 0 }
            }

            const humor = item.humor.toLowerCase()
            if (humor === 'alto') acc[monthKey].good++
            else if (humor === 'intermediário') acc[monthKey].medium++
            else if (humor === 'baixo') acc[monthKey].bad++

            return acc
          },
          {} as Record<string, { good: number; medium: number; bad: number }>,
        ),
      ).map(([label, values]) => ({
        label,
        ...values,
      }))
    : []

  // Estado vazio: mostrar mensagem
  if (!humorData || humorData.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF]">
        <p className="text-sm text-gray-500">Nenhum dado de humor registrado</p>
      </div>
    )
  }
  return (
    <ChartContainer
      config={{}}
      className="h-[260px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF] px-2 pt-4"
    >
      <BarChart
        data={chartData}
        margin={{ left: 8, right: 8, top: 12, bottom: 20 }}
        stackOffset="none"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={true}
          tickLine={false}
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis
          axisLine={true}
          tickLine={false}
          stroke="#9CA3AF"
          fontSize={12}
          domain={[0, 32]}
          ticks={[0, 8, 16, 24, 31]}
        />
        <Tooltip cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }} />
        <Legend
          verticalAlign="bottom"
          align="left"
          iconSize={8}
          wrapperStyle={{ paddingTop: 8, paddingLeft: 8 }}
        />
        <Bar dataKey="bad" stackId="mood" fill="#5B1A87" name="Ruim" />
        <Bar
          dataKey="medium"
          stackId="mood"
          fill="#1870F1"
          name="Intermediário"
        />
        <Bar dataKey="good" stackId="mood" fill="#E238E8" name="Bom" />
      </BarChart>
    </ChartContainer>
  )
}
