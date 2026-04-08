'use client'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell } from 'recharts'

import { ChangeRiskClassificationModal } from '@/components/organisms/Modals/ChangeRiskClassificationModal/changeRiskClassificationModal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { useLatestCompletedHealthCheckup } from '@/hooks/queries/useLatestCompletedHealthCheckup'
import { usePatient } from '@/hooks/usePatient'

export type HealthScoreCardProps = {
  className?: string
  patientId?: string
  isAdmin?: boolean
  isQRCodePendingDoctor?: boolean
}

export default function HealthScoreCard({
  className,
  patientId,
  isAdmin = false,
  isQRCodePendingDoctor = false,
}: HealthScoreCardProps) {
  const { patient } = usePatient(patientId || '')
  const queryClient = useQueryClient()
  const { data: latestCompletedCheckup } = useLatestCompletedHealthCheckup(
    patientId || '',
  )
  const latestRisk = latestCompletedCheckup?.aiRiskClassification

  // Verificar se há classificação de risco disponível
  const hasRiskClassification = latestRisk

  // Para o cálculo do score, usar MODERATE como fallback se não houver classificação
  const riskClassificationForInput = hasRiskClassification
    ? (String(latestRisk).toUpperCase().replace(/\s+/g, '') as
        | 'LOW'
        | 'MODERATE'
        | 'HIGH')
    : ('MODERATE' as 'LOW' | 'MODERATE' | 'HIGH')

  // Usar apenas o score do paciente
  const patientScore = patient?.score
  const hasScore =
    patientScore !== undefined &&
    patientScore !== null &&
    !Number.isNaN(patientScore)

  // Dados do gráfico baseado no score do paciente
  const finalSlices = useMemo(() => {
    if (!hasScore) {
      // Se não tiver score, mostrar gráfico vazio ou com mensagem
      return [
        {
          name: 'no-score',
          value: 100,
          color: '#e5e7eb', // gray-200
          label: 'Não informado',
        },
      ]
    }
    const remaining = 100 - patientScore
    return [
      {
        name: 'score',
        value: patientScore,
        color: '#5b21b6', // purple-800
        label: 'Score de Saúde',
      },
      {
        name: 'remaining',
        value: remaining,
        color: '#c026d3', // fuchsia-600 (rosa)
        label: 'Restante',
      },
    ]
  }, [patientScore, hasScore])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const badgeClassName = useMemo(() => {
    const base = 'rounded-full text-sm font-normal'
    if (!hasRiskClassification) {
      return `${base} bg-gray-100 text-gray-600 hover:bg-gray-100`
    }
    if (riskClassificationForInput === 'HIGH') {
      return `${base} bg-red-100 text-red-700 hover:bg-red-100`
    }
    if (riskClassificationForInput === 'LOW') {
      return `${base} bg-blue-100 text-blue-700 hover:bg-blue-100`
    }
    return `${base} bg-green-100 text-green-700 hover:bg-green-100`
  }, [riskClassificationForInput, hasRiskClassification])
  const chartConfig = useMemo(() => {
    const config: Record<string, { color?: string }> = {}
    finalSlices.forEach((s, i) => {
      config[s.name || `slice-${i}`] = { color: s.color }
    })
    return config
  }, [finalSlices])

  const displayRiskLabel = (() => {
    if (!hasRiskClassification) return 'Não informado'
    if (riskClassificationForInput === 'HIGH') return 'Muito urgente'
    if (riskClassificationForInput === 'LOW') return 'Não urgente'
    return 'Pouco urgente'
  })()

  return (
    <Card
      className={`flex w-full max-w-2xl justify-between gap-8 rounded-3xl border-gray-200 p-2 shadow-none md:gap-12 ${className}`}
    >
      <CardContent className="space-y-1.5 p-2">
        <h1 className="text-lg font-medium text-brand-purple-dark-500">
          Score de Saúde
        </h1>
        <div className="text-4xl text-gray-600">
          {hasScore ? `${patientScore}%` : 'Não informado'}
        </div>
        <div className="mb-2 mt-4 text-base text-purple-800">
          Classificação de risco
        </div>
        <div className="flex">
          <Badge
            variant="secondary"
            className={`${badgeClassName} cursor-pointer`}
            onClick={() => setIsModalOpen(true)}
          >
            {displayRiskLabel}
            <EditOutlinedIcon className="ml-2" viewBox="0 0 32 26" />
          </Badge>
        </div>
      </CardContent>
      <ChartContainer
        className="flex w-full items-center justify-center sm:w-[32%]"
        config={chartConfig}
      >
        <PieChart>
          <Pie
            data={finalSlices}
            dataKey="value"
            nameKey="name"
            innerRadius={25}
            outerRadius={50}
            paddingAngle={0.4}
            stroke="white"
            strokeWidth={1}
          >
            {finalSlices.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {patientId && !isAdmin && !isQRCodePendingDoctor && (
        <ChangeRiskClassificationModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          currentRisk={latestRisk || ''}
          patientId={patientId}
          checkupId={latestCompletedCheckup?.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
            queryClient.invalidateQueries({
              queryKey: ['latestCompletedHealthCheckup', patientId],
            })
          }}
        />
      )}
    </Card>
  )
}
