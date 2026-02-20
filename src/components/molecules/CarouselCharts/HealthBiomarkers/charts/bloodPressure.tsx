import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BloodPressureEntity } from '@/types/entities/biomarkers'

const chartConfig = {
  systolic: {
    label: 'Pressão Sistólica',
    color: '#792EBD',
  },
  diastolic: {
    label: 'Pressão Diastólica',
    color: '#E238E8',
  },
}

export function BloodPressureChart({ data }: { data: BloodPressureEntity[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF]">
        <p className="text-sm text-gray-500">
          Nenhum dado de pressão arterial registrado
        </p>
      </div>
    )
  }

  const chartData = data.map((item) => {
    return {
      label:
        item.createdAt && format(item.createdAt, 'dd/MM', { locale: ptBR }),
      systolic: Number(item.systolicValue) || 0,
      diastolic: Number(item.diastolicValue) || 0,
    }
  })
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-[16/10] max-h-[320px] min-h-[200px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8EFFD] px-2 pt-3 sm:px-4 sm:pt-6"
    >
      <BarChart
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
          dy={6}
        />
        <YAxis
          tickLine={false}
          axisLine={true}
          fontSize={12}
          stroke="#9CA3AF"
          domain={[0, 200]}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border bg-white p-2 shadow-sm">
                  <div className="text-sm font-medium">
                    {data.systolic}/{data.diastolic} mmHg
                  </div>
                  <div className="text-xs text-gray-500">{data.label}</div>
                </div>
              )
            }
            return null
          }}
        />
        <ChartLegend
          verticalAlign="bottom"
          align="left"
          height={36}
          content={<ChartLegendContent className="justify-start px-1" />}
        />
        <Bar
          dataKey="systolic"
          fill="var(--color-systolic)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="diastolic"
          fill="var(--color-diastolic)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
