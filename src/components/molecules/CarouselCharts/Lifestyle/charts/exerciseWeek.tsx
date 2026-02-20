import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const data = [
  { label: 'Seg', value: 3, color: '#E238E8', recommended: 1 },
  { label: 'Ter', value: 0.5, color: '#DC2626', recommended: 1 },
  { label: 'Qua', value: 0.5, color: '#DC2626', recommended: 1 },
  { label: 'Qui', value: 1, color: '#F97316', recommended: 1 },
  { label: 'Sex', value: 2, color: '#7C3AED', recommended: 1 },
  { label: 'Sáb', value: 3, color: '#E238E8', recommended: 1 },
  { label: 'Dom', value: 0.5, color: '#DC2626', recommended: 1 },
]

const chartConfig = {
  value: {
    label: 'Exercício Físico',
    color: '#7C3AED',
  },
  recommended: {
    label: 'Recomendado',
    color: '#7C3AED',
  },
}
export function ExerciseWeekChart() {
  const recommendedValue = 1

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[16/10] max-h-[320px] min-h-[200px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF] px-2 pt-3 sm:px-4 sm:pt-6"
    >
      <BarChart
        data={data}
        barSize={28}
        margin={{ left: 8, right: 8, top: 12, bottom: 4 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          stroke="#9CA3AF"
          fontSize={12}
          domain={[0, 3]}
          ticks={[0, 1, 2, 3]}
        />
        <ReferenceLine
          y={recommendedValue}
          stroke="var(--color-recommended)"
          strokeDasharray="6 4"
        />
        <Line
          type="linear"
          dataKey="recommended"
          stroke="var(--color-recommended)"
          strokeDasharray="6 4"
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
