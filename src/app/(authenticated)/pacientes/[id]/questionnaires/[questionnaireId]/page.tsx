'use client'

import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { use } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { QuestionnaireResultSection } from '@/components/organisms/Questionnaire/questionnaireResultSection'
import { Card } from '@/components/ui/card'
import { useFindDoctorById } from '@/hooks/queries/useFindDoctorById'
import { useQuestionnaireById } from '@/hooks/queries/useQuestionnaireById'
import { useRequestQuestionnaireById } from '@/hooks/queries/useRequestQuestionnaireById'
import { timestampToDate } from '@/lib/utils'
import { DoctorEntity } from '@/types/entities/user'
import { mapQuestionnaireToSections } from '@/utils/questionnaire/questionMapper'

interface PageProps {
  params: Promise<{
    id: string
    questionnaireId: string
  }>
}

function getDoctorName(doctor: DoctorEntity | null | undefined): string {
  return doctor?.name || '-'
}

function getDoctorCredentials(doctor: DoctorEntity | null | undefined): string {
  if (!doctor) return '-'
  return (
    `${doctor.typeOfCredential || ''} ${doctor.credential || ''} ${doctor.state || ''}`.trim() ||
    '-'
  )
}

function formatDate(date: Date | Timestamp | null | undefined): string {
  if (!date) return 'Data não disponível'
  // Se já é um Date, usa diretamente
  if (date instanceof Date) {
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }
  // Se é um Timestamp, converte primeiro
  const convertedDate = timestampToDate(date)
  if (!convertedDate) return 'Data não disponível'
  return format(convertedDate, 'dd/MM/yyyy', { locale: ptBR })
}

export default function QuestionnaireResultPage({ params }: PageProps) {
  const { id, questionnaireId } = use(params)
  const router = useRouter()
  const { data: questionnaire, isLoading } =
    useQuestionnaireById(questionnaireId)
  const { data: doctor } = useFindDoctorById(questionnaire?.doctorId || '')
  const { data: requestQuestionnaire } = useRequestQuestionnaireById(
    questionnaire?.requestQuestionnaireId || '',
  )

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

  if (!questionnaire) {
    return (
      <div className="mt-8 px-4 sm:px-8 lg:px-20">
        <div className="flex items-center justify-between">
          <Button
            className="flex p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
            variant={'ghost'}
            onClick={() => router.back()}
          >
            <ArrowBackOutlinedIcon fontSize="large" />
            Resultado do Questionário
          </Button>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-500">Questionário não encontrado</p>
        </div>
      </div>
    )
  }

  const sections = mapQuestionnaireToSections(questionnaire)
  const hasAnswers =
    questionnaire.answers && Object.keys(questionnaire.answers).length > 0

  return (
    <div className="mt-8 px-4 sm:px-8 lg:px-20">
      <div className="flex items-center justify-between">
        <Button
          className="flex items-center gap-2 p-0 text-xl text-brand-purple-dark-500 lg:text-3xl"
          variant={'ghost'}
          onClick={() => router.push(`/pacientes/${id}/questionnaires/`)}
        >
          <ArrowBackOutlinedIcon fontSize="medium" />
          Resultado do Questionário
        </Button>
        {hasAnswers && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-800">
              {questionnaire.questionnaireName}
            </span>
            <div className="rounded-lg bg-green-100 px-2 py-1">
              <span className="text-sm font-medium text-green-800">
                Realizado
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Profissional solicitante |{' '}
            </span>
            <span className="text-sm text-gray-800">
              {getDoctorName(doctor)}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">
              Credencial |{' '}
            </span>
            <span className="text-sm text-gray-800">
              {getDoctorCredentials(doctor)}
            </span>
          </div>
        </div>

        <div className="space-y-2 lg:text-right">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Data de solicitação |{' '}
            </span>
            <span className="text-sm text-gray-800">
              {formatDate(requestQuestionnaire?.createdAt)}
            </span>
          </div>
          {hasAnswers && (
            <div>
              <span className="text-sm font-medium text-gray-700">
                Data de realização |{' '}
              </span>
              <span className="text-sm text-gray-800">
                {formatDate(questionnaire.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {!hasAnswers ? (
          <Card className="rounded-[28px] border-none bg-white p-8 text-center">
            <p className="text-gray-500">
              Este questionário ainda não foi respondido pelo paciente.
            </p>
          </Card>
        ) : sections.length === 0 ? (
          <Card className="rounded-[28px] border-none bg-white p-8 text-center">
            <p className="text-gray-500">
              Nenhuma resposta encontrada para este questionário.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <QuestionnaireResultSection key={index} section={section} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-4 pb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/pacientes/${id}/questionnaires`)}
        >
          Voltar ao Histórico
        </Button>
      </div>
    </div>
  )
}
