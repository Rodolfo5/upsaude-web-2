import { timestampToDate } from '@/lib/utils'
import {
  HealthCheckupEntity,
  UserProfile,
} from '@/types/entities/healthCheckup'

export interface QuestionAnswer {
  section: string
  question: string
  answer: string | string[]
  type?: 'single' | 'multiple' | 'text' | 'date'
}

export interface CheckupSection {
  title: string
  questions: QuestionAnswer[]
}

// Mapeamento das seções principais
const SECTION_TITLES = {
  profileIdentification: 'Identificação do Perfil',
  evaluationReason: 'Motivo da Avaliação',
  initialData: 'Dados Iniciais e Antropometria',
  activeProblemsList: 'Lista de Problemas Ativos',
  vaccinationStatus: 'Status Vacinal',
  familyHistory: 'Antecedentes Familiares',
  socialHistory: 'Histórico Social e Hábitos de Vida',
  generalSymptoms: 'Sintomas Gerais',
  // Triagens
  hypertensionScreening: 'Triagem de Hipertensão',
  diabetesScreening: 'Triagem de Diabetes',
  obesityScreening: 'Triagem de Obesidade',
  cholesterolScreening: 'Triagem de Colesterol',
  dpocScreening: 'Triagem de DPOC',
  osteoporosisScreening: 'Triagem de Osteoporose',
  cardiovascularScreening: 'Triagem Cardiovascular',
  cancerScreening: 'Triagem de Câncer',
  parkinsonScreening: 'Triagem de Parkinson',
  asthmaScreening: 'Triagem de Asma',
  // Módulos específicos
  pregnancyModule: 'Módulo Gestante',
  childModule: 'Módulo Criança',
  adolescentModule: 'Módulo Adolescente',
  adultModule: 'Módulo Adulto',
  elderlyModule: 'Módulo Pessoa Idosa',
}

