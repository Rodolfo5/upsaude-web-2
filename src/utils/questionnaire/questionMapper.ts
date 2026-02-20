import { QuestionnaireQuestion } from '@/constants/questionnairesOptions'
import { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

export interface QuestionnaireQuestionAnswer {
  question: string
  answer: string
  questionIndex: number
}

export interface QuestionnaireSection {
  title: string
  text?: string
  questions: QuestionnaireQuestionAnswer[]
  totalScore?: number
}

/**
 * Mapeia um questionário e suas respostas para uma estrutura de seções
 * As respostas são associadas por índice: answer index 0 = question 0
 */
export function mapQuestionnaireToSections(
  questionnaireEntity: QuestionnaireEntity,
): QuestionnaireSection[] {
  const { questionnaire, answers } = questionnaireEntity
  const sections: QuestionnaireSection[] = []

  if (!questionnaire || !answers) {
    return sections
  }

  // Converter answers object para array ordenado por índice
  const answersArray: string[] = []
  Object.keys(answers)
    .sort((a, b) => parseInt(a) - parseInt(b)) // Ordenar por índice numérico
    .forEach((key) => {
      answersArray[parseInt(key)] = answers[key]
    })

  // Mapear perguntas com suas respectivas respostas
  const questionAnswers: QuestionnaireQuestionAnswer[] =
    questionnaire.questions.map(
      (question: QuestionnaireQuestion, index: number) => ({
        question: question.question,
        answer: answersArray[index] || 'Não respondido',
        questionIndex: index,
      }),
    )

  // Criar seção única com todas as perguntas
  const section: QuestionnaireSection = {
    title: getQuestionnaireDisplayName(questionnaireEntity.questionnaireName),
    text: questionnaire.text,
    questions: questionAnswers,
  }

  // Adicionar pontuação se disponível
  if (questionnaireEntity.result !== undefined) {
    section.totalScore = questionnaireEntity.result
  }

  sections.push(section)
  return sections
}

/**
 * Retorna o nome de exibição do questionário
 */
export function getQuestionnaireDisplayName(questionnaireName: string): string {
  const displayNames: Record<string, string> = {
    AC_Q: 'Questionário de Controle da Asma (ACQ)',
    CAT: 'Teste de Avaliação DPOC (CAT)',
    AUDIT_C: 'Teste de Triagem de Álcool (AUDIT-C)',
  }

  return displayNames[questionnaireName] || questionnaireName
}
