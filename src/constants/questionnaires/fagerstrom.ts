import type { Questionnaire } from './types'

export const FAGERSTROM_NICOTINE_DEPENDENCE: Questionnaire = {
  text: '',
  questions: [
    {
      question: 'Quanto tempo após acordar você fuma seu primeiro cigarro?',
      options: [
        { label: 'Após 60 minutos', value: 'Após 60 minutos', valueNumber: 0 },
        { label: 'Entre 31 e 60 minutos', value: 'Entre 31 e 60 minutos', valueNumber: 1 },
        { label: 'Entre 6 e 30 minutos', value: 'Entre 6 e 30 minutos', valueNumber: 2 },
        { label: 'Nos primeiros 5 minutos', value: 'Nos primeiros 5 minutos', valueNumber: 3 },
      ],
    },
    {
      question: 'Você acha difícil não fumar em locais proibidos (ex: igrejas, cinemas)?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },
        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
    {
      question: 'Qual cigarro do dia te traria mais desprazer em abandonar?',
      options: [
        { label: 'O primeiro da manhã', value: 'O primeiro da manhã', valueNumber: 1 },
        { label: 'Qualquer outro', value: 'Qualquer outro', valueNumber: 0 },
      ],
    },
    {
      question: 'Quantos cigarros você fuma por dia?',
      options: [
        { label: '10 ou menos', value: '10 ou menos', valueNumber: 0 },
        { label: '11 a 20', value: '11 a 20', valueNumber: 1 },
        { label: '21 a 30', value: '21 a 30', valueNumber: 2 },
        { label: '31 ou mais', value: '31 ou mais', valueNumber: 3 },
      ],
    },
    {
      question: 'Você fuma mais frequentemente nas primeiras horas após acordar do que no resto do dia?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },
        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
    {
      question: 'Você fuma mesmo que esteja doente a ponto de ficar acamado a maior parte do dia?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },
        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
  ],
}
