import { RiskClassification } from '@/utils/healthScore/types'

export enum UserProfile {
  CHILD = 'CHILD', // < 12 anos
  ADOLESCENT = 'ADOLESCENT', // 12-17 anos
  ADULT = 'ADULT', // 18-59 anos, não gestante
  PREGNANT = 'PREGNANT', // Feminino + 12-55 anos + gestante
  ELDERLY = 'ELDERLY', // 60+ anos
}

export enum CheckupStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  REQUESTED = 'REQUESTED',
}

// Identificação de perfil (primeira tela)
export interface ProfileIdentification {
  birthDate: Date | string
  assignedSex: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar'
  genderIdentity:
    | 'Mulher cis'
    | 'Homem cis'
    | 'Mulher trans'
    | 'Homem trans'
    | 'Não-binário'
    | 'Prefiro não responder'
}

// Motivo da avaliação
export interface EvaluationReason {
  reason:
    | 'Check-up preventivo de rotina'
    | 'Investigar um sintoma específico'
    | 'Acompanhar uma condição de saúde já conhecida'
    | 'Outro'
}

// Dados iniciais e antropometria
export interface InitialData {
  weight?: string // kg
  height?: string // m ou cm
  waistCircumference?: string // cm
  unintentionalWeightChange?: 'Sim' | 'Não' // >5kg no último ano
  lastBloodPressureDate?:
    | 'Nos últimos 7 dias'
    | 'Nos últimos 30 dias'
    | 'Nos últimos meses'
    | 'Não lembro'
  lastBloodGlucoseDate?:
    | 'Nos últimos 7 dias'
    | 'Nos últimos 30 dias'
    | 'Nos últimos meses'
    | 'Não lembro'
  bloodPressureValues?:
    | 'Normal (abaixo de 120/80 mmHg)'
    | 'Normal-alta (entre 120/80 e 139/89 mmHg)'
    | 'Alta (acima de 140/90 mmHg)'
    | 'Não sei'
  bloodGlucoseValues?:
    | 'Normal'
    | 'Pré-diabetes/Alta'
    | 'Diabetes/Alta'
    | 'Não sei'
  cholesterolValues?: 'Normal' | 'Limítrofe/Alto' | 'Alto' | 'Não sei'
}

// Lista de problemas ativos
export interface ActiveProblemsList {
  conditions: string[] // Array de condições como: 'Hipertensão', 'Colesterol alto', 'Obesidade', etc.
}

// Status vacinal
export interface VaccinationStatus {
  routineVaccinesUpToDate: 'Sim' | 'Não' | 'Não tenho certeza'
}

// Antecedentes familiares
export interface FamilyHistory {
  conditions: string[] // Array de condições familiares
}

// Histórico social e hábitos de vida
export interface SocialHistory {
  smokingStatus: 'Nunca fumei' | 'Ex-fumante' | 'Fumante atual'
  alcoholConsumption:
    | 'Nunca'
    | 'Mensalmente ou menos'
    | 'Semanalmente'
    | 'Diariamente'
  foodQuality?:
    | 'Em quase todas as refeições'
    | 'Na maioria das refeições'
    | 'Em poucas refeições'
    | 'Quase nunca'
  physicalActivity150min?: 'Sim' | 'Não' // 150min/semana de atividade moderada
  sleepQuality?: 'Sim, quase sempre' | 'Às vezes' | 'Raramente ou nunca'
  currentlyWorking: 'Sim' | 'Não'
  socialConnection: 'Sim' | 'Não' // Se sente conectado a outras pessoas
}

// Inventário de sintomas gerais (revisão de sistemas)
export interface GeneralSymptoms {
  // Gerais
  unintentionalWeightLoss?: 'Sim' | 'Não'
  extremeFatigue?: 'Sim' | 'Não'
  feverOrNightSweats?: 'Sim' | 'Não'
  // Cardiorrespiratório
  shortnessOfBreath?: 'Sim' | 'Não'
  chestPain?: 'Sim' | 'Não'
  persistentCough?: 'Sim' | 'Não'
  wheezing?: 'Sim' | 'Não'
  // Gastrointestinal
  bowelChangePattern?: 'Sim' | 'Não'
  frequentHeartburn?: 'Sim' | 'Não'
  abdominalPain?: 'Sim' | 'Não'
  // Neurológico/Muscular
  frequentHeadaches?: 'Sim' | 'Não'
  chronicPain?: 'Sim' | 'Não'
  dizziness?: 'Sim' | 'Não'
  tingling?: 'Sim' | 'Não'
  // Saúde Mental
  lackOfInterest?: 'Sim' | 'Não'
  nervousOrAnxious?: 'Sim' | 'Não'
}

