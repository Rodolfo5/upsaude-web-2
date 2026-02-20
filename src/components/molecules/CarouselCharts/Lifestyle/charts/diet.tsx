import { Cell, Pie, PieChart } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const data = [
  { name: 'Dentro da dieta', value: 78, fill: '#7C3AED' },
  { name: 'Fora da dieta', value: 22, fill: '#60A5FA' },
]

const chartConfig = {
  'Dentro da dieta': {
    label: 'Dentro da dieta',
    color: '#7C3AED',
  },
  'Fora da dieta': {
    label: 'Fora da dieta',
    color: '#60A5FA',
  },
}

export function DietChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[16/10] max-h-[320px] min-h-[200px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF] px-2 pt-3 sm:px-4 sm:pt-6"
    >
      <PieChart margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="28%"
          cy="55%"
          innerRadius={0}
          outerRadius={78}
          paddingAngle={0}
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend
          verticalAlign="middle"
          align="center"
          height={48}
          wrapperStyle={{ paddingTop: '8px' }}
          content={<ChartLegendContent className="justify-center" />}
        />
      </PieChart>
    </ChartContainer>
  )
}
