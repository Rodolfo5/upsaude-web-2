export type QuestionnaireOption = {
  label: string
  value: string
  valueNumber?: number
}

export type QuestionnaireQuestion = {
  question: string
  options?: QuestionnaireOption[]
}

export type Questionnaire = {
  text: string
  questions: QuestionnaireQuestion[]
}
