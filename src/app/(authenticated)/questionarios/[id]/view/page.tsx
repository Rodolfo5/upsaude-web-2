'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { getQuestionnairePdfPath } from '@/utils/questionnaire/getQuestionnairePdfPath'

import { questionnaires } from '../../column'

export default function QuestionnaireViewPage() {
  const router = useRouter()
  const params = useParams()
  const questionnaireId = params?.id as string

  const [pdfPath, setPdfPath] = useState<string | null>(null)
  const [questionnaireName, setQuestionnaireName] = useState<string>('')

  useEffect(() => {
    if (!questionnaireId) return

    // Buscar o questionário pelo ID
    const questionnaire = questionnaires.find((q) => q.id === questionnaireId)

    if (!questionnaire) {
      router.push('/questionarios')
      return
    }

    setQuestionnaireName(questionnaire.name)

    // Obter o caminho do PDF
    const path = getQuestionnairePdfPath(questionnaire.name)
    setPdfPath(path)
  }, [questionnaireId, router])

  const handleBack = () => {
    router.push('/questionarios')
  }

  if (!pdfPath) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            PDF não encontrado
          </h1>
          <p className="mb-4 text-gray-600">
            O arquivo PDF para este questionário não está disponível.
          </p>
          <Button onClick={handleBack} variant="outline">
            Voltar para questionários
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 flex h-[calc(100vh-0px)] w-full flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex-shrink-0 bg-white px-4 py-4 sm:px-6 md:px-10 lg:px-20">
        <div className="flex items-start justify-start gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowBackIcon className="h-5 w-5 text-purple-800" />
            </Button>
          </div>
          <h1 className="break-words text-lg font-semibold text-purple-800 sm:text-xl md:text-2xl lg:text-3xl">
            {questionnaireName}
          </h1>
        </div>
      </div>

      {/* PDF Viewer - ocupa todo o espaço restante */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <iframe
          src={pdfPath}
          className="h-full w-full border-0"
          title={questionnaireName}
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
