/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HealthCheckupEntity } from '@/types/entities/healthCheckup'

/**
 * Calcula o score PHQ-9 (Depressão)
 */
function calculatePHQ9Score(phq9?: {
  littleInterest?: number
  feelingDown?: number
  fatigueOrLowEnergy?: number
  sleepProblems?: number
  appetiteChanges?: number
  feelingBadAboutSelf?: number
  concentrationDifficulty?: number
  psychomotorChanges?: number
  thoughtsOfDeath?: number
}): number | null {
  if (!phq9) return null

  const scores = [
    phq9.littleInterest,
    phq9.feelingDown,
    phq9.fatigueOrLowEnergy,
    phq9.sleepProblems,
    phq9.appetiteChanges,
    phq9.feelingBadAboutSelf,
    phq9.concentrationDifficulty,
    phq9.psychomotorChanges,
    phq9.thoughtsOfDeath,
  ].filter((s) => s !== undefined) as number[]

  if (scores.length === 0) return null

  return scores.reduce((sum, score) => sum + score, 0)
}

/**
 * Calcula o score GAD-7 (Ansiedade)
 */
function calculateGAD7Score(gad7?: {
  feelingNervous?: number
  unableToControlWorries?: number
  worryingTooMuch?: number
  troubleRelaxing?: number
  restlessness?: number
  easilyAnnoyed?: number
  feelingAfraid?: number
}): number | null {
  if (!gad7) return null

  const scores = [
    gad7.feelingNervous,
    gad7.unableToControlWorries,
    gad7.worryingTooMuch,
    gad7.troubleRelaxing,
    gad7.restlessness,
    gad7.easilyAnnoyed,
    gad7.feelingAfraid,
  ].filter((s) => s !== undefined) as number[]

  if (scores.length === 0) return null

  return scores.reduce((sum, score) => sum + score, 0)
}

/**
 * Calcula IMC a partir de peso e altura
 */
function calculateBMI(weight?: string, height?: string): number | null {
  if (!weight || !height) return null

  const weightNum = parseFloat(
    weight.replace(/[^0-9.,]/g, '').replace(',', '.'),
  )
  const heightNum = parseFloat(
    height.replace(/[^0-9.,]/g, '').replace(',', '.'),
  )

  if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) return null

  // Se altura está em cm, converter para metros
  const heightInMeters = heightNum > 3 ? heightNum / 100 : heightNum

  return weightNum / (heightInMeters * heightInMeters)
}

/**
 * Classifica IMC
 */
function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso'
  if (bmi < 25) return 'Peso normal'
  if (bmi < 30) return 'Sobrepeso'
  return 'Obesidade'
}

/**
 * Calcula idade a partir da data de nascimento
 */
type DateLike = Date | string | { toDate?: () => Date }

