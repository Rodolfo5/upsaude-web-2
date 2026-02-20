import type {
  MemedMedication,
  MemedExam,
  MemedProcedure,
  MemedPrescription,
} from '@/services/memed/types'
import { classifyMemedItem } from '@/utils/memedItemClassification'

/**
 * Estrutura padronizada dos dados da prescrição
 */
export interface ExtractedPrescriptionData {
  prescriptionId?: string
  medicamentos: MemedMedication[]
  exames: MemedExam[]
  procedimentos: MemedProcedure[]
  paciente?: Record<string, unknown>
  medico?: Record<string, unknown>
  createdAt?: string
  pdfUrl?: string
  linkReceita?: string
  rawData: Record<string, unknown>
}

/**
 * Extrai dados da prescrição de diferentes estruturas possíveis do evento Memed
 *
 * A Memed pode enviar dados em diferentes formatos:
 * 1. event.data.prescriptionData.data.attributes (setGeneratedPrescription)
 * 2. event.data.data.prescriptionData.data.attributes
 * 3. event.prescription
 * 4. event.data.prescription
 *
 * Esta função tenta todas as estruturas possíveis e retorna os dados padronizados
 */
export function extractPrescriptionData(
  eventData: unknown,
): ExtractedPrescriptionData {
  const result: ExtractedPrescriptionData = {
    medicamentos: [],
    exames: [],
    procedimentos: [],
    rawData: {},
  }

  if (!eventData || typeof eventData !== 'object') {
    return result
  }

  const data = eventData as Record<string, unknown>

  // Salvar rawData
  result.rawData = data

  // Tentar diferentes estruturas

  // Estrutura 1: data.prescriptionData.data.attributes (evento setGeneratedPrescription direto)
  if (data.prescriptionData) {
    const prescData = data.prescriptionData as Record<string, unknown>
    const prescDataData = prescData.data as Record<string, unknown> | undefined

    if (prescDataData) {
      result.prescriptionId = prescDataData.id?.toString()
      const attributes = prescDataData.attributes as
        | Record<string, unknown>
        | undefined

      if (attributes) {
        extractFromAttributes(attributes, result)
      }
    }
  }

  // Estrutura 2: data.data.prescriptionData.data.attributes (evento com wrapper extra)
  const innerData = data.data as Record<string, unknown> | undefined
  if (innerData?.prescriptionData) {
    const prescData = innerData.prescriptionData as Record<string, unknown>
    const prescDataData = prescData.data as Record<string, unknown> | undefined

    if (prescDataData) {
      if (!result.prescriptionId) {
        result.prescriptionId = prescDataData.id?.toString()
      }
      const attributes = prescDataData.attributes as
        | Record<string, unknown>
        | undefined

      if (attributes && result.medicamentos.length === 0) {
        extractFromAttributes(attributes, result)
      }
    }
  }

  // Estrutura 3: data.prescription (fallback)
  if (data.prescription && result.medicamentos.length === 0) {
    const prescription = data.prescription as Record<string, unknown>
    extractFromPrescription(prescription, result)
  }

  // Estrutura 4: innerData.prescription (outro fallback)
  if (innerData?.prescription && result.medicamentos.length === 0) {
    const prescription = innerData.prescription as Record<string, unknown>
    extractFromPrescription(prescription, result)
  }

  // Estrutura 5: Dados diretos no root (medicamentos no topo)
  if (data.medicamentos && result.medicamentos.length === 0) {
    extractFromPrescription(data, result)
  }

  // Estrutura 6: Verifica se tem attributes direto em data
  if (data.attributes && result.medicamentos.length === 0) {
    const attributes = data.attributes as Record<string, unknown>
    extractFromAttributes(attributes, result)
  }

  // Estrutura 8: data.data.attributes (estrutura aninhada com data wrapper)
  if (result.medicamentos.length === 0 && innerData?.attributes) {
    const attributes = innerData.attributes as Record<string, unknown>
    extractFromAttributes(attributes, result)
  }

  // Estrutura 7: Array misturado de medicamentos e exames (fallback da Memed)
  // A Memed coloca tudo no array 'medicamentos'. Usamos classifyMemedItem para separar.
  if (
    (result.medicamentos.length === 0 || result.exames.length === 0) &&
    Array.isArray(data.medicamentos)
  ) {
    const mixedArray = data.medicamentos as Array<Record<string, unknown>>

    // Separar usando classificação robusta (verifica características de medicamento vs exame)
    const medicamentosFiltered = mixedArray.filter(
      (item) => classifyMemedItem(item) === 'medication',
    )
    const examesFiltered = mixedArray.filter(
      (item) => classifyMemedItem(item) === 'exam',
    )

    if (result.medicamentos.length === 0 && medicamentosFiltered.length > 0) {
      result.medicamentos = medicamentosFiltered.map((med) =>
        normalizeMedication(med),
      )
    }

    if (result.exames.length === 0 && examesFiltered.length > 0) {
      result.exames = examesFiltered.map((exam) => normalizeExam(exam))
    }
  }

  // Tentar obter ID da prescrição de outras fontes se ainda não temos
  if (!result.prescriptionId) {
    result.prescriptionId =
      (data.prescriptionId as string) ||
      (data.prescricaoId as string) ||
      (data.id as string) ||
      (innerData?.prescriptionId as string) ||
      (innerData?.prescricaoId as string) ||
      (innerData?.id as string)
  }

  // Se ainda não encontramos medicamentos, tentar extrair de qualquer lugar
  if (result.medicamentos.length === 0) {
    // Tentar data.data.data (estrutura aninhada extra)
    const deepData = (data.data as Record<string, unknown> | undefined)
      ?.data as Record<string, unknown> | undefined
    if (deepData?.medicamentos) {
      const meds = deepData.medicamentos as Array<Record<string, unknown>>
      if (Array.isArray(meds) && meds.length > 0) {
        result.medicamentos = meds.map(normalizeMedication)
      }
    }

    // Tentar data.data.attributes (outra estrutura possível)
    if (result.medicamentos.length === 0 && deepData?.attributes) {
      const attrs = deepData.attributes as Record<string, unknown>
      if (attrs.medicamentos) {
        const meds = attrs.medicamentos as Array<Record<string, unknown>>
        if (Array.isArray(meds) && meds.length > 0) {
          result.medicamentos = meds.map(normalizeMedication)
        }
      }
    }
  }

  // Verificar exames também
  if (result.exames.length === 0) {
    const deepData = (data.data as Record<string, unknown> | undefined)
      ?.data as Record<string, unknown> | undefined
    if (deepData?.exames) {
      const exs = deepData.exames as Array<Record<string, unknown>>
      if (Array.isArray(exs) && exs.length > 0) {
        result.exames = exs.map(normalizeExam)
      }
    }

    if (result.exames.length === 0 && deepData?.attributes) {
      const attrs = deepData.attributes as Record<string, unknown>
      if (attrs.exames) {
        const exs = attrs.exames as Array<Record<string, unknown>>
        if (Array.isArray(exs) && exs.length > 0) {
          result.exames = exs.map(normalizeExam)
        }
      }
    }
  }

  // Verificar procedimentos também
  if (result.procedimentos.length === 0) {
    const deepData = (data.data as Record<string, unknown> | undefined)
      ?.data as Record<string, unknown> | undefined
    if (deepData?.procedimentos) {
      const procs = deepData.procedimentos as Array<Record<string, unknown>>
      if (Array.isArray(procs) && procs.length > 0) {
        result.procedimentos = procs.map(normalizeProcedure)
      }
    }

    if (result.procedimentos.length === 0 && deepData?.attributes) {
      const attrs = deepData.attributes as Record<string, unknown>
      if (attrs.procedimentos) {
        const procs = attrs.procedimentos as Array<Record<string, unknown>>
        if (Array.isArray(procs) && procs.length > 0) {
          result.procedimentos = procs.map(normalizeProcedure)
        }
      }
    }
  }

  return result
}

