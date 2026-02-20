export interface RegisterDoctorData {
  externalId: string // UUID recomendado
  name: string
  surname: string
  email?: string
  cpf?: string
  crm: string
  crmState: string
  phone?: string
  gender?: 'M' | 'F'
  birthDate?: string // formato dd/mm/YYYY
  cityId?: number
  specialtyId?: number
}

export interface ValidateCrmData {
  crm: string
  crmState: string
  skipMemedValidation?: boolean // Se true, valida apenas uso local, não valida na Memed
}

export interface MemedPrescriberData {
  id?: string
  externalId?: string
  nome?: string
  sobrenome?: string
  name?: string
  surname?: string
  email?: string
  cpf?: string
  telefone?: string
  phone?: string
  data_nascimento?: string
  birthDate?: string
  sexo?: string
  gender?: 'M' | 'F'
  board?: {
    board_code?: string
    board_number?: string
    board_state?: string
  }
  crm?: string
  crmState?: string
  cidade?: {
    id?: number
    nome?: string
    name?: string
  }
  especialidade?: {
    id?: number
    nome?: string
    name?: string
  }
  specialty?: string
  [key: string]: unknown // Permite campos adicionais retornados pela API
}

export interface MemedDoctorResponse {
  success: boolean
  memedId?: string
  prescriberToken?: string // Token de acesso do prescritor
  prescriber?: MemedPrescriberData // Dados completos do prescritor cadastrado
  error?: string
}

export interface GetPrescriberTokenData {
  identifier: string // CPF, external_id, ou registro+UF (ex: 12345SP)
  identifierType: 'cpf' | 'external_id' | 'board'
}

export interface MemedCrmValidationResponse {
  valid: boolean
  memedId?: string
  doctor?: {
    name?: string
    crm?: string
    crmState?: string
    specialty?: string
  }
  error?: string
  inUse?: boolean // Indica se o CRM já está sendo usado no banco de dados local
  inUseBy?: {
    id: string
    name: string
    email: string
  } // Informações do médico que já usa o CRM
}

export interface CheckDoctorExistsResponse {
  exists: boolean
  memedId?: string
  doctor?: {
    name?: string
    email?: string
    crm?: string
    crmState?: string
  }
  error?: string
}

export interface MemedConfig {
  apiKey: string
  apiSecret: string
  baseUrl: string
}

export interface MemedMedication {
  id: string
  nome: string
  posologia?: string
  apresentacao?: string
  forma_farmaceutica?: string
  via?: string
  quantidade?: string
  duracao?: string
  frequencia?: string
  instrucoes?: string
  // Campos adicionais
  receituario?: string
  tarja?: string
  unit?: string
  [key: string]: unknown
}

export interface MemedExam {
  id: string
  nome: string
  posologia?: string
  instrucoes?: string
  observacoes?: string
  // Campos adicionais
  tipo?: string
  codigo_sus?: string
  codigo_tuss?: string
  [key: string]: unknown
}

export interface MemedProcedure {
  id: string
  nome: string
  descricao?: string
  instrucoes?: string
  [key: string]: unknown
}

export interface MemedPatient {
  id?: string
  idExterno?: string
  nome?: string
  cpf?: string
  telefone?: string
  data_nascimento?: string
  endereco?: string
  [key: string]: unknown
}

export interface MemedPrescriber {
  id?: string
  nome?: string
  sobrenome?: string
  cpf?: string
  board?: {
    board_code?: string
    board_number?: string
    board_state?: string
  }
  especialidade?: string
  [key: string]: unknown
}

export interface MemedPrescription {
  id?: string
  medicamentos?: MemedMedication[]
  exames?: MemedExam[]
  procedimentos?: MemedProcedure[]
  paciente?: MemedPatient
  prescritor?: MemedPrescriber
  data_criacao?: string
  created_at?: string | number
  createdAt?: string | number
  link_receita?: string
  pdf_url?: string
  url?: string
  status?: string
  [key: string]: unknown
}

export interface GetPrescriptionResponse {
  success: boolean
  prescription?: MemedPrescription
  error?: string
}

export interface GetPrescriptionsListResponse {
  success: boolean
  prescriptions?: MemedPrescription[]
  error?: string
}
