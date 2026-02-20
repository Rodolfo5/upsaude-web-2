'use client'

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { CheckupResultSection } from '@/components/organisms/CheckUp/ResultCheckup/checkupResultSection'
import { Card } from '@/components/ui/card'
import { useHealthCheckupById } from '@/hooks/queries/useHealthCheckupById'
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
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col bg-white px-16">
        <div className="mt-24 animate-pulse">
          <div className="h-8 w-64 rounded bg-gray-200"></div>
          <div className="mt-6 h-48 rounded-lg bg-gray-100"></div>
        </div>
      </div>
    )
  }

  if (!checkup) {
    return (
      <div className="flex h-screen w-full flex-col bg-white px-16">
        <div className="mt-24 flex items-center justify-between">
          <Button
            className="flex p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
            variant={'ghost'}
            onClick={() => router.push(`/admin/medical-record/${id}/checkups/`)}
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

  const sections = mapCheckupToQuestions(checkup)
  const professionalName = getRequesterName(checkup as CheckupRow)
  const professionalCouncil = getRequesterCouncil(checkup as CheckupRow)
  const showProfessional = professionalName !== '-' || professionalCouncil !== '-'

  return (
    <div className="flex h-screen w-full flex-col bg-white px-16">
      {/* Header com título e status */}
      <div className="mt-24 flex items-center justify-between">
        <Button
          className="flex items-center gap-2 p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/admin/medical-record/${id}/checkups/`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Resultado do Check-up
        </Button>
        {checkup.status === 'COMPLETED' && (
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
      <div className="mt-8 flex justify-center gap-4 pb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/medical-record/${id}/checkups`)}
        >
          Voltar ao Histórico
        </Button>
      </div>
    </div>
  )
}