// ===== MÓDULOS DE TRIAGEM (SCREENING) =====

// Triagem de Hipertensão
export interface HypertensionScreening {
  bloodPressureValues?:
    | 'Normal (abaixo de 120/80 mmHg)'
    | 'Normal-alta (entre 120/80 e 139/89 mmHg)'
    | 'Alta (acima de 140/90 mmHg)'
    | 'Não sei'
  previousDiagnosis?: 'Sim' | 'Não'
  medicationUse?: 'Sim, regularmente' | 'Sim, mas esqueço às vezes' | 'Não'
  familyHistory?: 'Sim' | 'Não' | 'Não sei'
  ultraProcessedFoodFrequency?:
    | 'Raramente ou nunca'
    | 'Algumas vezes por semana'
    | 'Quase todos os dias'
  alcoholDosesPerWeek?: string // Numérico
  isSedentary?: 'Sim' | 'Não'
}

// Triagem de Diabetes (FINDRISC)
export interface DiabetesScreening {
  waistCircumferenceRange?:
    | 'Homem: < 94 cm'
    | 'Homem: 94-102 cm'
    | 'Homem: > 102 cm'
    | 'Mulher: < 80 cm'
    | 'Mulher: 80-88 cm'
    | 'Mulher: > 88 cm'
  physicalActivity30min?: 'Sim' | 'Não'
  fruitVegetableConsumption?: 'Todos os dias' | 'Nem todos os dias'
  bloodPressureMedication?: 'Sim' | 'Não'
  previousHighGlucose?: 'Sim' | 'Não' | 'Não sei'
  familyDiabetes?: 'Sim, pais ou irmãos' | 'Sim, avós ou tios' | 'Não'
}

// Triagem de Obesidade
export interface ObesityScreening {
  unintentionalWeightGain?: 'Sim' | 'Não' // >5kg último ano
  previousWeightLossAttempts?: string // Texto ou opções
  weightLossDifficulties?: string[]
  ultraProcessedFrequency?:
    | 'Raramente'
    | '1-2 vezes/semana'
    | '3-4 vezes/semana'
    | 'Diariamente'
  emotionalEating?: 'Frequentemente' | 'Às vezes' | 'Raramente'
}

// Triagem de Colesterol
export interface CholesterolScreening {
  lastCholesterolTest?: 'No último ano' | 'Há mais de 2 anos' | 'Nunca fiz'
  previousDiagnosis?: 'Sim' | 'Não'
  familyHistoryEarlyCVD?: 'Sim' | 'Não' | 'Não sei'
  saturatedFatDiet?: 'Sim, na maioria dos dias' | 'Às vezes' | 'Raramente'
  hasDiabetesOrHTN?: 'Sim' | 'Não'
  smokingStatus?: 'Sim, atualmente' | 'Ex-fumante' | 'Nunca fumei'
}

// Triagem de DPOC
export interface DPOCScreening {
  smokingMoreThan10Years?: 'Sim' | 'Não'
  cigarettesPerDay?: string // Numérico
  occupationalExposure?: 'Sim' | 'Não'
  chronicCough?: 'Sim' | 'Não'
  morningSputum?: 'Sim' | 'Não'
  progressiveDyspnea?:
    | 'Sim, a falta de ar tem piorado com o tempo'
    | 'Sim, mas está estável'
    | 'Não'
  ageOver40?: 'Sim' | 'Não'
}

// Triagem de Osteoporose
export interface OsteoporosisScreening {
  menopauseStatus?: 'Sim' | 'Não'
  menopauseAge?: string // Numérico
  fractureAfter50?: 'Sim' | 'Não'
  parentWithOsteoporosis?: 'Sim' | 'Não' | 'Não sei'
  currentSmoker?: 'Sim' | 'Não'
  alcoholMoreThan3xWeek?: 'Sim' | 'Não'
  lowCalciumIntake?: 'Sim' | 'Não'
  regularSunExposure?: 'Sim' | 'Não'
  corticosteroidUse?: 'Sim' | 'Não'
}