/**
 * Extrai dados do objeto attributes
 */
function extractFromAttributes(
  attributes: Record<string, unknown>,
  result: ExtractedPrescriptionData,
): void {
  // Extrair medicamentos - A Memed mistura medicamentos e exames no mesmo array
  // Usar classifyMemedItem para separar corretamente
  const medicamentosRaw = attributes.medicamentos as
    | Array<Record<string, unknown>>
    | undefined

  if (Array.isArray(medicamentosRaw) && medicamentosRaw.length > 0) {
    // Separar medicamentos de exames usando classificação robusta
    const onlyMedications = medicamentosRaw.filter(
      (item) => classifyMemedItem(item) === 'medication',
    )
    const examsFromMedArray = medicamentosRaw.filter(
      (item) => classifyMemedItem(item) === 'exam',
    )

    if (onlyMedications.length > 0) {
      result.medicamentos = onlyMedications.map((med) =>
        normalizeMedication(med),
      )
    }

    // Exames encontrados no array medicamentos
    if (examsFromMedArray.length > 0) {
      result.exames = examsFromMedArray.map((exam) => normalizeExam(exam))
    }
  }

  // Extrair exames do array exames separado (quando a Memed envia separadamente)
  const examesRaw = attributes.exames as
    | Array<Record<string, unknown>>
    | undefined

  if (Array.isArray(examesRaw) && examesRaw.length > 0) {
    const existingExamIds = new Set(result.exames.map((e) => e.id))
    const newExams = examesRaw
      .map((exam) => normalizeExam(exam))
      .filter((exam) => !existingExamIds.has(exam.id))
    result.exames = [...result.exames, ...newExams]
  }

  // Extrair procedimentos
  const procedimentosRaw = attributes.procedimentos as
    | Array<Record<string, unknown>>
    | undefined

  if (Array.isArray(procedimentosRaw) && procedimentosRaw.length > 0) {
    result.procedimentos = procedimentosRaw.map((proc) =>
      normalizeProcedure(proc),
    )
  }

  // Extrair dados adicionais
  if (attributes.paciente) {
    result.paciente = attributes.paciente as Record<string, unknown>
  }

  if (attributes.medico) {
    result.medico = attributes.medico as Record<string, unknown>
  }

  if (attributes.created_at) {
    result.createdAt = attributes.created_at as string
  }

  if (attributes.pdf_url) {
    result.pdfUrl = attributes.pdf_url as string
  }

  if (attributes.link_receita) {
    result.linkReceita = attributes.link_receita as string
  }
}