// Mapeamento das perguntas por campo
const QUESTION_MAPPING: Record<string, Record<string, string>> = {
  profileIdentification: {
    birthDate: 'Data de nascimento',
    assignedSex: 'Sexo atribuído ao nascimento',
    genderIdentity: 'Identidade de gênero',
  },
  evaluationReason: {
    reason: 'Qual o motivo desta avaliação?',
  },
  initialData: {
    weight: 'Peso (kg)',
    height: 'Altura (m)',
    waistCircumference: 'Circunferência da cintura (cm)',
    unintentionalWeightChange:
      'Teve mudança de peso não intencional (>5kg no último ano)?',
    lastBloodPressureDate: 'Quando foi sua última medição de pressão arterial?',
    lastBloodGlucoseDate: 'Quando foi sua última medição de glicemia?',
    bloodPressureValues: 'Quais foram os valores da sua pressão arterial?',
    bloodGlucoseValues: 'Quais foram os valores da sua glicemia?',
    cholesterolValues: 'Quais foram os valores do seu colesterol?',
  },
  activeProblemsList: {
    conditions: 'Condições de saúde ativas',
  },
  vaccinationStatus: {
    routineVaccinesUpToDate: 'Suas vacinas de rotina estão em dia?',
  },
  familyHistory: {
    conditions: 'Histórico familiar de condições de saúde',
  },
  socialHistory: {
    smokingStatus: 'Status de tabagismo',
    alcoholConsumption: 'Consumo de álcool',
    foodQuality: 'Com que frequência você consome alimentos in natura?',
    physicalActivity150min:
      'Você pratica pelo menos 150 minutos de atividade física por semana?',
    sleepQuality: 'Você acorda descansado?',
    currentlyWorking: 'Está trabalhando atualmente?',
    socialConnection: 'Se sente conectado a outras pessoas?',
  },
  generalSymptoms: {
    unintentionalWeightLoss: 'Perda de peso não intencional',
    extremeFatigue: 'Fadiga extrema',
    feverOrNightSweats: 'Febre ou suores noturnos',
    shortnessOfBreath: 'Falta de ar',
    chestPain: 'Dor no peito',
    persistentCough: 'Tosse persistente',
    wheezing: 'Chiado no peito',
    bowelChangePattern: 'Mudança no padrão intestinal',
    frequentHeartburn: 'Azia frequente',
    abdominalPain: 'Dor abdominal',
    frequentHeadaches: 'Dores de cabeça frequentes',
    chronicPain: 'Dor crônica',
    dizziness: 'Tontura',
    tingling: 'Formigamento',
    lackOfInterest: 'Falta de interesse em atividades',
    nervousOrAnxious: 'Nervosismo ou ansiedade',
  },
  hypertensionScreening: {
    bloodPressureValues: 'Valores da pressão arterial',
    previousDiagnosis: 'Diagnóstico anterior de hipertensão?',
    medicationUse: 'Usa medicação para pressão arterial?',
    familyHistory: 'Histórico familiar de hipertensão?',
    ultraProcessedFoodFrequency:
      'Frequência de consumo de alimentos ultraprocessados',
    alcoholDosesPerWeek: 'Doses de álcool por semana',
    isSedentary: 'É sedentário?',
  },
  diabetesScreening: {
    waistCircumferenceRange: 'Faixa de circunferência da cintura',
    physicalActivity30min:
      'Pratica atividade física por 30 minutos diariamente?',
    fruitVegetableConsumption: 'Consume frutas e vegetais diariamente?',
    bloodPressureMedication: 'Usa medicação para pressão arterial?',
    previousHighGlucose: 'Já teve glicemia elevada?',
    familyDiabetes: 'Histórico familiar de diabetes?',
  },
  obesityScreening: {
    unintentionalWeightGain:
      'Ganho de peso não intencional (>5kg no último ano)?',
    previousWeightLossAttempts: 'Tentativas anteriores de perda de peso',
    weightLossDifficulties: 'Dificuldades para perder peso',
    ultraProcessedFrequency: 'Frequência de consumo de ultraprocessados',
    emotionalEating: 'Come por motivos emocionais?',
  },
  cholesterolScreening: {
    lastCholesterolTest: 'Último exame de colesterol',
    previousDiagnosis: 'Diagnóstico anterior de colesterol alto?',
    familyHistoryEarlyCVD:
      'Histórico familiar de doença cardiovascular precoce?',
    saturatedFatDiet: 'Dieta rica em gordura saturada?',
    hasDiabetesOrHTN: 'Tem diabetes ou hipertensão?',
    smokingStatus: 'Status de tabagismo',
  },
  dpocScreening: {
    smokingMoreThan10Years: 'Fumou por mais de 10 anos?',
    cigarettesPerDay: 'Cigarros por dia',
    occupationalExposure: 'Exposição ocupacional a substâncias tóxicas?',
    chronicCough: 'Tosse crônica?',
    morningSputum: 'Expectoração matinal?',
    progressiveDyspnea: 'Falta de ar progressiva?',
    ageOver40: 'Idade acima de 40 anos?',
  },
  osteoporosisScreening: {
    menopauseStatus: 'Está na menopausa?',
    menopauseAge: 'Idade da menopausa',
    fractureAfter50: 'Fraturas após os 50 anos?',
    parentWithOsteoporosis: 'Pais com osteoporose?',
    currentSmoker: 'Fumante atual?',
    alcoholMoreThan3xWeek: 'Consome álcool mais de 3x por semana?',
    lowCalciumIntake: 'Baixa ingestão de cálcio?',
    regularSunExposure: 'Exposição solar regular?',
    corticosteroidUse: 'Uso de corticosteroides?',
  },
  cardiovascularScreening: {
    hasHTNorDMorCholesterol: 'Tem hipertensão, diabetes ou colesterol alto?',
    isSmoker: 'É fumante?',
    familyEarlyCVD: 'Histórico familiar de doença cardiovascular precoce?',
    chestPainWithExertion: 'Dor no peito com esforço?',
    disproportionateDyspnea: 'Falta de ar desproporcional?',
    tiaSymptoms: 'Sintomas de AIT (mini-derrame)?',
    claudication: 'Claudicação (dor nas pernas ao caminhar)?',
  },
  cancerScreening: {
    lastPapSmear: 'Último exame Papanicolau',
    lastMammography: 'Última mamografia',
    colonCancerScreening: 'Triagem para câncer de cólon?',
    prostateScreeningDiscussion: 'Discussão sobre triagem de próstata?',
    significantWeightLoss: 'Perda de peso significativa?',
    persistentFatigue: 'Fadiga persistente?',
    newLumpsOrSkinChanges: 'Novos caroços ou mudanças na pele?',
    unexplainedBleeding: 'Sangramento inexplicado?',
  },
  parkinsonScreening: {
    handwritingChanges: 'Mudanças na caligrafia?',
    restingTremor: 'Tremor em repouso?',
    bodyRigidity: 'Rigidez corporal?',
    gaitChanges: 'Mudanças na marcha?',
    reducedFacialExpression: 'Redução da expressão facial?',
    lossOfSmell: 'Perda do olfato?',
    remSleepBehavior: 'Comportamento anormal no sono REM?',
    chronicConstipation: 'Constipação crônica?',
  },
  asthmaScreening: {
    recurrentWheezing: 'Chiado recorrente?',
    nightCough: 'Tosse noturna?',
    chestTightness: 'Aperto no peito?',
    triggersWorsenSymptoms: 'Gatilhos pioram os sintomas?',
    symptomsAfterCold: 'Sintomas após resfriado?',
    allergicHistory: 'Histórico alérgico?',
    inhalerResponse: 'Resposta ao inalador?',
  },
  pregnancyModule: {
    isPregnant: 'Está grávida?',
    weeksOfPregnancy: 'Semanas de gestação',
    prenatalCare: 'Está fazendo pré-natal?',
    pregnancyVaccines: 'Vacinas da gestação em dia?',
    folicAcidAndIron: 'Toma ácido fólico e ferro?',
    warningSigns: 'Sinais de alerta na gestação',
    anxietyOrSadness: 'Ansiedade ou tristeza',
  },
  childModule: {
    respondedBy: 'Questionário respondido por',
    pediatricCareUpToDate: 'Acompanhamento pediátrico em dia?',
    developmentConcerns: 'Preocupações com o desenvolvimento',
    diet: 'Qualidade da alimentação',
    sugarDrinks: 'Consumo de bebidas açucaradas',
    physicalActivity: 'Prática de atividade física',
    screenTime: 'Tempo de tela',
  },
  adolescentModule: {
    respondedBy: 'Questionário respondido por',
    pediatricCareUpToDate: 'Acompanhamento médico em dia?',
    developmentConcerns: 'Preocupações com o desenvolvimento',
    diet: 'Qualidade da alimentação',
    sugarDrinks: 'Consumo de bebidas açucaradas',
    physicalActivity: 'Prática de atividade física',
    screenTime: 'Tempo de tela',
    mentalHealthScreening: 'Triagem de saúde mental',
    socialBehavior: 'Comportamento social',
    lifestyleHabits: 'Hábitos de vida',
    riskBehaviors: 'Comportamentos de risco',
  },
  elderlyModule: {
    fallRisk: 'Risco de quedas no último ano',
    needsHelpForBasicActivities: 'Precisa de ajuda para atividades básicas?',
    familyMemoryDifficulties: 'Família nota dificuldades de memória?',
    hearingOrVisionDifficulties: 'Dificuldades de audição ou visão?',
    continuousMedications: 'Usa medicações contínuas?',
    annualFluVaccine: 'Toma vacina da gripe anualmente?',
    lostInterestInActivities: 'Perdeu interesse em atividades?',
  },
  adultModule: {
    detailedFamilyHistory: 'Histórico familiar detalhado',
    freshFoodFrequency: 'Frequência de consumo de alimentos in natura',
    ultraProcessedFrequency: 'Frequência de consumo de ultraprocessados',
    vigorousDaysPerWeek: 'Dias de atividade vigorosa por semana',
    vigorousMinutesPerDay: 'Minutos de atividade vigorosa por dia',
    moderateDaysPerWeek: 'Dias de atividade moderada por semana',
    moderateMinutesPerDay: 'Minutos de atividade moderada por dia',
    walkingDaysPerWeek: 'Dias de caminhada por semana',
    walkingMinutesPerDay: 'Minutos de caminhada por dia',
    alcoholFrequency: 'Frequência de consumo de álcool',
    typicalDrinks: 'Doses típicas de álcool',
    bingeDrinking: 'Episódios de binge drinking',
    yearsSmoking: 'Anos fumando',
    cigarettesPerDay: 'Cigarros por dia',
    packYears: 'Maços-ano',
    timeToFirstCigarette: 'Tempo para o primeiro cigarro',
    difficultyNotSmoking: 'Dificuldade para não fumar',
    worstToAbandon: 'Pior cigarro para abandonar',
    quitMotivation: 'Motivação para parar de fumar',
    wakeUpRested: 'Acorda descansado?',
    sunscreenUse: 'Uso de protetor solar',
    occupationalExposure: 'Exposição ocupacional',
    panicAttacks: 'Ataques de pânico?',
    substanceProblems: 'Problemas com substâncias?',
    financialWorries: 'Preocupações financeiras',
    socialConnection: 'Conexão social',
    leisureTime: 'Tempo para lazer',
  },
}

