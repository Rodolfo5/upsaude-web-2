import {
  Area,
  AreaChart,
  CartesianGrid,
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
  { label: 'Jan', weight: 105, goal: 95 },
  { label: 'Fev', weight: 120, goal: 95 },
  { label: 'Mar', weight: 118, goal: 95 },
  { label: 'Abr', weight: 102, goal: 95 },
  { label: 'Mai', weight: 98, goal: 95 },
  { label: 'Jun', weight: 99, goal: 95 },
  { label: 'Jul', weight: 97, goal: 95 },
  { label: 'Ago', weight: 92, goal: 95 },
  { label: 'Set', weight: 88, goal: 95 },
  { label: 'Out', weight: 85, goal: 95 },
  { label: 'Nov', weight: 90, goal: 95 },
  { label: 'Dez', weight: 94, goal: 95 },
]

const chartConfig = {
  weight: {
    label: 'Progresso de peso',
    color: '#6D28D9',
  },
  goal: {
    label: 'Meta',
    color: '#EC4899',
  },
}
export function WeightProgressChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[16/10] max-h-[320px] min-h-[200px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F5F3FF] px-2 pt-3 sm:px-4 sm:pt-6"
    >
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 16 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6D28D9" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={[60, 130]}
          tickFormatter={(value) => `${value}kg`}
        />
        <ReferenceLine
          y={95}
          stroke="var(--color-goal)"
          strokeDasharray="6 4"
          label={{
            value: 'Meta',
            fill: '#EC4899',
            position: 'right',
            fontSize: 12,
          }}
        />
        <ChartLegend
          verticalAlign="bottom"
          align="left"
          height={40}
          content={<ChartLegendContent />}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="weight"
          name="Progresso de peso"
          stroke="var(--color-weight)"
          strokeWidth={3}
          fill="url(#weightGradient)"
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="goal"
          name="Meta"
          stroke="var(--color-goal)"
          strokeDasharray="6 4"
          dot={false}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
