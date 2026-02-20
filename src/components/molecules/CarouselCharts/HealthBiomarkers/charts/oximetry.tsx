import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { OximetryEntity } from '@/types/entities/biomarkers'

const recommendedValue = 93

const chartConfig = {
  value: {
    label: 'Seus registros',
    color: '#7C3AED',
  },
  recommended: {
    label: 'Recomendado',
    color: '#E11EFF',
  },
}

export function OximetryChart({ data }: { data: OximetryEntity[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF]">
        <p className="text-sm text-gray-500">
          Nenhum dado de oximetria registrado
        </p>
      </div>
    )
  }
  const chartData = data.map((item) => {
    return {
      label:
        item.createdAt && format(item.createdAt, 'dd/MM', { locale: ptBR }),
      value: Number(item.value) || 0,
      recommended: recommendedValue,
    }
  })
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[16/10] max-h-[320px] min-h-[200px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8EFFD] px-2 pt-3 sm:px-4 sm:pt-6"
    >
      <LineChart
        data={chartData}
        margin={{ left: 12, right: 12, top: 12, bottom: 32 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={true}
          fontSize={12}
          stroke="#9CA3AF"
        />
        <YAxis
          tickLine={false}
          axisLine={true}
          fontSize={12}
          stroke="#9CA3AF"
          domain={[60, 100]}
          tickFormatter={(value) => `${value}`}
        />
        <ReferenceLine
          y={recommendedValue}
          stroke="var(--color-recommended)"
          strokeDasharray="6 4"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend
          verticalAlign="bottom"
          align="left"
          height={36}
          content={<ChartLegendContent className="justify-start px-1" />}
        />
        <Line
          type="linear"
          dataKey="recommended"
          stroke="var(--color-recommended)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          isAnimationActive={false}
          legendType="line"
        />
        <Line
          type="linear"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
