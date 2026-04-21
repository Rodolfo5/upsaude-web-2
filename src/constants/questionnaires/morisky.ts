import type { Questionnaire } from './types'

export const MORISKY: Questionnaire = {
  text: '',
  questions: [
    {
      question: 'Você às vezes se esquece de tomar seus medicamentos?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },
        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },
    {
      question: 'As pessoas às vezes esquecem de tomar os seus medicamentos por outras razões que não o esquecimento. Nos últimos 15 dias, quantas vezes você deixou de tomar os seus medicamentos?',
    },
    {
      question: 'Você alguma vez já reduziu ou deixou de tomar o seu medicamento sem avisar o seu médico porque se sentiu pior quando o tomou?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },
        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },
    {
      question: 'Quando você viaja ou sai de casa, você às vezes se esquece de levar o seu medicamento?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },
        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },
    {
      question: 'Você tomou o seu medicamento ontem?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },
        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
    {
      question: 'Quando você sente que os seus sintomas estão sob controle, você às vezes deixa de tomar o seu medicamento?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },
        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },
    {
      question: 'Tomar medicamentos todos os dias é um incômodo para algumas pessoas. Você se sente incomodado por ter que seguir um plano de tratamento?',
      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },
        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },
    {
      question: 'Com que frequência você tem dificuldade em lembrar-se de tomar todos os seus medicamentos?',
      options: [
        { label: 'Sempre/Frequentemente', value: 'Sempre/Frequentemente', valueNumber: 0 },
        { label: 'Às vezes', value: 'Às vezes', valueNumber: 0.25 },
        { label: 'Raramente', value: 'Raramente', valueNumber: 0.5 },
        { label: 'Nunca', value: 'Nunca', valueNumber: 1 },
      ],
    },
  ],
}
