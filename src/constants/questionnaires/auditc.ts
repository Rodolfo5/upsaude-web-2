import type { Questionnaire } from './types'

export const AUDIT_C: Questionnaire = {
  text: 'Responda às seguintes perguntas sobre seu consumo de álcool no último ano.',
  questions: [
    {
      question: 'Com que frequência você toma alguma bebida alcoólica?',
      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
        { label: 'Mensalmente ou menos', value: 'Mensalmente ou menos', valueNumber: 1 },
        { label: '2 a 4 vezes por mês', value: '2 a 4 vezes por mês', valueNumber: 2 },
        { label: '2 a 3 vezes por semana', value: '2 a 3 vezes por semana', valueNumber: 3 },
        { label: '4 ou mais vezes por semana', value: '4 ou mais vezes por semana', valueNumber: 4 },
      ],
    },
    {
      question: 'Quantas doses de bebida você consome em um dia típico de consumo? (Uma dose = 1 lata de cerveja, 1 taça de vinho ou 1 dose de destilado) ',
      options: [
        { label: '1 ou 2', value: '1 ou 2', valueNumber: 0 },
        { label: '3 ou 4', value: '3 ou 4', valueNumber: 1 },
        { label: '5 ou 6', value: '5 ou 6', valueNumber: 2 },
        { label: '7 a 9', value: '7 a 9', valueNumber: 3 },
        { label: '10 ou mais', value: '10 ou mais', valueNumber: 4 },
      ],
    },
    {
      question: 'Com que frequência você consome 6 ou mais doses em uma única ocasião?',
      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
        { label: 'Menos de uma vez por mês', value: 'Menos de uma vez por mês', valueNumber: 1 },
        { label: 'Mensalmente', value: 'Mensalmente', valueNumber: 2 },
        { label: 'Semanalmente', value: 'Semanalmente', valueNumber: 3 },
        { label: 'Diariamente ou quase diariamente', value: 'Diariamente ou quase diariamente', valueNumber: 4 },
      ],
    },
  ],
}
