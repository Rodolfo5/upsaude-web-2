'use client'

import { Flame as LocalFireDepartmentIcon } from 'lucide-react'
import { Timer as TimerIcon } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'

import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const CHART_COLORS = [
  '#7C3AED',
  '#60A5FA',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
]

function formatCurrentDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
}

export interface ExerciseSummaryCardProps {
  totalCaloriesBurned: number
  totalDuration: number // em minutos
  categoryDistribution: { name: string; value: number }[]
  className?: string
}

export function ExerciseSummaryCard({
  totalCaloriesBurned,
  totalDuration,
  categoryDistribution,
  className,
}: ExerciseSummaryCardProps) {
  const chartConfig: Record<string, { label: string; color: string }> = {}
  const pieData = categoryDistribution.map((cat, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length]
    chartConfig[cat.name] = {
      label: cat.name,
      color,
    }
    return {
      name: cat.name,
      value: cat.value,
      fill: color,
    }
  })

  const hours = Math.floor(totalDuration / 60)
  const minutes = totalDuration % 60
  const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Resumo diário</h3>
          <p className="text-sm text-gray-600">{formatCurrentDate()}</p>
        </div>
        <div className="mb-3 flex items-baseline gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {totalCaloriesBurned}
            </p>
            <p className="text-sm text-gray-600">Calorias queimadas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{durationText}</p>
            <p className="text-sm text-gray-600">Tempo total</p>
          </div>
        </div>
      </Card>

      {categoryDistribution.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Categorias de exercício
          </h3>
          <ChartContainer
            config={chartConfig}
            className="aspect-square max-h-[240px] w-full bg-gradient-to-b from-white to-[#F8F5FF]"
          >
            <PieChart margin={{ top: 0, right: 0, bottom: 32, left: 0 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="30%"
                cy="45%"
                innerRadius={0}
                outerRadius={70}
                paddingAngle={0}
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend
                verticalAlign="bottom"
                align="center"
                height={40}
                content={
                  <ChartLegendContent className="justify-center text-sm" />
                }
              />
            </PieChart>
          </ChartContainer>
        </Card>
      )}

      <Card className="flex items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
          <LocalFireDepartmentIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Calorias queimadas
          </h3>
          <p className="text-sm text-gray-600">
            Hoje: {totalCaloriesBurned} kcal
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
          <TimerIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Tempo de exercício
          </h3>
          <p className="text-sm text-gray-600">Hoje: {durationText}</p>
        </div>
      </Card>
    </div>
  )
}
