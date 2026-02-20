'use client'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

function formatCurrentDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
}

function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(d)
}

const chartConfig = {
  weight: {
    label: 'Peso (kg)',
    color: '#7C3AED',
  },
}

export interface WeightSummaryCardProps {
  currentWeight: number
  goalWeight: number
  objective: 'Perder' | 'Ganhar' | 'Manter'
  weightHistory: { date: Date | string; weight: number }[]
  className?: string
}

export function WeightSummaryCard({
  currentWeight,
  goalWeight,
  objective,
  weightHistory,
  className,
}: WeightSummaryCardProps) {
  const diff = Math.abs(currentWeight - goalWeight)
  const progressPercent =
    goalWeight !== 0
      ? Math.min(100, (Math.abs(currentWeight - goalWeight) / goalWeight) * 100)
      : 0

  const minWeight = weightHistory.length
    ? Math.min(...weightHistory.map((w) => w.weight))
    : currentWeight
  const maxWeight = weightHistory.length
    ? Math.max(...weightHistory.map((w) => w.weight))
    : currentWeight
  const avgWeight = weightHistory.length
    ? weightHistory.reduce((sum, w) => sum + w.weight, 0) /
      weightHistory.length
    : currentWeight

  const chartData = weightHistory.slice(-7).map((item) => ({
    date: formatShortDate(item.date),
    weight: item.weight,
  }))

  const isIncreasing = currentWeight > goalWeight && objective === 'Perder'
  const isDecreasing = currentWeight < goalWeight && objective === 'Ganhar'
  const onTrack = !isIncreasing && !isDecreasing

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Peso atual</h3>
          <p className="text-sm text-gray-600">{formatCurrentDate()}</p>
        </div>
        <div className="mb-3 flex items-baseline gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {currentWeight.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Peso atual (kg)</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {goalWeight.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Meta (kg)</p>
          </div>
        </div>
        <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              onTrack ? 'bg-green-500' : 'bg-yellow-500',
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {objective === 'Perder' && `Faltam ${diff.toFixed(1)} kg para a meta`}
          {objective === 'Ganhar' && `Faltam ${diff.toFixed(1)} kg para a meta`}
          {objective === 'Manter' && 'Manter peso atual'}
        </p>
      </Card>

      {chartData.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Progresso de Peso
          </h3>
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full bg-gradient-to-b from-white to-[#F8F5FF]"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                style={{ fontSize: '12px' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#7C3AED"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorWeight)"
              />
            </AreaChart>
          </ChartContainer>
        </Card>
      )}

      <Card className="flex items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
          {objective === 'Perder' && (
            <ArrowDownwardIcon className="h-6 w-6 text-primary-600" />
          )}
          {objective === 'Ganhar' && (
            <ArrowUpwardIcon className="h-6 w-6 text-primary-600" />
          )}
          {objective === 'Manter' && (
            <MonitorWeightIcon className="h-6 w-6 text-primary-600" />
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Objetivo: {objective} peso
          </h3>
          <p className="text-sm text-gray-600">Meta: {goalWeight} kg</p>
        </div>
      </Card>

      <Card className="rounded-2xl border-gray-200 bg-white p-5 shadow-none">
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          Estatísticas
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600">Mínimo</p>
            <p className="text-lg font-bold text-gray-900">
              {minWeight.toFixed(1)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Máximo</p>
            <p className="text-lg font-bold text-gray-900">
              {maxWeight.toFixed(1)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Média</p>
            <p className="text-lg font-bold text-gray-900">
              {avgWeight.toFixed(1)} kg
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
