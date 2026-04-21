import type { Questionnaire } from './types'

export const CAT: Questionnaire = {
  text: 'Para cada item abaixo, marque com um (X) o quadrado que melhor descreve como você está se sentindo atualmente.',
  questions: [
    {
      question: 'Tosse',
      options: [
        { label: 'Eu nunca tusso', value: 'Eu nunca tusso', valueNumber: 0 },
        { label: 'Eu tusso poucas vezes', value: 'Eu tusso poucas vezes', valueNumber: 1 },
        { label: 'Eu tusso algumas vezes', value: 'Eu tusso algumas vezes', valueNumber: 2 },
        { label: 'Eu tusso a maior parte do tempo', value: 'Eu tusso a maior parte do tempo', valueNumber: 3 },
        { label: 'Eu tusso o tempo todo', value: 'Eu tusso o tempo todo', valueNumber: 4 },
        { label: 'Eu não consigo parar de tossir', value: 'Eu não consigo parar de tossir', valueNumber: 5 },
      ],
    },
    {
      question: 'Catarro/Expectoração',
      options: [
        { label: 'Não tenho catarro no peito', value: 'Não tenho catarro no peito', valueNumber: 0 },
        { label: 'Tenho um pouco de catarro no peito', value: 'Tenho um pouco de catarro no peito', valueNumber: 1 },
        { label: 'Tenho algum catarro no peito', value: 'Tenho algum catarro no peito', valueNumber: 2 },
        { label: 'Tenho bastante catarro no peito', value: 'Tenho bastante catarro no peito', valueNumber: 3 },
        { label: 'Tenho muito catarro no peito', value: 'Tenho muito catarro no peito', valueNumber: 4 },
        { label: 'Meu peito está completamente cheio de catarro', value: 'Meu peito está completamente cheio de catarro', valueNumber: 5 },
      ],
    },
    {
      question: 'Aperto no Peito',
      options: [
        { label: 'Não sinto aperto no peito', value: 'Não sinto aperto no peito', valueNumber: 0 },
        { label: 'Sinto um leve aperto no peito', value: 'Sinto um leve aperto no peito', valueNumber: 1 },
        { label: 'Sinto algum aperto no peito', value: 'Sinto algum aperto no peito', valueNumber: 2 },
        { label: 'Sinto bastante aperto no peito', value: 'Sinto bastante aperto no peito', valueNumber: 3 },
        { label: 'Sinto muito aperto no peito', value: 'Sinto muito aperto no peito', valueNumber: 4 },
        { label: 'Sinto um aperto insuportável no peito', value: 'Sinto um aperto insuportável no peito', valueNumber: 5 },
      ],
    },
    {
      question: 'Falta de Ar ao Subir Ladeiras ou um Lance de Escadas',
      options: [
        { label: 'Não sinto falta de ar', value: 'Não sinto falta de ar', valueNumber: 0 },
        { label: 'Sinto uma leve falta de ar', value: 'Sinto uma leve falta de ar', valueNumber: 1 },
        { label: 'Sinto alguma falta de ar', value: 'Sinto alguma falta de ar', valueNumber: 2 },
        { label: 'Sinto bastante falta de ar', value: 'Sinto bastante falta de ar', valueNumber: 3 },
        { label: 'Sinto muita falta de ar', value: 'Sinto muita falta de ar', valueNumber: 4 },
        { label: 'Sinto uma falta de ar insuportável', value: 'Sinto uma falta de ar insuportável', valueNumber: 5 },
      ],
    },
    {
      question: 'Limitação em Atividades Domésticas',
      options: [
        { label: 'Não tenho limitações', value: 'Não tenho limitações', valueNumber: 0 },
        { label: 'Tenho uma leve limitação', value: 'Tenho uma leve limitação', valueNumber: 1 },
        { label: 'Tenho alguma limitação', value: 'Tenho alguma limitação', valueNumber: 2 },
        { label: 'Tenho bastante limitação', value: 'Tenho bastante limitação', valueNumber: 3 },
        { label: 'Tenho muita limitação', value: 'Tenho muita limitação', valueNumber: 4 },
        { label: 'Não consigo fazer nenhuma atividade', value: 'Não consigo fazer nenhuma atividade', valueNumber: 5 },
      ],
    },
    {
      question: 'Confiança para Sair de Casa',
      options: [
        { label: 'Sinto-me muito confiante', value: 'Sinto-me muito confiante', valueNumber: 0 },
        { label: 'Sinto-me confiante', value: 'Sinto-me confiante', valueNumber: 1 },
        { label: 'Sinto-me um pouco confiante', value: 'Sinto-me um pouco confiante', valueNumber: 2 },
        { label: 'Sinto-me pouco confiante', value: 'Sinto-me pouco confiante', valueNumber: 3 },
        { label: 'Não sinto nenhuma confiança', value: 'Não sinto nenhuma confiança', valueNumber: 4 },
        { label: 'Nunca saio de casa por causa da minha DPOC', value: 'Nunca saio de casa por causa da minha DPOC', valueNumber: 5 },
      ],
    },
    {
      question: 'Sono',
      options: [
        { label: 'Durmo muito bem', value: 'Durmo muito bem', valueNumber: 0 },
        { label: 'Durmo bem', value: 'Durmo bem', valueNumber: 1 },
        { label: 'Durmo razoavelmente', value: 'Durmo razoavelmente', valueNumber: 2 },
        { label: 'Durmo mal', value: 'Durmo mal', valueNumber: 3 },
        { label: 'Durmo muito mal', value: 'Durmo muito mal', valueNumber: 4 },
        { label: 'Não consigo dormir por causa da minha DPOC', value: 'Não consigo dormir por causa da minha DPOC', valueNumber: 5 },
      ],
    },
    {
      question: 'Energia',
      options: [
        { label: 'Tenho muita energia', value: 'Tenho muita energia', valueNumber: 0 },
        { label: 'Tenho bastante energia', value: 'Tenho bastante energia', valueNumber: 1 },
        { label: 'Tenho alguma energia', value: 'Tenho alguma energia', valueNumber: 2 },
        { label: 'Tenho pouca energia', value: 'Tenho pouca energia', valueNumber: 3 },
        { label: 'Não tenho nenhuma energia', value: 'Não tenho nenhuma energia', valueNumber: 4 },
        { label: 'Sinto-me completamente sem energia', value: 'Sinto-me completamente sem energia', valueNumber: 5 },
      ],
    },
  ],
}
