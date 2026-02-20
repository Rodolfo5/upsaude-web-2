import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { SleepTimeEntity } from '@/types/entities/healthPillar'

const recommendedHours = 8

const chartConfig = {
  hours: {
    label: 'Tempo de sono',
    color: '#A855F7',
  },
  recommended: {
    label: 'Recomendado',
    color: '#F472B6',
  },
}

interface SleepDurationChartProps {
  data?: SleepTimeEntity[]
}

export function SleepDurationChart({
  data: sleepData,
}: SleepDurationChartProps) {
  // Converter SleepTimeEntity para formato do gráfico
  const chartData = sleepData
    ? sleepData.map((item) => {
        // Converter "hh:mm" para horas decimais
        const [hours, minutes] = item.sleepTime.split(':').map(Number)
        const totalHours = hours + minutes / 60

        const date = item.createdAt ? new Date(item.createdAt) : new Date()
        const label = format(date, 'dd/MM', { locale: ptBR })

        return {
          label,
          hours: Math.round(totalHours * 10) / 10,
          recommended: recommendedHours,
        }
      })
    : []
  // Estado vazio: mostrar mensagem
  if (!sleepData || sleepData.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF]">
        <p className="text-sm text-gray-500">Nenhum dado de sono registrado</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF] px-2 pt-4"
    >
      <BarChart
        data={chartData}
        barSize={22}
        margin={{ left: 8, right: 8, top: 12 }}
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
          domain={[0, 13]}
          tickFormatter={(value) => `${value}h`}
        />
        <ReferenceLine
          y={recommendedHours}
          stroke="var(--color-recommended)"
          strokeDasharray="4 4"
          label={{
            value: `${recommendedHours}h`,
            fill: '#F472B6',
            position: 'right',
            fontSize: 12,
          }}
        />
        <Line
          type="linear"
          dataKey="recommended"
          stroke="var(--color-recommended)"
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={false}
          legendType="line"
        />
        <ChartLegend
          verticalAlign="bottom"
          align="left"
          height={36}
          content={<ChartLegendContent className="justify-start px-1" />}
        />
        <ChartTooltip
          cursor={{ fill: 'rgba(168, 85, 247, 0.08)' }}
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="hours"
          radius={[2, 2, 0, 0]}
          fill="var(--color-hours)"
          background={{ fill: 'rgba(168, 85, 247, 0.08)' }}
        />
      </BarChart>
    </ChartContainer>
  )
}
