import type { Questionnaire } from './types'

const pssOptions = [
  { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
  { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },
  { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },
  { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },
  { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
]

export const PSS: Questionnaire = {
  text: 'As perguntas a seguir procuram saber sobre seus sentimentos e pensamentos durante o último mês. Em cada caso, por favor, indique com que frequência você se sentiu ou pensou de certa maneira.',
  questions: [
    { question: 'No último mês, com que frequência você ficou aborrecido(a) por causa de algo que aconteceu inesperadamente?', options: pssOptions },
    { question: 'No último mês, com que frequência você sentiu que foi incapaz de controlar as coisas importantes na sua vida?', options: pssOptions },
    { question: 'No último mês, com que frequência você se sentiu nervoso(a) e estressado(a)?', options: pssOptions },
    { question: 'No último mês, com que frequência você se sentiu confiante sobre sua capacidade de lidar com seus problemas pessoais?', options: pssOptions },
    { question: 'No último mês, com que frequência você sentiu que as coisas estavam indo do seu jeito?', options: pssOptions },
    { question: 'No último mês, com que frequência você sentiu que não conseguia dar conta de todas as coisas que tinha para fazer?', options: pssOptions },
    { question: 'No último mês, com que frequência você foi capaz de controlar as irritações na sua vida?', options: pssOptions },
    { question: 'No último mês, com que frequência você sentiu que estava "por cima" dos acontecimentos?', options: pssOptions },
    { question: 'No último mês, com que frequência você se irritou por causa de coisas que estavam fora do seu controle?', options: pssOptions },
    { question: 'No último mês, com que frequência você sentiu que as dificuldades estavam se acumulando tanto que você não conseguia superá-las?', options: pssOptions },
  ],
}
