import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { timestampToDate } from '@/lib/utils'
import { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

const recommendedValue = 20 // Limite entre Baixo e Médio (valor recomendado)

const chartConfig = {
  value: {
    label: 'Seus registros',
    color: '#7C3AED',
  },
  recommended: {
    label: 'Recomendado',
    color: '#E238E8',
  },
}

interface StressChartProps {
  data: QuestionnaireEntity[]
}

export function StressChart({ data }: StressChartProps) {
  function valueLabelFormat(value: number) {
    if (value >= 0 && value < 14) return 'Baixo'
    else if (value >= 14 && value < 27) return 'Médio'
    else if (value >= 27 && value <= 40) return 'Alto'
    else return 'Não avaliado'
  }

  // Estado vazio: mostrar mensagem
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF]">
        <p className="text-sm text-gray-500">
          Nenhum dado de estresse registrado
        </p>
      </div>
    )
  }

  const chartData = data.map((item) => {
    const numericValue = item.result || 0
    const label = valueLabelFormat(numericValue)

    // Mapear para a posição central da categoria
    let position: number
    if (label === 'Baixo') position = 0
    else if (label === 'Médio') position = 20
    else position = 40 // Alto

    return {
      label:
        item.createdAt instanceof Date
          ? format(item.createdAt, 'dd/MM', { locale: ptBR })
          : format(
              timestampToDate(item.createdAt as Timestamp) as Date,
              'dd/MM',
              {
                locale: ptBR,
              },
            ),
      value: position, // Posição central da categoria para desenhar a barra
      valueLabel: label, // Label formatado para exibição
      rawValue: numericValue, // Valor original para mostrar no tooltip
      recommended: recommendedValue,
    }
  })

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] w-full rounded-2xl bg-gradient-to-b from-white to-[#F8F5FF] px-2 pt-4"
    >
      <BarChart
        data={chartData}
        barSize={28}
        margin={{ left: 12, right: 12, top: 12 }}
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
          domain={[0, 40]}
          ticks={[0, 20, 40]}
          tickFormatter={(v) => {
            if (v === 0) return 'Baixo'
            if (v === 20) return 'Médio'
            if (v === 40) return 'Alto'
            return '' // Não mostrar label para o tick 40
          }}
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
        <ChartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border bg-white p-2 shadow-sm">
                  <div className="text-sm font-medium">
                    {data.valueLabel} ({data.rawValue})
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
          dataKey="value"
          radius={[4, 4, 0, 0]}
          fill="var(--color-value)"
          background={{ fill: 'rgba(124, 58, 237, 0.12)' }}
        />
      </BarChart>
    </ChartContainer>
  )
}
