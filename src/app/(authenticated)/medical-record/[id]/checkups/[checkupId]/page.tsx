'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { CheckupResultSection } from '@/components/organisms/CheckUp/ResultCheckup/checkupResultSection'
import { Card } from '@/components/ui/card'
import { useHealthCheckupById } from '@/hooks/queries/useHealthCheckupById'
import useUser from '@/hooks/useUser'
import { isCheckupCompleted } from '@/utils/checkup/checkupStatus'
import { mapCheckupToQuestions } from '@/utils/checkup/questionMapper'

import { getRequesterName, getRequesterCouncil, CheckupRow } from '../columns'

interface PageProps {
  params: Promise<{
    id: string
    checkupId: string
  }>
}

export default function CheckupResultPage({ params }: PageProps) {
  const { id, checkupId } = use(params)
  const router = useRouter()
  const { data: checkup, isLoading } = useHealthCheckupById(checkupId, id)
  const { currentUser } = useUser()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePlan = async () => {
    if (!checkup || !currentUser) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkupId: checkup.id,
          patientId: id,
          doctorId: currentUser.uid,
          doctorName: currentUser.name || currentUser.email || 'Sistema',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar plano terapêutico')
      }

      // Redirecionar para o plano criado
      if (data.planId) {
        router.push(`/pacientes/${id}/plano-terapeutico/${data.planId}`)
      }
    } catch (err) {
      console.error('Erro ao gerar plano:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao gerar plano terapêutico. Tente novamente.',
      )
    } finally {
      setIsGenerating(false)
    }
  }
  if (isLoading) {
    return (
      <div className="mt-8 px-4 sm:px-8 lg:px-20">
        <div className="animate-pulse">
          <div className="h-8 w-64 rounded bg-gray-200"></div>
          <div className="mt-6 h-48 rounded-lg bg-gray-100"></div>
        </div>
      </div>
    )
  }

  if (!checkup) {
    return (
      <div className="mt-8 px-4 sm:px-8 lg:px-20">
        <div className="flex items-center justify-between">
          <Button
            className="flex p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
            variant={'ghost'}
            onClick={() => router.push(`/medical-record/${id}/checkups/`)}
          >
            <ArrowBackOutlinedIcon fontSize="large" />
            Resultado do Check-up
          </Button>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-500">Check-up não encontrado</p>
        </div>
      </div>
    )
  }

  const checkupRow: CheckupRow = {
    ...checkup,
    doctor: checkup.doctor
      ? {
          name: checkup.doctor.name || '',
          typeOfCredential: checkup.doctor.typeOfCredential || '',
          credential: checkup.doctor.credential || '',
          state: checkup.doctor.state || '',
        }
      : undefined,
  } as CheckupRow
  const isCompleted = isCheckupCompleted(
    checkupRow as unknown as Record<string, unknown>,
  )
  const sections = mapCheckupToQuestions(checkup)
  const professionalName = getRequesterName(checkupRow)
  const professionalCouncil = getRequesterCouncil(checkupRow)
  const showProfessional =
    professionalName !== '-' || professionalCouncil !== '-'

  return (
    <div className="mt-8 px-4 sm:px-8 lg:px-20">
      {/* Header com título e status */}
      <div className="flex items-center justify-between">
        <Button
          className="flex items-center gap-2 p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/medical-record/${id}/checkups/`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Resultado do Check-up
        </Button>
        {isCompleted && (
          <div className="rounded-lg bg-green-100 px-2 py-1">
            <span className="text-sm font-medium text-green-800">
              Realizado
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Coluna Esquerda - Profissional */}
        {showProfessional && (
          <div className="space-y-2">
            {professionalName && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Profissional solicitante |{' '}
                </span>
                <span className="text-sm text-gray-800">
                  {professionalName}
                </span>
              </div>
            )}
            {professionalCouncil && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Credencial |{' '}
                </span>
                <span className="text-sm text-gray-800">
                  {professionalCouncil}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Coluna Direita - Datas */}
        <div className={`space-y-2 ${showProfessional ? 'lg:text-right' : ''}`}>
          <div>
            <span className="text-sm font-medium text-gray-700">
              Data de solicitação |{' '}
            </span>
            <span className="text-sm text-gray-800">
              {format(new Date(checkup.createdAt), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </span>
          </div>
          {checkup.completedAt && (
            <div>
              <span className="text-sm font-medium text-gray-700">
                Data de realização |{' '}
              </span>
              <span className="text-sm text-gray-800">
                {format(new Date(checkup.completedAt), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Seções de Respostas */}
      <div className="mt-6">
        {sections.length === 0 ? (
          <Card className="rounded-[28px] border-none bg-white p-8 text-center">
            <p className="text-gray-500">
              Nenhuma resposta encontrada para este check-up.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {sections.map((section, index) => (
              <CheckupResultSection
                key={index}
                title={section.title}
                questions={section.questions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="mt-8 flex flex-col items-center gap-4 pb-8">
        {isCompleted && (
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating
                ? 'Gerando Plano com IA...'
                : 'Gerar Plano Terapêutico com IA'}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="max-w-md text-center text-xs text-gray-500">
              A IA analisará as respostas do checkup e criará um plano inicial
              com metas, atividades e orientações personalizadas.
            </p>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/pacientes/${id}/checkups`)}
        >
          Voltar ao Histórico
        </Button>
      </div>
    </div>
  )
}
