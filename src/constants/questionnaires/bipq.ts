import type { Questionnaire } from './types'

export const B_IPQ: Questionnaire = {
  text: 'Avalie as seguintes afirmações sobre a sua doença em uma escala de 0 a 10.',
  questions: [
    {
      question: 'Consequências: O quanto sua doença afeta sua vida?',
      options: [
        { label: 'Nenhum efeito', value: 'Nenhum efeito', valueNumber: 0 },
        { label: 'Afeta muito', value: 'Afeta muito', valueNumber: 10 },
      ],
    },
    {
      question: 'Duração (Timeline): Por quanto tempo você acha que sua doença irá durar?',
      options: [
        { label: 'Um tempo muito curto', value: 'Um tempo muito curto', valueNumber: 0 },
        { label: 'Para sempre', value: 'Para sempre', valueNumber: 10 },
      ],
    },
    {
      question: 'Controle Pessoal: O quanto de controle você sente que tem sobre sua doença?',
      options: [
        { label: 'Nenhum controle', value: 'Nenhum controle', valueNumber: 0 },
        { label: 'Controle total', value: 'Controle total', valueNumber: 10 },
      ],
    },
    {
      question: 'Controle do Tratamento: O quanto você acha que seu tratamento pode ajudar sua doença?',
      options: [
        { label: 'Nada útil', value: 'Nada útil', valueNumber: 0 },
        { label: 'Extremamente útil', value: 'Extremamente útil', valueNumber: 10 },
      ],
    },
    {
      question: 'Identidade: O quanto você vivencia sintomas da sua doença?',
      options: [
        { label: 'Nenhum sintoma', value: 'Nenhum sintoma', valueNumber: 0 },
        { label: 'Muitos sintomas', value: 'Muitos sintomas', valueNumber: 10 },
      ],
    },
    {
      question: 'Preocupação: O quão preocupado(a) você está com sua doença?',
      options: [
        { label: 'Nada preocupado', value: 'Nada preocupado', valueNumber: 0 },
        { label: 'Muito preocupado', value: 'Muito preocupado', valueNumber: 10 },
      ],
    },
    {
      question: 'Compreensão: O quão bem você sente que entende sua doença?',
      options: [
        { label: 'Não entendo nada', value: 'Não entendo nada', valueNumber: 0 },
        { label: 'Entendo muito bem', value: 'Entendo muito bem', valueNumber: 10 },
      ],
    },
    {
      question: 'Resposta Emocional: O quanto sua doença afeta você emocionalmente?',
      options: [
        { label: 'Nada afetado', value: 'Nada afetado', valueNumber: 0 },
        { label: 'Muito afetado', value: 'Muito afetado', valueNumber: 10 },
      ],
    },
    {
      question: 'Causas: liste em ordem de importância os 3 fatores que você acredita que causaram sua doença (resposta aberta).',
    },
  ],
}