// Triagem Cardiovascular
export interface CardiovascularScreening {
  hasHTNorDMorCholesterol?: string[] // Multiple selection
  isSmoker?: 'Sim' | 'Não'
  familyEarlyCVD?: 'Sim' | 'Não'
  chestPainWithExertion?: 'Sim' | 'Não'
  disproportionateDyspnea?: 'Sim' | 'Não'
  tiaSymptoms?: 'Sim' | 'Não'
  claudication?: 'Sim' | 'Não'
}

// Triagem de Câncer
export interface CancerScreening {
  lastPapSmear?: string // Mês/ano
  lastMammography?: string // Mês/ano
  colonCancerScreening?: 'Sim' | 'Não'
  prostateScreeningDiscussion?: 'Sim' | 'Não'
  significantWeightLoss?: 'Sim' | 'Não'
  persistentFatigue?: 'Sim' | 'Não'
  newLumpsOrSkinChanges?: 'Sim' | 'Não'
  unexplainedBleeding?: 'Sim' | 'Não'
}

// Triagem de Parkinson
export interface ParkinsonScreening {
  handwritingChanges?: 'Sim' | 'Não'
  restingTremor?: 'Sim' | 'Não'
  bodyRigidity?: 'Sim' | 'Não'
  gaitChanges?: 'Sim' | 'Não'
  reducedFacialExpression?: 'Sim' | 'Não'
  lossOfSmell?: 'Sim' | 'Não'
  remSleepBehavior?: 'Sim' | 'Não'
  chronicConstipation?: 'Sim' | 'Não'
}

// Triagem de Asma
export interface AsthmaScreening {
  recurrentWheezing?: 'Sim' | 'Não'
  nightCough?: 'Sim' | 'Não'
  chestTightness?: 'Sim' | 'Não'
  triggersWorsenSymptoms?: 'Sim' | 'Não'
  symptomsAfterCold?: 'Sim' | 'Não'
  allergicHistory?: 'Sim' | 'Não'
  inhalerResponse?: 'Sim' | 'Não'
}

// ===== MÓDULOS ESPECÍFICOS =====

// Módulo Gestante (Feminino + 12-55 anos + gestante)
export interface PregnancyModule {
  isPregnant: 'Sim' | 'Não' | 'Não tenho certeza'
  weeksOfPregnancy?: string
  prenatalCare?:
    | 'Sim'
    | 'Iniciei no 1º trimestre e sigo regularmente'
    | 'Sim, mas iniciei tardiamente'
    | 'Ainda não iniciei'
  pregnancyVaccines?: 'Sim' | 'Não' | 'Não sei'
  folicAcidAndIron?: 'Sim' | 'Não'
  warningSigns?: string[] // Array de sinais como: 'Sangramento vaginal', 'Perda de líquido', etc.
  anxietyOrSadness?: 'Raramente ou nunca' | 'Às vezes' | 'Frequentemente'
}

// Módulo Criança (< 12 anos)
export interface ChildModule {
  respondedBy?: 'Pelo próprio adolescente (12+)' | 'Pelo responsável'
  pediatricCareUpToDate: 'Sim' | 'Regular' | 'Às vezes' | 'Não'
  developmentConcerns?: string // Campo de texto livre
  diet:
    | 'Variada, baseada em alimentos in natura'
    | 'Come bem, mas com alguns ultraprocessados'
    | 'Seletiva, com pouca variedade'
    | 'Predominantemente baseada em ultraprocessados'
  sugarDrinks: 'Raramente' | '1-2x/semana' | 'Quase todos os dias'
  physicalActivity: 'Sim, mais de 3x/semana' | 'Sim, 1-2x/semana' | 'Não'
  screenTime: 'Menos de 1 hora' | 'Entre 1-2 horas' | 'Mais de 2 horas'
}

// Módulo Adolescente (12-17 anos)
export interface AdolescentModule {
  respondedBy: 'Pelo próprio adolescente (12+)' | 'Pelo responsável'
  pediatricCareUpToDate: 'Sim' | 'Regular' | 'Às vezes' | 'Não'
  developmentConcerns?: string
  // Inclui lifestyle similar ao módulo Child
  diet?: string
  sugarDrinks?: string
  physicalActivity?: string
  screenTime?: string
  // Saúde mental e contexto social
  mentalHealthScreening?: string
  socialBehavior?: string
  lifestyleHabits?: string
  riskBehaviors?: string
}

