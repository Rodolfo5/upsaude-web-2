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

export const AC_Q: Questionnaire = {
  text: 'Durante a última semana, por favor, responda às seguintes perguntas sobre sua asma.',
  questions: [
    {
      question:
        'Em média, durante a última semana, com que frequência você acordou durante a noite por causa da sua asma?',
      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
        { label: 'Raramente', value: 'Raramente', valueNumber: 1 },
        {
          label: 'Mais de uma vez por semana',
          value: 'Mais de uma vez por semana',
          valueNumber: 2,
        },
        {
          label: 'Algumas noites na semana',
          value: 'Algumas noites na semana',
          valueNumber: 3,
        },
        {
          label: 'A maioria das noites na semana',
          value: 'A maioria das noites na semana',
          valueNumber: 4,
        },
        { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },
        {
          label: 'Mais de uma vez por noite',

          value: 'Mais de uma vez por noite',

          valueNumber: 6,
        },
      ],
    },

    {
      question:
        'Em média, durante a última semana, quão ruins foram os seus sintomas de asma quando você acordou de manhã?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Raramente', value: 'Raramente', valueNumber: 1 },

        {
          label: 'Mais de uma vez por semana',

          value: 'Mais de uma vez por semana',

          valueNumber: 2,
        },

        {
          label: 'Algumas noites na semana',

          value: 'Algumas noites na semana',

          valueNumber: 3,
        },

        {
          label: 'A maioria das noites na semana',

          value: 'A maioria das noites na semana',

          valueNumber: 4,
        },

        { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },

        {
          label: 'Mais de uma vez por noite',

          value: 'Mais de uma vez por noite',

          valueNumber: 6,
        },
      ],
    },

    {
      question:
        'Em geral, durante a última semana, quão limitadas foram suas atividades diárias por causa da asma?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Raramente', value: 'Raramente', valueNumber: 1 },

        {
          label: 'Mais de uma vez por semana',

          value: 'Mais de uma vez por semana',

          valueNumber: 2,
        },

        {
          label: 'Algumas noites na semana',

          value: 'Algumas noites na semana',

          valueNumber: 3,
        },

        {
          label: 'A maioria das noites na semana',

          value: 'A maioria das noites na semana',

          valueNumber: 4,
        },

        { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },

        {
          label: 'Mais de uma vez por noite',

          value: 'Mais de uma vez por noite',

          valueNumber: 6,
        },
      ],
    },

    {
      question:
        'Em geral, durante a última semana, quanta falta de ar você sentiu por causa da asma?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Raramente', value: 'Raramente', valueNumber: 1 },

        {
          label: 'Mais de uma vez por semana',

          value: 'Mais de uma vez por semana',

          valueNumber: 2,
        },

        {
          label: 'Algumas noites na semana',

          value: 'Algumas noites na semana',

          valueNumber: 3,
        },

        {
          label: 'A maioria das noites na semana',

          value: 'A maioria das noites na semana',

          valueNumber: 4,
        },

        { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },

        {
          label: 'Mais de uma vez por noite',

          value: 'Mais de uma vez por noite',

          valueNumber: 6,
        },
      ],
    },

    {
      question:
        'Em geral, durante a última semana, quanto chiado no peito você teve?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Raramente', value: 'Raramente', valueNumber: 1 },

        {
          label: 'Mais de uma vez por semana',

          value: 'Mais de uma vez por semana',

          valueNumber: 2,
        },

        {
          label: 'Algumas noites na semana',

          value: 'Algumas noites na semana',

          valueNumber: 3,
        },

        {
          label: 'A maioria das noites na semana',

          value: 'A maioria das noites na semana',

          valueNumber: 4,
        },

        { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },

        {
          label: 'Mais de uma vez por noite',

          value: 'Mais de uma vez por noite',

          valueNumber: 6,
        },
      ],
    },

    {
      question:
        'Em geral, durante a última semana, com que frequência você usou sua medicação de resgate de ação rápida (ex: Salbutamol)?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Raramente', value: 'Raramente', valueNumber: 1 },

        {
          label: 'Mais de uma vez por semana',

          value: 'Mais de uma vez por semana',

          valueNumber: 2,
        },

        {
          label: 'Algumas noites na semana',

          value: 'Algumas noites na semana',

          valueNumber: 3,
        },

        {
          label: 'A maioria das noites na semana',

          value: 'A maioria das noites na semana',

          valueNumber: 4,
        },

        { label: 'Todas as noites', value: 'Todas as noites', valueNumber: 5 },

        {
          label: 'Mais de uma vez por noite',

          value: 'Mais de uma vez por noite',

          valueNumber: 6,
        },
      ],
    },

    {
      question:
        'Qual o seu valor de VEF1 (% do previsto) medido hoje? (Esta pergunta é preenchida pelo profissional e convertida para uma escala de 0-6. Se a espirometria não estiver disponível, a pontuação é a média apenas das 6 primeiras perguntas).',
    },
  ],
}

