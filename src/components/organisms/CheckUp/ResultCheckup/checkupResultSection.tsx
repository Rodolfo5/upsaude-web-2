import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { QuestionAnswer } from '@/utils/checkup/questionMapper'

interface CheckupResultSectionProps {
  title: string
  questions: QuestionAnswer[]
}

export function CheckupResultSection({
  title,
  questions,
}: CheckupResultSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const formatAnswer = (answer: string | string[]): string => {
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }
    return answer
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-gray-50 bg-white shadow-none">
      {/* Header da Seção */}
      <div
        className="flex cursor-pointer items-center justify-between bg-primary-50 p-6 transition-colors hover:bg-primary-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {questions.length}{' '}
            {questions.length === 1 ? 'pergunta' : 'perguntas'}
          </span>
          {isExpanded ? (
            <ExpandMoreOutlinedIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ExpandLessOutlinedIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Conteúdo da Seção */}
      {isExpanded && (
        <div className="p-6 pt-0">
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
            {questions.map((qa, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    {qa.question}
                  </h4>
                </div>
                <div className="text-gray-900">
                  {qa.type === 'multiple' ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(qa.answer) ? (
                        qa.answer.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800">
                          {qa.answer}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="break-words text-sm text-gray-800">
                      {formatAnswer(qa.answer)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