// Módulo Adulto (18-59 anos, não gestante, < 60)
export interface AdultModule {
  // Histórico familiar detalhado
  detailedFamilyHistory?: string[]

  // Estilo de vida - Alimentação
  freshFoodFrequency?:
    | 'Em quase todas as refeições'
    | 'Na maioria das refeições'
    | 'Em poucas refeições'
    | 'Quase nunca'
  ultraProcessedFrequency?:
    | 'Raramente ou nunca'
    | '1-2 vezes por semana'
    | '3-4 vezes por semana'
    | 'Diariamente'

  // IPAQ - Atividade Física
  vigorousDaysPerWeek?: number // 0-7
  vigorousMinutesPerDay?: string
  moderateDaysPerWeek?: number // 0-7
  moderateMinutesPerDay?: string
  walkingDaysPerWeek?: number // 0-7
  walkingMinutesPerDay?: string

  // AUDIT-C - Álcool
  alcoholFrequency?:
    | 'Nunca'
    | 'Mensalmente ou menos'
    | '2 a 4 vezes por mês'
    | '2 a 3 vezes por semana'
    | '4 ou mais vezes por semana'
  typicalDrinks?: '1 ou 2' | '3 ou 4' | '5 ou 6' | '7 a 9' | '10 ou mais'
  bingeDrinking?:
    | 'Nunca'
    | 'Menos de uma vez por mês'
    | 'Mensalmente'
    | 'Semanalmente'
    | 'Diariamente ou quase diariamente'

  // Tabagismo detalhado
  yearsSmoking?: string
  cigarettesPerDay?: string
  packYears?: number // Calculado automaticamente
  // Fagerström (apenas para fumantes atuais)
  timeToFirstCigarette?:
    | 'Nos primeiros 5 min'
    | 'Entre 6-30 min'
    | 'Entre 31-60 min'
    | 'Após 60 min'
  difficultyNotSmoking?: 'Sim' | 'Não'
  worstToAbandon?: 'O primeiro da manhã' | 'Qualquer outro'
  // Motivação para cessação
  quitMotivation?:
    | 'Sim, nos próximos 30 dias'
    | 'Sim, nos próximos 6 meses'
    | 'Sim, mas não este ano'
    | 'Não estou pensando nisso'

  // Sono
  wakeUpRested?: 'Sim, quase sempre' | 'Às vezes' | 'Raramente ou nunca'

  // Exposição solar e ambiental
  sunscreenUse?: 'Sempre ou quase sempre' | 'Às vezes' | 'Raramente ou nunca'
  occupationalExposure?: 'Sim, atualmente' | 'Sim, no passado' | 'Não'

  // Saúde da Mulher (condicional)
  womenHealth?: {
    lastPapSmear?: string // Mês/ano
    lastMammography?: string // Mês/ano
    hasPCOSorEndometriosis?: 'Sim' | 'Não'
  }

  // Saúde do Homem (condicional)
  menHealth?: {
    prostateScreeningDiscussion?: 'Sim' | 'Não'
    erectileDysfunction?: 'Sim' | 'Não'
  }

  // Gerenciamento de doenças (se HTN ou DM diagnosticado)
  hypertensionManagement?: {
    medicationAdherence?: 'Sim' | 'Não'
    recentBPValue?: string
    previousEvents?: 'Sim' | 'Não' // MI/AVC/rim
  }
  diabetesManagement?: {
    lastHbA1c?: string
    insulinUse?: 'Sim' | 'Não'
    complications?: string[] // rim/olhos/pés/coração
  }

  // Saúde Mental - PHQ-9
  phq9?: {
    littleInterest?: 0 | 1 | 2 | 3
    feelingDown?: 0 | 1 | 2 | 3
    fatigueOrLowEnergy?: 0 | 1 | 2 | 3
    sleepProblems?: 0 | 1 | 2 | 3
    appetiteChanges?: 0 | 1 | 2 | 3
    feelingBadAboutSelf?: 0 | 1 | 2 | 3
    concentrationDifficulty?: 0 | 1 | 2 | 3
    psychomotorChanges?: 0 | 1 | 2 | 3
    thoughtsOfDeath?: 0 | 1 | 2 | 3
  }

