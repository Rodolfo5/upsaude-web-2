import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { QuestionnaireSection } from '@/utils/questionnaire/questionMapper'

interface QuestionnaireResultSectionProps {
  section: QuestionnaireSection
}

export function QuestionnaireResultSection({
  section,
}: QuestionnaireResultSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="space-y-6">
      {/* Card principal com o título e descrição do questionário */}
      <Card className="overflow-hidden rounded-[28px] border border-gray-50 bg-white shadow-none">
        {/* Header da Seção */}
        <div
          className="flex cursor-pointer items-center justify-between bg-primary-50 p-6 transition-colors hover:bg-primary-100"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {section.title}
            </h3>
            {section.text && (
              <p className="mt-2 text-sm text-gray-600">{section.text}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {section.questions.length}{' '}
              {section.questions.length === 1 ? 'pergunta' : 'perguntas'}
            </span>
            {isExpanded ? (
              <ExpandLessOutlinedIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ExpandMoreOutlinedIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Pontuação e interpretação */}
        {section.totalScore !== undefined && (
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Pontuação Total:
              </span>
              <span className="text-lg font-semibold text-primary-600">
                {section.totalScore}
              </span>
            </div>
          </div>
        )}

        {/* Conteúdo da Seção - Perguntas e Respostas */}
        {isExpanded && (
          <div className="p-6 pt-0">
            <div className="mt-4 space-y-4">
              {section.questions.map((qa, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between">
                      <h4 className="flex-1 text-sm font-medium text-gray-700">
                        {qa.question}
                      </h4>
                      <span className="ml-2 text-xs text-gray-400">
                        #{qa.questionIndex + 1}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-900">
                    <p className="break-words text-sm font-medium text-primary-700">
                      {qa.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