/**
 * Extrai dados de um objeto de prescrição diretamente
 */
function extractFromPrescription(
  prescription: Record<string, unknown>,
  result: ExtractedPrescriptionData,
): void {
  if (!result.prescriptionId && prescription.id) {
    result.prescriptionId = prescription.id.toString()
  }

  // Se tem attributes, usar extractFromAttributes
  if (prescription.attributes) {
    extractFromAttributes(
      prescription.attributes as Record<string, unknown>,
      result,
    )
    return
  }

  // Extrair direto do objeto - A Memed mistura tudo no array 'medicamentos'
  const medicamentosRaw = prescription.medicamentos as
    | Array<Record<string, unknown>>
    | undefined
  if (Array.isArray(medicamentosRaw) && medicamentosRaw.length > 0) {
    // Separar medicamentos de exames usando classificação robusta
    const onlyMedications = medicamentosRaw.filter(
      (item) => classifyMemedItem(item) === 'medication',
    )
    const examsFromMedArray = medicamentosRaw.filter(
      (item) => classifyMemedItem(item) === 'exam',
    )

    if (onlyMedications.length > 0) {
      result.medicamentos = onlyMedications.map((med) =>
        normalizeMedication(med),
      )
    }
    if (examsFromMedArray.length > 0) {
      result.exames = examsFromMedArray.map((exam) => normalizeExam(exam))
    }
  }

  const examesRaw = prescription.exames as
    | Array<Record<string, unknown>>
    | undefined
  if (Array.isArray(examesRaw) && examesRaw.length > 0) {
    const existingExamIds = new Set(result.exames.map((e) => e.id))
    const newExams = examesRaw
      .map((exam) => normalizeExam(exam))
      .filter((exam) => !existingExamIds.has(exam.id))
    result.exames = [...result.exames, ...newExams]
  }

  const procedimentosRaw = prescription.procedimentos as
    | Array<Record<string, unknown>>
    | undefined
  if (Array.isArray(procedimentosRaw) && procedimentosRaw.length > 0) {
    result.procedimentos = procedimentosRaw.map((proc) =>
      normalizeProcedure(proc),
    )
  }

  if (prescription.paciente) {
    result.paciente = prescription.paciente as Record<string, unknown>
  }

  if (prescription.medico || prescription.prescritor) {
    result.medico =
      (prescription.medico as Record<string, unknown>) ||
      (prescription.prescritor as Record<string, unknown>)
  }

  if (prescription.created_at || prescription.data_criacao) {
    result.createdAt =
      (prescription.created_at as string) ||
      (prescription.data_criacao as string)
  }

  if (prescription.pdf_url) {
    result.pdfUrl = prescription.pdf_url as string
  }

  if (prescription.link_receita) {
    result.linkReceita = prescription.link_receita as string
  }
}