export const CAT: Questionnaire = {
  text: 'Para cada item abaixo, marque com um (X) o quadrado que melhor descreve como você está se sentindo atualmente.',

  questions: [
    {
      question: 'Tosse',

      options: [
        {
          label: 'Eu nunca tusso',

          value: 'Eu nunca tusso',

          valueNumber: 0,
        },

        {
          label: 'Eu tusso poucas vezes',

          value: 'Eu tusso poucas vezes',

          valueNumber: 1,
        },

        {
          label: 'Eu tusso algumas vezes',

          value: 'Eu tusso algumas vezes',

          valueNumber: 2,
        },

        {
          label: 'Eu tusso a maior parte do tempo',

          value: 'Eu tusso a maior parte do tempo',

          valueNumber: 3,
        },

        {
          label: 'Eu tusso o tempo todo',

          value: 'Eu tusso o tempo todo',

          valueNumber: 4,
        },

        {
          label: 'Eu não consigo parar de tossir',

          value: 'Eu não consigo parar de tossir',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Catarro/Expectoração',

      options: [
        {
          label: 'Não tenho catarro no peito',

          value: 'Não tenho catarro no peito',

          valueNumber: 0,
        },

        {
          label: 'Tenho um pouco de catarro no peito',

          value: 'Tenho um pouco de catarro no peito',

          valueNumber: 1,
        },

        {
          label: 'Tenho algum catarro no peito',

          value: 'Tenho algum catarro no peito',

          valueNumber: 2,
        },

        {
          label: 'Tenho bastante catarro no peito',

          value: 'Tenho bastante catarro no peito',

          valueNumber: 3,
        },

        {
          label: 'Tenho muito catarro no peito',

          value: 'Tenho muito catarro no peito',

          valueNumber: 4,
        },

        {
          label: 'Meu peito está completamente cheio de catarro',

          value: 'Meu peito está completamente cheio de catarro',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Aperto no Peito',

      options: [
        {
          label: 'Não sinto aperto no peito',

          value: 'Não sinto aperto no peito',

          valueNumber: 0,
        },

        {
          label: 'Sinto um leve aperto no peito',

          value: 'Sinto um leve aperto no peito',

          valueNumber: 1,
        },

        {
          label: 'Sinto algum aperto no peito',

          value: 'Sinto algum aperto no peito',

          valueNumber: 2,
        },

        {
          label: 'Sinto bastante aperto no peito',

          value: 'Sinto bastante aperto no peito',

          valueNumber: 3,
        },

        {
          label: 'Sinto muito aperto no peito',

          value: 'Sinto muito aperto no peito',

          valueNumber: 4,
        },

        {
          label: 'Sinto um aperto insuportável no peito',

          value: 'Sinto um aperto insuportável no peito',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Falta de Ar ao Subir Ladeiras ou um Lance de Escadas',

      options: [
        {
          label: 'Não sinto falta de ar',

          value: 'Não sinto falta de ar',

          valueNumber: 0,
        },

        {
          label: 'Sinto uma leve falta de ar',

          value: 'Sinto uma leve falta de ar',

          valueNumber: 1,
        },

        {
          label: 'Sinto alguma falta de ar',

          value: 'Sinto alguma falta de ar',

          valueNumber: 2,
        },

        {
          label: 'Sinto bastante falta de ar',

          value: 'Sinto bastante falta de ar',

          valueNumber: 3,
        },

        {
          label: 'Sinto muita falta de ar',

          value: 'Sinto muita falta de ar',

          valueNumber: 4,
        },

        {
          label: 'Sinto uma falta de ar insuportável',

          value: 'Sinto uma falta de ar insuportável',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Limitação em Atividades Domésticas',

      options: [
        {
          label: 'Não tenho limitações',

          value: 'Não tenho limitações',

          valueNumber: 0,
        },

        {
          label: 'Tenho uma leve limitação',

          value: 'Tenho uma leve limitação',

          valueNumber: 1,
        },

        {
          label: 'Tenho alguma limitação',

          value: 'Tenho alguma limitação',

          valueNumber: 2,
        },

        {
          label: 'Tenho bastante limitação',

          value: 'Tenho bastante limitação',

          valueNumber: 3,
        },

        {
          label: 'Tenho muita limitação',

          value: 'Tenho muita limitação',

          valueNumber: 4,
        },

        {
          label: 'Não consigo fazer nenhuma atividade',

          value: 'Não consigo fazer nenhuma atividade',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Confiança para Sair de Casa',

      options: [
        {
          label: 'Sinto-me muito confiante',

          value: 'Sinto-me muito confiante',

          valueNumber: 0,
        },

        {
          label: 'Sinto-me confiante',

          value: 'Sinto-me confiante',

          valueNumber: 1,
        },

        {
          label: 'Sinto-me um pouco confiante',

          value: 'Sinto-me um pouco confiante',

          valueNumber: 2,
        },

        {
          label: 'Sinto-me pouco confiante',

          value: 'Sinto-me pouco confiante',

          valueNumber: 3,
        },

        {
          label: 'Não sinto nenhuma confiança',

          value: 'Não sinto nenhuma confiança',

          valueNumber: 4,
        },

        {
          label: 'Nunca saio de casa por causa da minha DPOC',

          value: 'Nunca saio de casa por causa da minha DPOC',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Sono',

      options: [
        {
          label: 'Durmo muito bem',

          value: 'Durmo muito bem',

          valueNumber: 0,
        },

        { label: 'Durmo bem', value: 'Durmo bem', valueNumber: 1 },

        {
          label: 'Durmo razoavelmente',

          value: 'Durmo razoavelmente',

          valueNumber: 2,
        },

        { label: 'Durmo mal', value: 'Durmo mal', valueNumber: 3 },

        { label: 'Durmo muito mal', value: 'Durmo muito mal', valueNumber: 4 },

        {
          label: 'Não consigo dormir por causa da minha DPOC',

          value: 'Não consigo dormir por causa da minha DPOC',

          valueNumber: 5,
        },
      ],
    },

    {
      question: 'Energia',

      options: [
        {
          label: 'Tenho muita energia',

          value: 'Tenho muita energia',

          valueNumber: 0,
        },

        {
          label: 'Tenho bastante energia',

          value: 'Tenho bastante energia',

          valueNumber: 1,
        },

        {
          label: 'Tenho alguma energia',

          value: 'Tenho alguma energia',

          valueNumber: 2,
        },

        {
          label: 'Tenho pouca energia',

          value: 'Tenho pouca energia',

          valueNumber: 3,
        },

        {
          label: 'Não tenho nenhuma energia',

          value: 'Não tenho nenhuma energia',

          valueNumber: 4,
        },

        {
          label: 'Sinto-me completamente sem energia',

          value: 'Sinto-me completamente sem energia',

          valueNumber: 5,
        },
      ],
    },
  ],
}

export const AUDIT_C: Questionnaire = {
  text: 'Responda às seguintes perguntas sobre seu consumo de álcool no último ano.',

  questions: [
    {
      question: 'Com que frequência você toma alguma bebida alcoólica?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        {
          label: 'Mensalmente ou menos',

          value: 'Mensalmente ou menos',

          valueNumber: 1,
        },

        {
          label: '2 a 4 vezes por mês',

          value: '2 a 4 vezes por mês',

          valueNumber: 2,
        },

        {
          label: '2 a 3 vezes por semana',

          value: '2 a 3 vezes por semana',

          valueNumber: 3,
        },

        {
          label: '4 ou mais vezes por semana',

          value: '4 ou mais vezes por semana',

          valueNumber: 4,
        },
      ],
    },

    {
      question:
        'Quantas doses de bebida você consome em um dia típico de consumo? (Uma dose = 1 lata de cerveja, 1 taça de vinho ou 1 dose de destilado) ',

      options: [
        { label: '1 ou 2', value: '1 ou 2', valueNumber: 0 },

        { label: '3 ou 4', value: '3 ou 4', valueNumber: 1 },

        { label: '5 ou 6', value: '5 ou 6', valueNumber: 2 },

        { label: '7 a 9', value: '7 a 9', valueNumber: 3 },

        { label: '10 ou mais', value: '10 ou mais', valueNumber: 4 },
      ],
    },

    {
      question:
        'Com que frequência você consome 6 ou mais doses em uma única ocasião?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        {
          label: 'Menos de uma vez por mês',

          value: 'Menos de uma vez por mês',

          valueNumber: 1,
        },

        { label: 'Mensalmente', value: 'Mensalmente', valueNumber: 2 },

        { label: 'Semanalmente', value: 'Semanalmente', valueNumber: 3 },

        {
          label: 'Diariamente ou quase diariamente',

          value: 'Diariamente ou quase diariamente',

          valueNumber: 4,
        },
      ],
    },
  ],
}

export const FAGERSTROM_NICOTINE_DEPENDENCE: Questionnaire = {
  text: '',

  questions: [
    {
      question: 'Quanto tempo após acordar você fuma seu primeiro cigarro?',

      options: [
        { label: 'Após 60 minutos', value: 'Após 60 minutos', valueNumber: 0 },

        {
          label: 'Entre 31 e 60 minutos',

          value: 'Entre 31 e 60 minutos',

          valueNumber: 1,
        },

        {
          label: 'Entre 6 e 30 minutos',

          value: 'Entre 6 e 30 minutos',

          valueNumber: 2,
        },

        {
          label: 'Nos primeiros 5 minutos',

          value: 'Nos primeiros 5 minutos',

          valueNumber: 3,
        },
      ],
    },

    {
      question:
        'Você acha difícil não fumar em locais proibidos (ex: igrejas, cinemas)?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },

        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },

    {
      question: 'Qual cigarro do dia te traria mais desprazer em abandonar?',

      options: [
        {
          label: 'O primeiro da manhã',

          value: 'O primeiro da manhã',

          valueNumber: 1,
        },

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
      question:
        'Você fuma mais frequentemente nas primeiras horas após acordar do que no resto do dia?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },

        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },

    {
      question:
        'Você fuma mesmo que esteja doente a ponto de ficar acamado a maior parte do dia?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 1 },

        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },
  ],
}

export const FINDRISC: Questionnaire = {
  text: '',

  questions: [
    {
      question: 'Idade',

      options: [
        {
          label: 'Menos de 45 anos',

          value: 'Menos de 45 anos',

          valueNumber: 0,
        },

        { label: '45-54 anos', value: '45-54 anos', valueNumber: 2 },

        { label: '55-64 anos', value: '55-64 anos', valueNumber: 3 },

        { label: 'Mais de 64 anos', value: 'Mais de 64 anos', valueNumber: 4 },
      ],
    },

    {
      question: 'Índice de Massa Corporal (IMC)',

      options: [
        {
          label: 'Abaixo de 25 kg/m²',

          value: 'Abaixo de 25 kg/m²',

          valueNumber: 0,
        },

        {
          label: 'Entre 25 e 30 kg/m²',

          value: 'Entre 25 e 30 kg/m²',

          valueNumber: 1,
        },

        {
          label: 'Acima de 30 kg/m²',

          value: 'Acima de 30 kg/m²',

          valueNumber: 3,
        },
      ],
    },

    {
      question: 'Circunferência da Cintura',

      options: [
        {
          label: 'Homens: < 94 cm; Mulheres: < 80 cm',

          value: 'Homens: < 94 cm; Mulheres: < 80 cm',

          valueNumber: 0,
        },

        {
          label: 'Homens: 94-102 cm; Mulheres: 80-88 cm',

          value: 'Homens: 94-102 cm; Mulheres: 80-88 cm',

          valueNumber: 3,
        },

        {
          label: 'Homens: > 102 cm; Mulheres: > 88 cm',

          value: 'Homens: > 102 cm; Mulheres: > 88 cm',

          valueNumber: 4,
        },
      ],
    },

    {
      question:
        'Você pratica pelo menos 30 minutos de atividade física todos os dias?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },

        { label: 'Não', value: 'Não', valueNumber: 2 },
      ],
    },

    {
      question: 'Com que frequência você come vegetais, frutas ou legumes?',

      options: [
        { label: 'Todos os dias', value: 'Todos os dias', valueNumber: 0 },

        {
          label: 'Nem todos os dias',

          value: 'Nem todos os dias',

          valueNumber: 1,
        },
      ],
    },

    {
      question: 'Você já tomou medicação para pressão alta regularmente?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 2 },

        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },

    {
      question:
        'Já foi encontrado um nível de glicose (açúcar) alto em algum exame?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 5 },

        { label: 'Não', value: 'Não', valueNumber: 0 },
      ],
    },

    {
      question:
        'Algum membro da sua família já foi diagnosticado com diabetes?',

      options: [
        { label: 'Não', value: 'Não', valueNumber: 0 },

        {
          label: 'Sim: avós, tios ou primos',

          value: 'Sim: avós, tios ou primos',

          valueNumber: 3,
        },

        {
          label: 'Sim: pais, irmãos ou filhos',

          value: 'Sim: pais, irmãos ou filhos',

          valueNumber: 5,
        },
      ],
    },
  ],
}

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
      question:
        'As pessoas às vezes esquecem de tomar os seus medicamentos por outras razões que não o esquecimento. Nos últimos 15 dias, quantas vezes você deixou de tomar os seus medicamentos?',
    },

    {
      question:
        'Você alguma vez já reduziu ou deixou de tomar o seu medicamento sem avisar o seu médico porque se sentiu pior quando o tomou?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },

        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },

    {
      question:
        'Quando você viaja ou sai de casa, você às vezes se esquece de levar o seu medicamento?',

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
      question:
        'Quando você sente que os seus sintomas estão sob controle, você às vezes deixa de tomar o seu medicamento?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },

        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },

    {
      question:
        'Tomar medicamentos todos os dias é um incômodo para algumas pessoas. Você se sente incomodado por ter que seguir um plano de tratamento?',

      options: [
        { label: 'Sim', value: 'Sim', valueNumber: 0 },

        { label: 'Não', value: 'Não', valueNumber: 1 },
      ],
    },

    {
      question:
        'Com que frequência você tem dificuldade em lembrar-se de tomar todos os seus medicamentos?',

      options: [
        {
          label: 'Sempre/Frequentemente',

          value: 'Sempre/Frequentemente',

          valueNumber: 0,
        },

        { label: 'Às vezes', value: 'Às vezes', valueNumber: 0.25 },

        { label: 'Raramente', value: 'Raramente', valueNumber: 0.5 },

        { label: 'Nunca', value: 'Nunca', valueNumber: 1 },
      ],
    },
  ],
}

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
      question:
        'Duração (Timeline): Por quanto tempo você acha que sua doença irá durar?',

      options: [
        {
          label: 'Um tempo muito curto',

          value: 'Um tempo muito curto',

          valueNumber: 0,
        },

        { label: 'Para sempre', value: 'Para sempre', valueNumber: 10 },
      ],
    },

    {
      question:
        'Controle Pessoal: O quanto de controle você sente que tem sobre sua doença?',

      options: [
        { label: 'Nenhum controle', value: 'Nenhum controle', valueNumber: 0 },

        { label: 'Controle total', value: 'Controle total', valueNumber: 10 },
      ],
    },

    {
      question:
        'Controle do Tratamento: O quanto você acha que seu tratamento pode ajudar sua doença?',

      options: [
        { label: 'Nada útil', value: 'Nada útil', valueNumber: 0 },

        {
          label: 'Extremamente útil',

          value: 'Extremamente útil',

          valueNumber: 10,
        },
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

        {
          label: 'Muito preocupado',

          value: 'Muito preocupado',

          valueNumber: 10,
        },
      ],
    },

    {
      question: 'Compreensão: O quão bem você sente que entende sua doença?',

      options: [
        {
          label: 'Não entendo nada',

          value: 'Não entendo nada',

          valueNumber: 0,
        },

        {
          label: 'Entendo muito bem',

          value: 'Entendo muito bem',

          valueNumber: 10,
        },
      ],
    },

    {
      question:
        'Resposta Emocional: O quanto sua doença afeta você emocionalmente?',

      options: [
        { label: 'Nada afetado', value: 'Nada afetado', valueNumber: 0 },

        { label: 'Muito afetado', value: 'Muito afetado', valueNumber: 10 },
      ],
    },

    {
      question:
        'Causas: liste em ordem de importância os 3 fatores que você acredita que causaram sua doença (resposta aberta).',
    },
  ],
}

export const PSS: Questionnaire = {
  text: 'As perguntas a seguir procuram saber sobre seus sentimentos e pensamentos durante o último mês. Em cada caso, por favor, indique com que frequência você se sentiu ou pensou de certa maneira.',

  questions: [
    {
      question:
        'No último mês, com que frequência você ficou aborrecido(a) por causa de algo que aconteceu inesperadamente?',
      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },
        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },
        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },
        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você sentiu que foi incapaz de controlar as coisas importantes na sua vida?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você se sentiu nervoso(a) e estressado(a)?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você se sentiu confiante sobre sua capacidade de lidar com seus problemas pessoais?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você sentiu que as coisas estavam indo do seu jeito?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você sentiu que não conseguia dar conta de todas as coisas que tinha para fazer?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você foi capaz de controlar as irritações na sua vida?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você sentiu que estava "por cima" dos acontecimentos?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você se irritou por causa de coisas que estavam fora do seu controle?',
      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },
        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },
        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },
        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },
        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },

    {
      question:
        'No último mês, com que frequência você sentiu que as dificuldades estavam se acumulando tanto que você não conseguia superá-las?',

      options: [
        { label: 'Nunca', value: 'Nunca', valueNumber: 0 },

        { label: 'Quase Nunca', value: 'Quase Nunca', valueNumber: 1 },

        { label: 'Às Vezes', value: 'Às Vezes', valueNumber: 2 },

        { label: 'Quase Sempre', value: 'Quase Sempre', valueNumber: 3 },

        { label: 'Sempre', value: 'Sempre', valueNumber: 4 },
      ],
    },
  ],
}
