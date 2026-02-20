import type { RequestQuestionnairesType } from '@/types/entities/requestQuestionnaires'

/**
 * Mapeia o nome do questionário para o caminho do arquivo PDF
 * @param questionnaireName - Nome do questionário
 * @returns Caminho do PDF ou null se não encontrado
 */
export function getQuestionnairePdfPath(
  questionnaireName: string,
): string | null {
  // Mapeamento entre nomes dos questionários e nomes dos arquivos PDF
  const questionnairePdfMap: Record<string, string> = {
    'PHQ-9 - Saúde mental geral': 'PHQ-9 - Saúde mental geral.pdf',
    'Avaliação de ansiedade': 'Avaliação de ansiedade.pdf',
    'Avaliação de estresse': 'Avaliação de estresse.pdf',
    'Escala transversal saude mental': 'Escala transversal saude mental.pdf',
    'Controle da Asma': 'Controle da Asma.pdf',
    'Impacto da DPOC': 'Impacto da DPOC.pdf',
    'Consumo de Álcool': 'Consumo de Álcool.pdf',
    'Teste de depedencia a Nicotina': 'Teste de depedencia a Nicotina.pdf',
    'Risco de diabetes': 'Risco de diabetes.pdf',
    'Adesão ao tratamento medicamentoso':
      'Adesão ao tratamento medicamentoso.pdf',
    'Percepção da Doença': 'Percepção da Doença.pdf',
    'Adesão ao rastreio preventivo': 'Adesão ao rastreio preventivo.pdf',
    'Risco Cardiovascular 10 anos': 'Risco Cardiovascular 10 anos.pdf',
    'Avaliação Estilo de vida': 'Avaliação Estilo de vida.pdf',
    'Comportamento Sedentário': 'Comportamento Sedentário.pdf',
    'Frequência Alimentar': 'Frequência Alimentar.pdf',
    'Avaliação Qualidade do Sono': 'Avaliação Qualidade do Sono.pdf',
    'Prontidão para Mudança': 'Prontidão para Mudança.pdf',
    'Qualidade de Vida': 'Qualidade de Vida.pdf',
    'Autoeficácia Geral': 'Autoeficácia Geral.pdf',
  }

  const pdfFileName = questionnairePdfMap[questionnaireName]

  if (!pdfFileName) {
    return null
  }

  return `/questionnaire/${encodeURIComponent(pdfFileName)}`
}

export function getQuestionnaireType(
  questionnaireName: string,
): RequestQuestionnairesType | null {
  // Pilar 1: Saúde Mental
  const mentalQuestionnaires = [
    'PHQ-9 - Saúde mental geral',
    'Avaliação de ansiedade',
    'Avaliação de estresse',
    'Escala transversal saude mental',
  ]

  // Pilar 2: Biomarcadores de saúde
  const biomarkersQuestionnaires = [
    'Controle da Asma',
    'Impacto da DPOC',
    'Consumo de Álcool',
    'Teste de depedencia a Nicotina',
    'Risco de diabetes',
    'Adesão ao tratamento medicamentoso',
    'Percepção da Doença',
    'Adesão ao rastreio preventivo',
    'Risco Cardiovascular 10 anos',
  ]

  // Pilar 3: Estilo de vida e hábitos
  const lifestyleQuestionnaires = [
    'Avaliação Estilo de vida',
    'Comportamento Sedentário',
    'Frequência Alimentar',
    'Avaliação Qualidade do Sono',
    'Prontidão para Mudança',
    'Qualidade de Vida',
    'Autoeficácia Geral',
  ]

  if (mentalQuestionnaires.includes(questionnaireName)) {
    return 'MENTAL'
  }

  if (biomarkersQuestionnaires.includes(questionnaireName)) {
    return 'BIOMARKERS'
  }

  if (lifestyleQuestionnaires.includes(questionnaireName)) {
    return 'LIFESTYLE'
  }

  return null
}