// Mapeamento específico para módulos com estruturas aninhadas
const PHQ9_QUESTIONS = {
  littleInterest: 'Pouco interesse ou prazer em fazer as coisas',
  feelingDown: 'Se sentindo para baixo, deprimido ou sem esperança',
  fatigueOrLowEnergy: 'Fadiga ou pouca energia',
  sleepProblems: 'Problemas para dormir ou dormir demais',
  appetiteChanges: 'Mudanças no apetite',
  feelingBadAboutSelf: 'Se sentindo mal consigo mesmo',
  concentrationDifficulty: 'Dificuldade para se concentrar',
  psychomotorChanges: 'Mudanças psicomotoras',
  thoughtsOfDeath: 'Pensamentos de morte',
}

const GAD7_QUESTIONS = {
  feelingNervous: 'Se sentindo nervoso, ansioso ou no limite',
  unableToControlWorries: 'Incapaz de controlar preocupações',
  worryingTooMuch: 'Preocupando-se demais',
  troubleRelaxing: 'Dificuldade para relaxar',
  restlessness: 'Inquietação',
  easilyAnnoyed: 'Facilmente irritado',
  feelingAfraid: 'Sentindo medo',
}

const PHQ9_GAD7_SCALE = [
  'Nunca',
  'Alguns dias',
  'Mais da metade dos dias',
  'Quase todos os dias',
]