/**
 * Normaliza um objeto de medicamento para o formato MemedMedication
 * Extrai apenas os dados relevantes
 */
function normalizeMedication(med: Record<string, unknown>): MemedMedication {
  // Extrair posologia HTML ou sanitizada
  const posologiaHtml = med.posologia as string | undefined
  const posologiaSanitizada = med.sanitized_posology as string | undefined
  const posologiaFinal = posologiaSanitizada || posologiaHtml

  return {
    id: (med.id as string) || '',
    nome:
      (med.titulo as string) ||
      (med.nome as string) ||
      (med.name as string) ||
      '',
    posologia: posologiaFinal,
    apresentacao:
      (med.subtitulo as string) ||
      (med.apresentacao as string) ||
      (med.descricao as string) ||
      (med.presentation as string),
    forma_farmaceutica:
      (med.forma_farmaceutica as string) ||
      (med.pharmaceutical_form as string) ||
      (med.singular as string),
    via: (med.via as string) || undefined,
    quantidade:
      med.quantidade !== undefined && med.quantidade !== null
        ? typeof med.quantidade === 'number'
          ? med.quantidade.toString()
          : (med.quantidade as string)
        : undefined,
    duracao: (med.duracao as string) || (med.duration as string),
    frequencia: (med.frequencia as string) || (med.frequency as string),
    instrucoes: (med.instrucoes as string) || (med.instructions as string),
    // Campos adicionais úteis
    receituario: med.receituario as string | undefined,
    tarja: med.tarja as string | undefined,
    unit: med.unit as string | undefined,
  }
}

/**
 * Normaliza um objeto de exame para o formato MemedExam
 * Extrai apenas os dados relevantes
 */
function normalizeExam(exam: Record<string, unknown>): MemedExam {
  // Extrair posologia HTML ou sanitizada
  const posologiaHtml = exam.posologia as string | undefined
  const posologiaSanitizada = exam.sanitized_posology as string | undefined
  const posologiaFinal = posologiaSanitizada || posologiaHtml

  return {
    id: (exam.id as string) || '',
    nome:
      (exam.titulo as string) ||
      (exam.nome as string) ||
      (exam.name as string) ||
      '',
    posologia: posologiaFinal,
    instrucoes: (exam.instrucoes as string) || posologiaFinal,
    observacoes: exam.observacoes as string | undefined,
    // Campos adicionais úteis
    tipo: exam.tipo as string | undefined,
    codigo_sus: exam.exames_sus_codigo as string | undefined,
    codigo_tuss: exam.exames_tuss_codigo as string | undefined,
  }
}

/**
 * Normaliza um objeto de procedimento para o formato MemedProcedure
 */
function normalizeProcedure(proc: Record<string, unknown>): MemedProcedure {
  return {
    id: (proc.id as string) || '',
    nome: (proc.nome as string) || (proc.name as string) || '',
    descricao: proc.descricao as string | undefined,
    instrucoes: proc.instrucoes as string | undefined,
  }
}

/**
 * Converte dados extraídos para o formato MemedPrescription
 */
export function toMemedPrescription(
  extracted: ExtractedPrescriptionData,
): MemedPrescription {
  return {
    id: extracted.prescriptionId,
    medicamentos: extracted.medicamentos,
    exames: extracted.exames,
    procedimentos: extracted.procedimentos,
    paciente: extracted.paciente,
    prescritor: extracted.medico,
    created_at: extracted.createdAt,
    pdf_url: extracted.pdfUrl,
    link_receita: extracted.linkReceita,
  }
}

