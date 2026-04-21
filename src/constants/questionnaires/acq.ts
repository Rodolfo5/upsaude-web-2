import type { Questionnaire } from './types'

const acqOptions = [
  { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
  { label: 'Raramente', value: 'Raramente', valueNumber: 1 },
  { label: 'Mais de uma vez por semana', value: 'Mais de uma vez por semana', valueNumber: 2 },
  { label: 'Algumas noites na semana', value: 'Algumas noites na semana', valueNumber: 3 },
  { label: 'A maioria das noites na semana', value: 'A maioria das noites na semana', valueNumber: 4 },
  { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },
  { label: 'Mais de uma vez por noite', value: 'Mais de uma vez por noite', valueNumber: 6 },
]

export const AC_Q: Questionnaire = {
  text: 'Durante a última semana, por favor, responda às seguintes perguntas sobre sua asma.',
  questions: [
    {
      question: 'Em média, durante a última semana, com que frequência você acordou durante a noite por causa da sua asma?',
      options: acqOptions,
    },
    {
      question: 'Em média, durante a última semana, quão ruins foram os seus sintomas de asma quando você acordou de manhã?',
      options: acqOptions,
    },
    {
      question: 'Em geral, durante a última semana, quão limitadas foram suas atividades diárias por causa da asma?',
      options: acqOptions,
    },
    {
      question: 'Em geral, durante a última semana, quanta falta de ar você sentiu por causa da asma?',
      options: acqOptions,
    },
    {
      question: 'Em geral, durante a última semana, quanto chiado no peito você teve?',
      options: acqOptions,
    },
    {
      question: 'Em geral, durante a última semana, com que frequência você usou sua medicação de resgate de ação rápida (ex: Salbutamol)?',
      options: acqOptions,
    },
    {
      question: 'Qual o seu valor de VEF1 (% do previsto) medido hoje? (Esta pergunta é preenchida pelo profissional e convertida para uma escala de 0-6. Se a espirometria não estiver disponível, a pontuação é a média apenas das 6 primeiras perguntas).',
    },
  ],
}
