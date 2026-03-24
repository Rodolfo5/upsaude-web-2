import { Timestamp } from 'firebase/firestore'

import { Questionnaire } from '@/constants/questionnairesOptions'

import { RequestQuestionnairesType } from './requestQuestionnaires'

export type QuestionnaireAnswersEntity = Record<string, string>

export type QuestionnaireEntity = {
  id: string
  patientId: string
  doctorId: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  questionnaireName: string
  requestQuestionnaireId: string
  questionnaire: Questionnaire
  answers: QuestionnaireAnswersEntity
  type: RequestQuestionnairesType
  result: number
}
