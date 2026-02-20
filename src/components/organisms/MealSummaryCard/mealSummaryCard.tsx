'use client'

import RestaurantIcon from '@mui/icons-material/Restaurant'
import Image from 'next/image'
import Link from 'next/link'
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

function formatCurrentDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
}

export interface MealSummaryCardProps {
  consumedKcal: number
  remainingKcal: number
  maxKcal: number
  dentroDietaCount: number
  foraDietaCount: number
  dietTitle?: string
  dietHref?: string
  onVerDetalhesClick?: () => void
  className?: string
}

export function MealSummaryCard({
  consumedKcal,
  remainingKcal,
  maxKcal,
  dentroDietaCount,
  foraDietaCount,
  dietTitle,
  dietHref,
  onVerDetalhesClick,
  className,
}: MealSummaryCardProps) {
  const totalMeals = dentroDietaCount + foraDietaCount
  const dentroPct = totalMeals
    ? Math.round((dentroDietaCount / totalMeals) * 100)
    : 100
  const foraPct = totalMeals
    ? Math.round((foraDietaCount / totalMeals) * 100)
    : 0
  let pieData: { name: string; value: number; fill: string }[] = [
    ...(dentroPct > 0
      ? [
          {
            name: 'Dentro da dieta' as const,
            value: dentroPct,
            fill: '#7C3AED',
          },
        ]
      : []),
    ...(foraPct > 0
      ? [{ name: 'Fora da dieta' as const, value: foraPct, fill: '#60A5FA' }]
      : []),
  ]
  if (pieData.length === 0) {
    pieData = [{ name: 'Dentro da dieta', value: 100, fill: '#7C3AED' }]
  }

  const progressPercent =
    maxKcal > 0 ? Math.min(100, (consumedKcal / maxKcal) * 100) : 0

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold text-[#530570]">
            Resumo diário
          </h3>
          <p className="text-sm text-gray-600">{formatCurrentDate()}</p>
        </div>
        <div className="mb-3 flex items-baseline gap-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">{consumedKcal}</p>
            <p className="text-sm text-gray-600">Consumidas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{remainingKcal}</p>
            <p className="text-sm text-gray-600">Restantes</p>
          </div>
        </div>
        <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {maxKcal.toLocaleString('pt-BR')} kcal
        </p>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white p-6 shadow-none">
        <h3 className="mb-4 text-xl font-semibold text-[#530570]">
          Minha dieta
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

      <Card className="flex items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg">
          <Image
            src="/Vector.png"
            alt="Meta"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[#530570]">
            Consumo calórico
          </h3>
          <p className="text-sm text-gray-600">
            Máx. {maxKcal.toLocaleString('pt-BR')} kcal
          </p>
        </div>
      </Card>

      {dietTitle &&
        (onVerDetalhesClick ? (
          <button
            type="button"
            onClick={onVerDetalhesClick}
            className="w-full text-left"
          >
            <Card className="flex cursor-pointer items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none transition-colors hover:bg-gray-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                <Image
                  src="/recomendacaonutri.png"
                  alt="Recomendação nutricional"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-[#530570]">
                  {dietTitle}
                </h3>
                <p className="text-sm text-gray-600">Ver detalhes</p>
              </div>
            </Card>
          </button>
        ) : dietHref ? (
          <Link href={dietHref}>
            <Card className="flex cursor-pointer items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none transition-colors hover:bg-gray-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <RestaurantIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
                  Recomendação nutricional
                </p>
                <h3 className="text-xl font-semibold text-[#530570]">
                  {dietTitle}
                </h3>
                <p className="text-sm text-gray-600">Ver detalhes</p>
              </div>
            </Card>
          </Link>
        ) : (
          <Card className="flex items-center gap-4 rounded-2xl border-gray-200 bg-white p-5 shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <RestaurantIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
                Recomendação nutricional
              </p>
              <h3 className="text-xl font-semibold text-[#530570]">
                {dietTitle}
              </h3>
              <p className="text-sm text-gray-600">Ver detalhes</p>
            </div>
          </Card>
        ))}
    </div>
  )
}