  // Saúde Mental - GAD-7
  gad7?: {
    feelingNervous?: 0 | 1 | 2 | 3
    unableToControlWorries?: 0 | 1 | 2 | 3
    worryingTooMuch?: 0 | 1 | 2 | 3
    troubleRelaxing?: 0 | 1 | 2 | 3
    restlessness?: 0 | 1 | 2 | 3
    easilyAnnoyed?: 0 | 1 | 2 | 3
    feelingAfraid?: 0 | 1 | 2 | 3
  }

  // Outros aspectos de saúde mental
  panicAttacks?: 'Sim' | 'Não'
  substanceProblems?: 'Sim' | 'Não' | 'Prefiro não responder'
  financialWorries?: 'Frequentemente' | 'Às vezes' | 'Raramente ou nunca'
  socialConnection?:
    | 'Sim, sinto que tenho uma forte rede de apoio'
    | 'Sinto-me pouco conectado(a) ou isolado(a)'
  leisureTime?: 'Sim, regularmente' | 'Às vezes' | 'Raramente ou nunca'

  // Saúde Ocupacional (se trabalhando)
  occupationalHealth?: {
    profession?: string
    weeklyHours?:
      | 'Até 20 horas'
      | 'Entre 20 e 40 horas'
      | 'Entre 41 e 50 horas'
      | 'Mais de 50 horas'
    ergonomicRisks?: string[] // Checklist
    chemicalBiologicalRisks?: string[] // Checklist
    safetyMeasures?: string[] // Checklist
    harassment?: 'Sim' | 'Não' | 'Prefiro não responder'
    burnoutFrequency?:
      | 'Raramente ou nunca'
      | 'Às vezes'
      | 'Frequentemente'
      | 'Quase todos os dias'
  }
}

// Módulo Pessoa Idosa (60+ anos)
export interface ElderlyModule {
  fallRisk: 'Nenhuma' | 'Sim, uma vez' | 'Sim, duas ou mais vezes'
  needsHelpForBasicActivities:
    | 'Não, sou totalmente independente'
    | 'Sim, preciso de alguma ajuda'
  familyMemoryDifficulties:
    | 'Não'
    | 'Sim, leve'
    | 'Sim, significativa'
    | 'Sim, bastante'
  hearingOrVisionDifficulties: 'Não' | 'Sim, um pouco' | 'Sim, bastante'
  continuousMedications: 'Sim' | 'Não'
  annualFluVaccine: 'Sim' | 'Não' | 'Não sei informar'
  lostInterestInActivities: 'Sim' | 'Não'
}

// Entidade principal do Health Checkup
export interface HealthCheckupEntity {
  id: string
  userId: string
  status: CheckupStatus
  userProfile?: UserProfile
  createdAt: Date | string
  updatedAt: Date | string
  completedAt?: Date | string
  doctorId?: string

  // Rota padrão (para todos)
  profileIdentification?: ProfileIdentification
  evaluationReason?: EvaluationReason
  initialData?: InitialData
  activeProblemsList?: ActiveProblemsList
  vaccinationStatus?: VaccinationStatus
  familyHistory?: FamilyHistory
  socialHistory?: SocialHistory
  generalSymptoms?: GeneralSymptoms

  // Módulos de triagem (screening) - condicionais
  hypertensionScreening?: HypertensionScreening
  diabetesScreening?: DiabetesScreening
  obesityScreening?: ObesityScreening
  cholesterolScreening?: CholesterolScreening
  dpocScreening?: DPOCScreening
  osteoporosisScreening?: OsteoporosisScreening
  cardiovascularScreening?: CardiovascularScreening
  cancerScreening?: CancerScreening
  parkinsonScreening?: ParkinsonScreening
  asthmaScreening?: AsthmaScreening

  // Módulos específicos por perfil
  pregnancyModule?: PregnancyModule
  childModule?: ChildModule
  adolescentModule?: AdolescentModule
  adultModule?: AdultModule
  elderlyModule?: ElderlyModule

  // Controle de navegação
  completedScreenings?: string[] // Array de screenings concluídos
  applicableScreenings?: string[] // Array de screenings aplicáveis ao perfil

  // Resultados de IA (classificação de risco)
  aiRiskClassification?: RiskClassification
  aiRiskFindings?: string[]
  aiRiskReasoning?: Record<string, string>
  aiRiskModel?: string
  aiRiskUpdatedAt?: Date | string
  aiRiskRaw?: string
}
