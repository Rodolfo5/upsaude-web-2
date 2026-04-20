'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { ChevronLeft as ChevronLeftIcon } from 'lucide-react'
import { ChevronRight as ChevronRightIcon } from 'lucide-react'
import { Scale as MonitorWeightIcon } from 'lucide-react'
import { addDays, subDays } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState, use } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/atoms/Button/button'
import { WeightDetailModal } from '@/components/organisms/Modals/WeightDetailModal/weightDetailModal'
import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useLifestyleCategories } from '@/hooks/queries/useHealthPillarLifestyleCategories'
import { useLifestylePillar } from '@/hooks/queries/useMealRecords'
import { useCurrentTherapeuticPlan } from '@/hooks/queries/useTherapeuticPlan'
import { useWeightRecords } from '@/hooks/queries/useWeightRecords'
import { usePatient } from '@/hooks/usePatient'
import type { WeightRecordEntity } from '@/types/entities/lifestyle'

interface Props {
  params: Promise<{ id: string }>
}

export default function PesoPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const { patient } = usePatient(id)
  const { data: currentPlan } = useCurrentTherapeuticPlan(id)
  const planId = currentPlan?.id ?? ''
  const { data: lifestylePillar } = useLifestylePillar(id, planId)
  const pillarId = lifestylePillar?.id ?? ''

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] =
    useState<WeightRecordEntity | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const today = useMemo(() => new Date(), [])
  const startDate = useMemo(() => subDays(today, 365), [today]) // 12 meses para o gráfico de progresso
  const endDate = useMemo(() => addDays(today, 7), [today])

  const { data: records = [], isLoading } = useWeightRecords(
    id,
    startDate,
    endDate,
  )

  const { data: categories = [] } = useLifestyleCategories(id, planId, pillarId)

  const weightCategory = categories.find((c) => c.type === 'Peso')

  type WeightDesiredParam = {
    quantity?: number
    objective?: string
    deadline?: number
    deadlineUnit?: string
  }
  const desiredParam = weightCategory?.desiredParameter as
    | WeightDesiredParam
    | undefined

  const currentWeight = records.length > 0 ? records[0].weight : 0
  const quantityToReach = desiredParam?.quantity ?? 0
  const objective =
    (desiredParam?.objective as 'Perder' | 'Ganhar' | 'Manter') || 'Manter'
  const goalWeight =
    objective === 'Perder'
      ? currentWeight - quantityToReach
      : objective === 'Ganhar'
        ? currentWeight + quantityToReach
        : currentWeight

  const handleCardClick = (record: WeightRecordEntity) => {
    setSelectedRecord(record)
    setModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) setSelectedRecord(null)
  }

  const patientName = patient?.name ?? 'Paciente'

  // Calcular IMC
  const calculateIMC = (weight: number) => {
    const heightInMeters = 1.7 // Placeholder - idealmente buscar da base
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  const imc = currentWeight > 0 ? parseFloat(calculateIMC(currentWeight)) : 0
  const getIMCCategory = (imcValue: number) => {
    if (imcValue < 18.5) return 'Abaixo do peso'
    if (imcValue < 25) return 'Peso normal'
    if (imcValue < 30) return 'Sobrepeso'
    if (imcValue < 35) return 'Obesidade I'
    if (imcValue < 40) return 'Obesidade II'
    return 'Obesidade III'
  }

  const getIMCPosition = (imcValue: number) => {
    // Posição na barra de 0% a 100%
    const minIMC = 15
    const maxIMC = 45
    const position = ((imcValue - minIMC) / (maxIMC - minIMC)) * 100
    return Math.max(0, Math.min(100, position))
  }

  // Dados do gráfico - últimos 12 meses (agrupa por índice do mês 0-11 para bater com os labels)
  const chartData = useMemo(() => {
    const monthlyData: Record<number, number[]> = {}

    records.forEach((record) => {
      const date = new Date(record.createdAt)
      const monthIndex = date.getMonth()
      if (!monthlyData[monthIndex]) {
        monthlyData[monthIndex] = []
      }
      monthlyData[monthIndex].push(record.weight)
    })

    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    return months.map((month, index) => ({
      month,
      weight: monthlyData[index]
        ? monthlyData[index].reduce((a, b) => a + b, 0) /
          monthlyData[index].length
        : null,
    }))
  }, [records])

  const chartConfig = {
    weight: {
      label: 'Peso (kg)',
      color: '#7C3AED',
    },
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="h-screen px-4 md:px-8 lg:px-20">
      <div className="mt-24 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          className="flex cursor-pointer items-center gap-4 text-purple-800 hover:text-purple-600"
          onClick={() => router.push(`/pacientes/${id}`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          <h1 className="text-2xl font-semibold text-purple-800 md:text-3xl">
            Detalhes do peso
          </h1>
        </Button>
        <p className="text-sm text-gray-600">Paciente | {patientName}</p>
      </div>

      {/* Cards Superiores */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Peso atual */}
        <Card className="rounded-2xl border-gray-200 bg-[#F3EDF7] p-6 shadow-none">
          <h3 className="mb-2 text-xl font-semibold text-[#530570]">
            Peso atual
          </h3>
          <p className="mb-4 text-xs text-gray-500">
            {records.length > 0 ? formatDate(records[0].createdAt) : '-'}
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-4xl font-bold text-gray-900">
                {currentWeight.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">kg</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-purple-600">
                {goalWeight.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">kg Meta</p>
            </div>
          </div>
        </Card>

        {/* IMC */}
        <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-2 text-xl font-semibold text-[#530570]">IMC</h3>
          <p className="mb-4 text-xs text-gray-500">Índice de Massa Corpórea</p>
          <div className="space-y-4">
            {/* Barra de IMC */}
            <div className="relative">
              <div className="flex h-2 overflow-hidden rounded-full">
                <div className="w-[25%] bg-green-500" />
                <div className="w-[25%] bg-yellow-500" />
                <div className="w-[25%] bg-orange-500" />
                <div className="w-[25%] bg-red-500" />
              </div>
              <div
                className="absolute top-0 h-2 w-1 bg-gray-900"
                style={{ left: `${getIMCPosition(imc)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-gray-700">{getIMCCategory(imc)}</span>
              </p>
              <p className="text-xs text-gray-500">IMC: {imc} kg/m²</p>
            </div>
          </div>
        </Card>

        {/* Meta */}
        <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-2 text-xl font-semibold text-[#530570]">Meta</h3>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/Vector.png"
                alt="Meta"
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {objective} {quantityToReach.toFixed(0)}kg
              </p>
              <p className="text-sm text-gray-600">
                Até {desiredParam?.deadline ?? ''}{' '}
                {desiredParam?.deadlineUnit ?? ''}
              </p>
            </div>
          </div>
        </Card>

        {/* Atividade de pesagem */}
        <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
          <h3 className="mb-2 text-xl font-semibold text-[#530570]">
            Atividade de pesagem
          </h3>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/monitor_weight.png"
                alt="Atividade de pesagem"
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">Semanalmente</p>
              <p className="text-sm text-gray-600">
                Até {desiredParam?.deadline ?? ''}{' '}
                {desiredParam?.deadlineUnit ?? ''}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico e Registros lado a lado */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Gráfico de Progresso - Esquerda */}
        <div className="flex-1">
          <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
            <h3 className="mb-4 text-xl font-semibold text-[#530570]">
              Progresso de Peso
            </h3>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[50, 120]}
                  style={{ fontSize: '12px' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#7C3AED"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorWeight)"
                  connectNulls
                />
                {/* Linha da meta */}
                <line
                  x1="0%"
                  y1={`${100 - ((goalWeight - 50) / 70) * 100}%`}
                  x2="100%"
                  y2={`${100 - ((goalWeight - 50) / 70) * 100}%`}
                  stroke="#C084FC"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ChartContainer>
          </Card>
        </div>

        {/* Registros do paciente - Direita */}
        <div className="w-full lg:w-[400px] lg:flex-shrink-0">
          <Card className="rounded-2xl border-gray-200 bg-white p-6 shadow-none">
            <h3 className="mb-6 text-xl font-semibold text-[#530570]">
              Registros do paciente
            </h3>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Carregando registros…
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum registro de peso encontrado.
              </div>
            ) : (
              <div>
                {/* Timeline horizontal: uma bolinha por registro */}
                <div className="relative mb-8">
                  <div className="absolute left-0 right-0 top-1.5 h-0.5 bg-purple-200" />
                  <div className="relative flex justify-between">
                    {records.map((record, index) => (
                      <div
                        key={record.id}
                        className={`z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                          index >= carouselIndex && index < carouselIndex + 2
                            ? 'bg-purple-600'
                            : 'border-2 border-purple-300 bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Carrossel de cards de registros */}
                <div className="relative">
                  <div className="flex gap-4 overflow-hidden">
                    {records
                      .slice(carouselIndex, carouselIndex + 2)
                      .map((record) => (
                        <div
                          key={record.id}
                          className="flex-1 rounded-xl border border-gray-200 bg-[#FAFAFA] p-4"
                        >
                          <div className="mb-3">
                            <p className="text-2xl font-bold text-gray-900">
                              {record.weight}{' '}
                              <span className="text-sm font-normal">kg</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(record.createdAt)}
                            </p>
                          </div>

                          {record.imageUrl ? (
                            <div className="space-y-2">
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-purple-600"
                                onClick={() => handleCardClick(record)}
                              >
                                Ver imagem
                              </Button>
                              <div className="overflow-hidden rounded-lg">
                                <Image
                                  src={record.imageUrl}
                                  width={80}
                                  height={80}
                                  alt="Registro de peso"
                                  className="h-40 w-full cursor-pointer object-cover"
                                  onClick={() => handleCardClick(record)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-40 items-center justify-center rounded-lg bg-gray-200">
                              <MonitorWeightIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Navegação do carrossel */}
                  {records.length > 2 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() =>
                          setCarouselIndex((prev) => Math.max(0, prev - 2))
                        }
                        disabled={carouselIndex === 0}
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        {Math.floor(carouselIndex / 2) + 1} /{' '}
                        {Math.ceil(records.length / 2)}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() =>
                          setCarouselIndex((prev) =>
                            Math.min(records.length - 2, prev + 2),
                          )
                        }
                        disabled={carouselIndex >= records.length - 2}
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <WeightDetailModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        record={selectedRecord}
      />
    </div>
  )
}