/**
 * Extrai dados do médico da prescrição
 * Tenta diferentes estruturas possíveis onde os dados podem estar
 * Suporta tanto a estrutura antiga (data.attributes.medico) quanto a nova (prescriber)
 */
export function extractDoctorDataFromPrescription(
  rawData: Record<string, unknown>,
):
  | {
      nome_medico?: string
      cidade_medico?: string
      endereco_medico?: string
      telefone_medico?: string
      board?: {
        board_code?: string
        board_number?: string
        board_state?: string
      }
    }
  | undefined {
  // Estrutura nova normalizada: rawData.prescriber
  const prescriber = rawData.prescriber as Record<string, unknown> | undefined
  if (prescriber?.name) {
    const council = prescriber.council as
      | Record<string, unknown>
      | undefined
    const doctorData: {
      nome_medico?: string
      cidade_medico?: string
      endereco_medico?: string
      telefone_medico?: string
      board?: {
        board_code?: string
        board_number?: string
        board_state?: string
      }
    } = {
      nome_medico: prescriber.name as string | undefined,
      cidade_medico: prescriber.city as string | undefined,
      endereco_medico: prescriber.address as string | undefined,
      telefone_medico: prescriber.phone as string | undefined,
    }

    if (council) {
      doctorData.board = {
        board_code: council.code as string | undefined,
        board_number: council.number as string | undefined,
        board_state: council.state as string | undefined,
      }
    }

    return doctorData
  }

  // Estrutura antiga: rawData.data.attributes.medico
  const dataObj = rawData.data as Record<string, unknown> | undefined
  const attributesObj = dataObj?.attributes as
    | Record<string, unknown>
    | undefined
  const medicoObj = attributesObj?.medico as Record<string, unknown> | undefined

  if (medicoObj) {
    const doctorData: {
      nome_medico?: string
      cidade_medico?: string
      endereco_medico?: string
      telefone_medico?: string
      board?: {
        board_code?: string
        board_number?: string
        board_state?: string
      }
    } = {
      nome_medico: medicoObj.nome_medico as string | undefined,
      cidade_medico: medicoObj.cidade_medico as string | undefined,
      endereco_medico: medicoObj.endereco_medico as string | undefined,
      telefone_medico: medicoObj.telefone_medico as string | undefined,
    }

    // Adicionar informações do board se disponível
    const boardObj = medicoObj.board as Record<string, unknown> | undefined
    if (boardObj) {
      doctorData.board = {
        board_code: boardObj.board_code as string | undefined,
        board_number: boardObj.board_number as string | undefined,
        board_state: boardObj.board_state as string | undefined,
      }
    }

    return doctorData
  }

  // Fallback: tentar no nível raiz do rawData
  if (rawData.nome_medico || rawData.cidade_medico || rawData.endereco_medico) {
    const doctorData: {
      nome_medico?: string
      cidade_medico?: string
      endereco_medico?: string
      telefone_medico?: string
    } = {
      nome_medico: rawData.nome_medico as string | undefined,
      cidade_medico: rawData.cidade_medico as string | undefined,
      endereco_medico: rawData.endereco_medico as string | undefined,
      telefone_medico: rawData.telefone_medico as string | undefined,
    }

    return doctorData
  }

  return undefined
}

/**
 * Extrai os dados do prescritor em formato normalizado
 * Busca em diferentes estruturas possíveis da Memed
 */
function extractPrescriberData(
  rawData: Record<string, unknown>,
): Record<string, unknown> | undefined {
  // Tentar extrair de rawData.data.attributes.medico
  const dataObj = rawData.data as Record<string, unknown> | undefined
  const attributesObj = dataObj?.attributes as
    | Record<string, unknown>
    | undefined
  const medicoObj = attributesObj?.medico as Record<string, unknown> | undefined

  if (medicoObj) {
    const boardObj = medicoObj.board as Record<string, unknown> | undefined
    return {
      name: medicoObj.nome_medico as string,
      city: medicoObj.cidade_medico as string,
      address: medicoObj.endereco_medico as string,
      phone: medicoObj.telefone_medico as string,
      ...(boardObj
        ? {
            council: {
              code: boardObj.board_code as string,
              number: boardObj.board_number as string,
              state: boardObj.board_state as string,
            },
          }
        : {}),
    }
  }

  // Fallback: tentar no nível raiz
  if (rawData.nome_medico || rawData.cidade_medico) {
    return {
      name: rawData.nome_medico as string,
      city: rawData.cidade_medico as string,
      address: rawData.endereco_medico as string,
      phone: rawData.telefone_medico as string,
    }
  }

  return undefined
}