function calculateAge(birthDate?: DateLike): number | null {
  if (!birthDate) return null

  const birth =
    typeof birthDate === 'string'
      ? new Date(birthDate)
      : birthDate instanceof Date
        ? birthDate
        : typeof birthDate.toDate === 'function'
          ? birthDate.toDate()
          : new Date()
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Formata dados do checkup em texto estruturado para o prompt da IA
 */
export function formatCheckupForPrompt(checkup: HealthCheckupEntity): string {
  const lines: string[] = []

  // Dados básicos do paciente
  lines.push('## DADOS DO PACIENTE')
  const age = calculateAge(checkup.profileIdentification?.birthDate)
  if (age !== null) {
    lines.push(`- Idade: ${age} anos`)
  }
  if (checkup.profileIdentification?.assignedSex) {
    lines.push(`- Sexo: ${checkup.profileIdentification.assignedSex}`)
  }
  if (checkup.userProfile) {
    lines.push(`- Perfil: ${checkup.userProfile}`)
  }

  // Antropometria e IMC
  const weight = checkup.initialData?.weight
  const height = checkup.initialData?.height
  const bmi = weight && height ? calculateBMI(weight, height) : null

  if (weight) lines.push(`- Peso: ${weight} kg`)
  if (height) lines.push(`- Altura: ${height}`)
  if (bmi !== null) {
    lines.push(`- IMC: ${bmi.toFixed(1)} (${classifyBMI(bmi)})`)
  }
  if (checkup.initialData?.waistCircumference) {
    lines.push(
      `- Circunferência abdominal: ${checkup.initialData.waistCircumference} cm`,
    )
  }

  // Condições ativas
  if (
    checkup.activeProblemsList?.conditions &&
    checkup.activeProblemsList.conditions.length > 0
  ) {
    lines.push(
      `- Condições ativas: ${checkup.activeProblemsList.conditions.join(', ')}`,
    )
  }

  // Histórico familiar
  if (
    checkup.familyHistory?.conditions &&
    checkup.familyHistory.conditions.length > 0
  ) {
    lines.push(
      `- Histórico familiar: ${checkup.familyHistory.conditions.join(', ')}`,
    )
  }

  // Saúde Mental - PHQ-9
  const phq9Score = calculatePHQ9Score(checkup.adultModule?.phq9)
  if (phq9Score !== null) {
    let severity = 'Mínima'
    if (phq9Score >= 20) severity = 'Severa'
    else if (phq9Score >= 15) severity = 'Moderadamente severa'
    else if (phq9Score >= 10) severity = 'Moderada'
    else if (phq9Score >= 5) severity = 'Leve'

    lines.push(`- Score PHQ-9 (Depressão): ${phq9Score}/27 (${severity})`)
  }

  // Saúde Mental - GAD-7
  const gad7Score = calculateGAD7Score(checkup.adultModule?.gad7)
  if (gad7Score !== null) {
    let severity = 'Mínima'
    if (gad7Score >= 15) severity = 'Severa'
    else if (gad7Score >= 10) severity = 'Moderada'
    else if (gad7Score >= 5) severity = 'Leve'

    lines.push(`- Score GAD-7 (Ansiedade): ${gad7Score}/21 (${severity})`)
  }

  // Qualidade do sono
  if (checkup.socialHistory?.sleepQuality) {
    lines.push(`- Qualidade do sono: ${checkup.socialHistory.sleepQuality}`)
  }
  if (checkup.adultModule?.wakeUpRested) {
    lines.push(`- Acorda descansado: ${checkup.adultModule.wakeUpRested}`)
  }

  // Atividade física
  if (checkup.socialHistory?.physicalActivity150min) {
    lines.push(
      `- Atividade física (150min/semana): ${checkup.socialHistory.physicalActivity150min}`,
    )
  }

  // IPAQ (se disponível)
  const adultModule = checkup.adultModule
  if (adultModule) {
    const vigorousDays = adultModule.vigorousDaysPerWeek || 0
    const moderateDays = adultModule.moderateDaysPerWeek || 0
    const walkingDays = adultModule.walkingDaysPerWeek || 0

    if (vigorousDays > 0 || moderateDays > 0 || walkingDays > 0) {
      lines.push(
        `- Atividade física: ${vigorousDays} dias vigorosa, ${moderateDays} dias moderada, ${walkingDays} dias caminhada por semana`,
      )
    }
  }

  // Alimentação
  if (checkup.socialHistory?.foodQuality) {
    lines.push(`- Qualidade alimentar: ${checkup.socialHistory.foodQuality}`)
  }
  if (adultModule?.freshFoodFrequency) {
    lines.push(
      `- Consumo de alimentos frescos: ${adultModule.freshFoodFrequency}`,
    )
  }
  if (adultModule?.ultraProcessedFrequency) {
    lines.push(
      `- Consumo de ultraprocessados: ${adultModule.ultraProcessedFrequency}`,
    )
  }

  // Tabagismo
  if (checkup.socialHistory?.smokingStatus) {
    lines.push(`- Tabagismo: ${checkup.socialHistory.smokingStatus}`)
  }

  // Álcool
  if (checkup.socialHistory?.alcoholConsumption) {
    lines.push(
      `- Consumo de álcool: ${checkup.socialHistory.alcoholConsumption}`,
    )
  }
  if (adultModule?.alcoholFrequency) {
    lines.push(`- Frequência de álcool: ${adultModule.alcoholFrequency}`)
  }

  // Pressão arterial
  const bloodPressureValues =
    checkup.initialData?.bloodPressureValues ||
    checkup.hypertensionScreening?.bloodPressureValues
  if (bloodPressureValues) {
    lines.push(`- Pressão arterial: ${bloodPressureValues}`)
  }
  if (checkup.hypertensionScreening?.previousDiagnosis) {
    lines.push(
      `- Diagnóstico prévio de hipertensão: ${checkup.hypertensionScreening.previousDiagnosis}`,
    )
  }

  // Glicemia
  if (checkup.initialData?.bloodGlucoseValues) {
    lines.push(`- Glicemia: ${checkup.initialData.bloodGlucoseValues}`)
  }

  // Colesterol
  if (checkup.initialData?.cholesterolValues) {
    lines.push(`- Colesterol: ${checkup.initialData.cholesterolValues}`)
  }

  // Conexão social
  if (checkup.socialHistory?.socialConnection) {
    lines.push(`- Conexão social: ${checkup.socialHistory.socialConnection}`)
  }
  if (adultModule?.socialConnection) {
    lines.push(`- Rede de apoio: ${adultModule.socialConnection}`)
  }

  // Preocupações financeiras
  if (adultModule?.financialWorries) {
    lines.push(`- Preocupações financeiras: ${adultModule.financialWorries}`)
  }

  // Sintomas gerais
  const symptoms: string[] = []
  if (checkup.generalSymptoms?.lackOfInterest === 'Sim')
    symptoms.push('Falta de interesse')
  if (checkup.generalSymptoms?.nervousOrAnxious === 'Sim')
    symptoms.push('Nervosismo/Ansiedade')
  if (checkup.generalSymptoms?.extremeFatigue === 'Sim')
    symptoms.push('Fadiga extrema')
  if (checkup.generalSymptoms?.frequentHeadaches === 'Sim')
    symptoms.push('Dores de cabeça frequentes')
  if (checkup.generalSymptoms?.chronicPain === 'Sim')
    symptoms.push('Dor crônica')

  if (symptoms.length > 0) {
    lines.push(`- Sintomas relatados: ${symptoms.join(', ')}`)
  }

  // Classificação de risco da IA
  if (checkup.aiRiskFindings && checkup.aiRiskFindings.length > 0) {
    lines.push('\n## CLASSIFICAÇÃO DE RISCO (IA)')
    checkup.aiRiskFindings.forEach((finding) => {
      lines.push(`- ${finding}`)
    })
  }

  // Riscos específicos de triagem
  lines.push('\n## TRIAGENS E RISCOS IDENTIFICADOS')

  if (checkup.hypertensionScreening) {
    const htn = checkup.hypertensionScreening
    if (htn.previousDiagnosis === 'Sim') {
      lines.push('- Hipertensão: Diagnóstico prévio confirmado')
    }
    if (htn.bloodPressureValues === 'Alta (acima de 140/90 mmHg)') {
      lines.push('- Pressão arterial elevada detectada')
    }
  }

  if (checkup.diabetesScreening) {
    const dm = checkup.diabetesScreening
    if (dm.previousHighGlucose === 'Sim') {
      lines.push('- Glicemia elevada prévia')
    }
    if (dm.familyDiabetes && dm.familyDiabetes !== 'Não') {
      lines.push(`- Histórico familiar de diabetes: ${dm.familyDiabetes}`)
    }
  }

  if (checkup.obesityScreening) {
    const obesity = checkup.obesityScreening
    if (obesity.unintentionalWeightGain === 'Sim') {
      lines.push('- Ganho de peso não intencional (>5kg no último ano)')
    }
  }

  if (checkup.cardiovascularScreening) {
    const cvd = checkup.cardiovascularScreening
    if (cvd.hasHTNorDMorCholesterol && cvd.hasHTNorDMorCholesterol.length > 0) {
      lines.push(
        `- Fatores de risco cardiovascular: ${cvd.hasHTNorDMorCholesterol.join(', ')}`,
      )
    }
  }

  return lines.join('\n')
}
