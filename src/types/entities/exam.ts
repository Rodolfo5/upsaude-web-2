export type ExamStatus = 'requested' | 'completed'

export type ExamType = 'exam' | 'prescription'

export interface MedicationData {
  id?: string
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  quantity?: string
  instructions?: string
  presentation?: string
  pharmaceutical_form?: string
  via?: string
  posologia?: string
  // Campos adicionais
  receituario?: string
  tarja?: string
  unit?: string
}

export interface ProcedureData {
  id?: string
  name: string
  description?: string
  instructions?: string
}

export interface ExamData {
  id?: string
  name: string
  instructions?: string
  observations?: string
  // Campos adicionais
  tipo?: string
  codigo_sus?: string
  codigo_tuss?: string
}

export interface ExamEntity {
  id: string
  patientId: string
  requestDate: Date | string
  completionDate?: Date | string | null
  doctorId: string
  status: ExamStatus
  examUrl?: string
  createdAt?: Date | string
  updatedAt?: Date | string

  // Campos adicionais para prescrições
  type?: ExamType // 'exam' ou 'prescription'
  consultationId?: string
  memedId?: string // ID da prescrição na Memed
  memedUrl?: string // URL da prescrição no Memed
  pdfUrl?: string // URL do PDF da prescrição
  digitalRecipeLink?: string // Link da receita digital

  // Dados da prescrição
  medications?: MedicationData[]
  procedures?: ProcedureData[]
  exams?: ExamData[] // Exames prescritos dentro da prescrição

  // Dados do paciente no momento da prescrição
  patientData?: {
    name: string
    cpf?: string
    birthDate?: string
  }

  // Dados do prescritor no momento da prescrição
  prescriber?: {
    name: string
    crm: string
    crmState: string
  }

  // Dados do médico (do rawData.data.attributes.medico)
  doctorData?: {
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

  // Dados normalizados da API Memed (estrutura limpa, sem campos nulos/redundantes)
  rawData?: Record<string, unknown>

  // URL do resultado do exame (upload feito pelo paciente via app mobile)
  resultUrl?: string

  // Nome do exame (para facilitar listagem)
  examName?: string
  notes?: string

  examFile?: string
}