// Função para formatar data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDate(date: any): string {
  const convertedDate = timestampToDate(date)
  if (!convertedDate) return 'Data inválida'
  return convertedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatArray(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return 'Nenhum'
  return arr.join(', ')
}

export function mapCheckupToQuestions(
  checkup: HealthCheckupEntity,
): CheckupSection[] {
  const sections: CheckupSection[] = []

  // Função auxiliar para processar cada seção
  function processSection(
    sectionKey: keyof HealthCheckupEntity,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sectionData: any,
  ) {
    if (!sectionData) return

    const sectionTitle =
      SECTION_TITLES[sectionKey as keyof typeof SECTION_TITLES]
    if (!sectionTitle) return

    const questions: QuestionAnswer[] = []
    const questionMap = QUESTION_MAPPING[sectionKey as string]

    if (!questionMap) return

    // Processar campos normais
    Object.entries(sectionData).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      const question = questionMap[key]
      if (!question) return

      let formattedAnswer: string | string[]

      if (Array.isArray(value)) {
        formattedAnswer = formatArray(value)
      } else if (key === 'birthDate') {
        formattedAnswer = formatDate(value)
      } else {
        formattedAnswer = String(value)
      }

      questions.push({
        section: sectionTitle,
        question,
        answer: formattedAnswer,
        type: Array.isArray(value) ? 'multiple' : 'single',
      })
    })

    if (questions.length > 0) {
      sections.push({
        title: sectionTitle,
        questions,
      })
    }
  }

  // Processar seções principais
  const mainSections = [
    'profileIdentification',
    'evaluationReason',
    'initialData',
    'activeProblemsList',
    'vaccinationStatus',
    'familyHistory',
    'socialHistory',
    'generalSymptoms',
  ] as const

  mainSections.forEach((section) => {
    processSection(section, checkup[section])
  })

  // Processar triagens
  const screeningSections = [
    'hypertensionScreening',
    'diabetesScreening',
    'obesityScreening',
    'cholesterolScreening',
    'dpocScreening',
    'osteoporosisScreening',
    'cardiovascularScreening',
    'cancerScreening',
    'parkinsonScreening',
    'asthmaScreening',
  ] as const

  screeningSections.forEach((section) => {
    processSection(section, checkup[section])
  })

  // Processar módulos específicos
  const modulesSections = [
    'pregnancyModule',
    'childModule',
    'adolescentModule',
    'elderlyModule',
  ] as const

  modulesSections.forEach((section) => {
    processSection(section, checkup[section])
  })

  // Processar módulo adulto com estruturas especiais
  if (checkup.adultModule) {
    const adultQuestions: QuestionAnswer[] = []
    const adultData = checkup.adultModule

    // Processar campos normais do módulo adulto
    Object.entries(adultData).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (
        [
          'phq9',
          'gad7',
          'womenHealth',
          'menHealth',
          'hypertensionManagement',
          'diabetesManagement',
          'occupationalHealth',
        ].includes(key)
      )
        return

      const question = QUESTION_MAPPING.adultModule[key]
      if (!question) return

      let formattedAnswer: string | string[]
      if (Array.isArray(value)) {
        formattedAnswer = formatArray(value)
      } else {
        formattedAnswer = String(value)
      }

      adultQuestions.push({
        section: 'Módulo Adulto',
        question,
        answer: formattedAnswer,
        type: Array.isArray(value) ? 'multiple' : 'single',
      })
    })

    // Processar PHQ-9
    if (adultData.phq9) {
      Object.entries(adultData.phq9).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        const question = PHQ9_QUESTIONS[key as keyof typeof PHQ9_QUESTIONS]
        if (!question) return

        adultQuestions.push({
          section: 'Módulo Adulto - PHQ-9 (Depressão)',
          question,
          answer: PHQ9_GAD7_SCALE[value as number] || String(value),
          type: 'single',
        })
      })
    }

    // Processar GAD-7
    if (adultData.gad7) {
      Object.entries(adultData.gad7).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        const question = GAD7_QUESTIONS[key as keyof typeof GAD7_QUESTIONS]
        if (!question) return

        adultQuestions.push({
          section: 'Módulo Adulto - GAD-7 (Ansiedade)',
          question,
          answer: PHQ9_GAD7_SCALE[value as number] || String(value),
          type: 'single',
        })
      })
    }

    if (adultQuestions.length > 0) {
      // Agrupar por seção
      const groupedQuestions = adultQuestions.reduce(
        (acc, question) => {
          if (!acc[question.section]) {
            acc[question.section] = []
          }
          acc[question.section].push(question)
          return acc
        },
        {} as Record<string, QuestionAnswer[]>,
      )

      Object.entries(groupedQuestions).forEach(([sectionTitle, questions]) => {
        sections.push({
          title: sectionTitle,
          questions,
        })
      })
    }
  }

  return sections
}

export function getProfileTitle(profile: UserProfile): string {
  switch (profile) {
    case UserProfile.CHILD:
      return 'Criança (< 12 anos)'
    case UserProfile.ADOLESCENT:
      return 'Adolescente (12-17 anos)'
    case UserProfile.ADULT:
      return 'Adulto (18-59 anos)'
    case UserProfile.PREGNANT:
      return 'Gestante'
    case UserProfile.ELDERLY:
      return 'Pessoa Idosa (60+ anos)'
    default:
      return 'Perfil não definido'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Em andamento'
    case 'COMPLETED':
      return 'Concluído'
    case 'ABANDONED':
      return 'Abandonado'
    default:
      return status
  }
}
