'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FavoriteIcon from '@mui/icons-material/Favorite'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import QuizIcon from '@mui/icons-material/Quiz'
import React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useHealthCheckups } from '@/hooks/queries/useHealthCheckups'
import { useFollowUpData } from '@/hooks/useFollowUpData'

type Props = {
  patientId: string
  className?: string
}

interface FollowUpItemProps {
  icon: React.ReactNode
  title: string
  status: 'pending' | 'up-to-date'
}

const FollowUpItem: React.FC<FollowUpItemProps> = ({ icon, title, status }) => {
  const statusConfig = {
    pending: {
      label: 'Pendente',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    'up-to-date': {
      label: 'Em dia',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0">
      <div className="flex items-center gap-1">
        <div className="flex h-8 w-8 items-center justify-center text-gray-600">
          {icon}
        </div>
        <span className="text-base text-gray-800">{title}</span>
      </div>
      <Badge className={`${config.className} flex rounded-full shadow-none`}>
        {config.label}
      </Badge>
    </div>
  )
}

const FollowUpCard: React.FC<Props> = ({ patientId, className = '' }) => {
  const { isLoading: checkupsLoading } = useHealthCheckups(patientId)
  const {
    hasIncompleteCheckup,
    revaluationRequested,
    hasIncompleteQuestionnaires,
    isAdheringToTreatment,
    isLoading: followUpLoading,
  } = useFollowUpData(patientId)

  const isLoading = checkupsLoading || followUpLoading

  if (isLoading) {
    return (
      <Card className={`rounded-3xl border-gray-200 bg-white p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 w-32 rounded bg-gray-200"></div>
          <div className="mt-6 space-y-4">
            <div className="h-12 w-full rounded bg-gray-100"></div>
            <div className="h-12 w-full rounded bg-gray-100"></div>
            <div className="h-12 w-full rounded bg-gray-100"></div>
            <div className="h-12 w-full rounded bg-gray-100"></div>
          </div>
        </div>
      </Card>
    )
  }

  const checkupStatus = hasIncompleteCheckup ? 'pending' : 'up-to-date'
  const revaluationStatus = revaluationRequested ? 'pending' : 'up-to-date'
  const questionnaireStatus = hasIncompleteQuestionnaires
    ? 'pending'
    : 'up-to-date'
  const treatmentStatus = isAdheringToTreatment ? 'up-to-date' : 'pending'

  return (
    <Card
      className={`rounded-3xl border-gray-200 bg-white p-4 shadow-none ${className}}`}
    >
      <h3 className="mb-3 text-xl font-semibold text-brand-purple-dark-500">
        Follow-up
      </h3>
      <>
        <FollowUpItem
          icon={<CheckCircleOutlineIcon fontSize="small" />}
          title="Check-Up"
          status={checkupStatus}
        />
        <FollowUpItem
          icon={<MenuBookIcon fontSize="small" />}
          title="Reavaliação do plano"
          status={revaluationStatus}
        />
        <FollowUpItem
          icon={<QuizIcon fontSize="small" />}
          title="Questionário de Saúde"
          status={questionnaireStatus}
        />
        <FollowUpItem
          icon={<FavoriteIcon fontSize="small" />}
          title="Adesão ao tratamento"
          status={treatmentStatus}
        />
      </>
    </Card>
  )
}

export default FollowUpCard