/**
 * Limpa e normaliza os dados brutos da prescrição da Memed
 *
 * Remove campos desnecessários, nulos, redundantes e duplicados.
 * Salva apenas referências simplificadas de medicamentos e exames
 * (dados completos ficam em suas respectivas coleções no Firestore).
 *
 * Estrutura normalizada:
 * - id: ID da prescrição na Memed
 * - created_at: Data de criação
 * - prescriptionDate: Data da prescrição
 * - medications: Array de referências { id, name }
 * - exams: Array de referências { id, name }
 * - procedures: Array de referências { id, name }
 * - prescriber: { name, city, address, phone, council: { code, number, state } }
 *
 * Reduz ~90% do tamanho dos dados salvos no Firestore.
 */
export function cleanPrescriptionRawData(
  rawData: Record<string, unknown>,
): Record<string, unknown> {
  // Extrair data da prescrição de diferentes fontes possíveis
  const dataObj = rawData.data as Record<string, unknown> | undefined
  const attributesObj = dataObj?.attributes as
    | Record<string, unknown>
    | undefined
  const prescriptionDate =
    (attributesObj?.data as string | undefined) ||
    (rawData.prescriptionDate as string | undefined) ||
    (rawData.prescriptionDateOriginal as string | undefined)

  const cleaned: Record<string, unknown> = {
    id: rawData.id,
    created_at: rawData.created_at,
    prescriptionDate,
  }

  // Processar medicamentos e exames como referências simplificadas (apenas id + nome)
  const allMedsRefs: Array<{ id: unknown; name: string }> = []
  const allExamsRefs: Array<{ id: unknown; name: string }> = []
  const allProcsRefs: Array<{ id: unknown; name: string }> = []

  // 1. Separar medicamentos e exames do array 'medicamentos' (Memed mistura tudo nesse array)
  if (Array.isArray(rawData.medicamentos)) {
    const medicamentos = rawData.medicamentos as Array<Record<string, unknown>>

    medicamentos.forEach((item) => {
      const ref = {
        id: item.id,
        name:
          (item.titulo as string) ||
          (item.nome as string) ||
          (item.descricao as string) ||
          '',
      }

      if (classifyMemedItem(item) === 'exam') {
        allExamsRefs.push(ref)
      } else {
        allMedsRefs.push(ref)
      }
    })
  }

  // 2. Verificar array 'exames' separado (quando MemedPrescription já foi normalizado)
  if (Array.isArray(rawData.exames)) {
    const exames = rawData.exames as Array<Record<string, unknown>>
    exames.forEach((exam) => {
      const ref = {
        id: exam.id,
        name:
          (exam.titulo as string) ||
          (exam.nome as string) ||
          (exam.name as string) ||
          '',
      }
      // Evitar duplicatas
      if (!allExamsRefs.some((e) => e.id === ref.id)) {
        allExamsRefs.push(ref)
      }
    })
  }

  // 3. Verificar array 'procedimentos' separado
  if (Array.isArray(rawData.procedimentos)) {
    const procedimentos = rawData.procedimentos as Array<Record<string, unknown>>
    procedimentos.forEach((proc) => {
      allProcsRefs.push({
        id: proc.id,
        name:
          (proc.nome as string) ||
          (proc.name as string) ||
          '',
      })
    })
  }

  if (allMedsRefs.length > 0) {
    cleaned.medications = allMedsRefs
  }

  if (allExamsRefs.length > 0) {
    cleaned.exams = allExamsRefs
  }

  if (allProcsRefs.length > 0) {
    cleaned.procedures = allProcsRefs
  }

  // Dados do prescritor (normalizados)
  const prescriberData = extractPrescriberData(rawData)
  if (prescriberData) {
    cleaned.prescriber = prescriberData
  }

  return cleaned
}
