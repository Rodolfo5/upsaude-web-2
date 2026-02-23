import { extractExamsFromPrescription } from '@/utils/extractExamsFromPrescription'
import { extractMedicationsFromPrescription } from '@/utils/extractMedicationsFromPrescription'

import {
  CheckDoctorExistsResponse,
  GetPrescriberTokenData,
  GetPrescriptionResponse,
  GetPrescriptionsListResponse,
  MemedConfig,
  MemedCrmValidationResponse,
  MemedDoctorResponse,
  MemedPrescriberData,
  MemedPrescription,
  RegisterDoctorData,
  ValidateCrmData,
} from './types'

class MemedService {
  private config: MemedConfig

  constructor() {
    // Remove /v1 do final da URL se presente, pois será adicionado nos endpoints específicos
    let baseUrl = process.env.MEMED_API_URL || 'https://api.memed.com.br/v1'
    baseUrl = baseUrl.replace(/\/v1\/?$/, '') // Remove /v1 do final

    this.config = {
      apiKey: process.env.MEMED_API_KEY || '',
      apiSecret: process.env.MEMED_API_SECRET || '',
      baseUrl,
    }

    // Validação das credenciais apenas no servidor
    // No cliente, essas variáveis não estarão disponíveis (comportamento esperado do Next.js)
    if (
      typeof window === 'undefined' &&
      (!this.config.apiKey || !this.config.apiSecret)
    ) {
      console.warn('MEMED_API_KEY ou MEMED_API_SECRET não configuradas')
    }
  }

  /**
   * Constrói query string com API Key e Secret Key
   */
  private getAuthQueryString(): string {
    return `api-key=${encodeURIComponent(this.config.apiKey)}&secret-key=${encodeURIComponent(this.config.apiSecret)}`
  }

  /**
   * Obtém o token de acesso do prescritor da API Memed
   *
   * GET /v1/sinapse-prescricao/usuarios/{ID_USUARIO}?api-key=...&secret-key=...
   *
   * @param data - Dados para identificar o usuário (CPF, external_id, ou registro+UF)
   * @returns Token de acesso do prescritor
   */
  async getPrescriberToken(
    data: GetPrescriberTokenData,
  ): Promise<{ token: string; error?: string }> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error(
          'Credenciais Memed não configuradas. Verifique MEMED_API_KEY e MEMED_API_SECRET no .env.local',
        )
      }

      // Formata o identificador conforme o tipo
      let identifier = data.identifier
      if (data.identifierType === 'board') {
        // Formato: registro+UF (ex: 12345SP)
        identifier = identifier.toUpperCase()
      } else if (data.identifierType === 'cpf') {
        // Remove formatação, apenas números
        identifier = identifier.replace(/\D/g, '')
      }

      const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios/${encodeURIComponent(identifier)}?${this.getAuthQueryString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = 'Erro ao obter token do prescritor'
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage =
              errorData.errors[0]?.detail ||
              errorData.errors[0]?.title ||
              errorMessage
          }
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }

        // Inclui o status code na mensagem de erro para facilitar diagnóstico
        if (response.status === 403) {
          errorMessage = `403 Forbidden: ${errorMessage}`
        } else if (response.status === 404) {
          errorMessage = `404 Not Found: ${errorMessage}`
        }

        return { token: '', error: errorMessage }
      }

      const result = JSON.parse(responseText)

      // O token está em result.data.attributes.token ou similar
      // Ajustar conforme a estrutura real da resposta
      const token =
        result.data?.attributes?.token ||
        result.data?.token ||
        result.token ||
        result.attributes?.token

      if (!token) {
        return {
          token: '',
          error: 'Token não encontrado na resposta da API',
        }
      }

      return { token }
    } catch (error) {
      return {
        token: '',
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao obter token',
      }
    }
  }

  /**
   * Cadastra um novo prescritor na Memed
   *
   * POST /v1/sinapse-prescricao/usuarios?api-key=...&secret-key=...
   *
   * @param data - Dados do médico para cadastro
   * @returns Resposta com sucesso e token do prescritor
   */
  async registerDoctor(data: RegisterDoctorData): Promise<MemedDoctorResponse> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        return {
          success: false,
          error:
            'Credenciais Memed não configuradas. Verifique MEMED_API_KEY e MEMED_API_SECRET no .env.local',
        }
      }

      // Formata data de nascimento se fornecida
      let formattedBirthDate: string | undefined
      if (data.birthDate) {
        // Converte de ISO (YYYY-MM-DD) para dd/mm/YYYY
        const date = new Date(data.birthDate)
        if (!isNaN(date.getTime())) {
          formattedBirthDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
        }
      }

      // Formata telefone (remove formatação)
      const cleanPhone = data.phone?.replace(/\D/g, '')
      const cleanCpf = data.cpf?.replace(/\D/g, '')
      const cleanCrm = data.crm.replace(/\D/g, '')

      // Monta o payload no formato JSON:API
      interface MemedPayload {
        data: {
          type: string
          attributes: {
            external_id: string
            nome: string
            sobrenome: string
            board: {
              board_code: string
              board_number: string
              board_state: string
            }
            cpf?: string
            email?: string
            telefone?: string
            sexo?: string
            data_nascimento?: string
          }
          relationships?: {
            cidade?: {
              data: {
                type: string
                id: number
              }
            }
            especialidade?: {
              data: {
                type: string
                id: number
              }
            }
          }
        }
      }

      const payload: MemedPayload = {
        data: {
          type: 'usuarios',
          attributes: {
            external_id: data.externalId,
            nome: data.name,
            sobrenome: data.surname,
            board: {
              board_code: 'CRM',
              board_number: cleanCrm,
              board_state: data.crmState.toUpperCase(),
            },
          },
        },
      }

      // Adiciona campos opcionais se fornecidos
      if (cleanCpf) {
        payload.data.attributes.cpf = cleanCpf
      }
      if (data.email) {
        payload.data.attributes.email = data.email
      }
      if (cleanPhone) {
        payload.data.attributes.telefone = cleanPhone
      }
      if (data.gender) {
        payload.data.attributes.sexo = data.gender
      }
      if (formattedBirthDate) {
        payload.data.attributes.data_nascimento = formattedBirthDate
      }

      // Adiciona relationships se fornecidos
      if (data.cityId || data.specialtyId) {
        payload.data.relationships = {}
        if (data.cityId) {
          payload.data.relationships.cidade = {
            data: {
              type: 'cidades',
              id: data.cityId,
            },
          }
        }
        if (data.specialtyId) {
          payload.data.relationships.especialidade = {
            data: {
              type: 'especialidades',
              id: data.specialtyId,
            },
          }
        }
      }

      const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios?${this.getAuthQueryString()}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = 'Erro ao cadastrar médico na Memed'
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage =
              errorData.errors[0]?.detail ||
              errorData.errors[0]?.title ||
              errorMessage
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage
          }
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }

        return {
          success: false,
          error: errorMessage,
        }
      }

      const result = JSON.parse(responseText)

      // Extrai o ID e token da resposta
      const memedId =
        result.data?.id || result.data?.attributes?.id || result.id

      const prescriberToken =
        result.data?.attributes?.token ||
        result.data?.token ||
        result.token ||
        result.attributes?.token

      // Extrai todos os dados do prescritor da resposta
      const prescriberData =
        result.data?.attributes || result.data || result.attributes || {}

      // Monta objeto com dados completos do prescritor
      const prescriber: MemedPrescriberData = {
        id: memedId?.toString(),
        externalId: prescriberData.external_id || data.externalId,
        nome: prescriberData.nome || data.name,
        sobrenome: prescriberData.sobrenome || data.surname,
        name: prescriberData.nome || data.name,
        surname: prescriberData.sobrenome || data.surname,
        email: prescriberData.email || data.email,
        cpf: prescriberData.cpf || data.cpf,
        telefone: prescriberData.telefone || data.phone,
        phone: prescriberData.telefone || data.phone,
        data_nascimento: prescriberData.data_nascimento,
        birthDate: prescriberData.data_nascimento,
        sexo: prescriberData.sexo || data.gender,
        gender: prescriberData.sexo || data.gender,
        board: prescriberData.board || {
          board_code: 'CRM',
          board_number: cleanCrm,
          board_state: data.crmState.toUpperCase(),
        },
        crm: prescriberData.board?.board_number || cleanCrm,
        crmState:
          prescriberData.board?.board_state || data.crmState.toUpperCase(),
        cidade:
          prescriberData.cidade ||
          (result.data?.relationships?.cidade?.data
            ? {
              id: result.data.relationships.cidade.data.id,
              nome: result.data.relationships.cidade.data.attributes?.nome,
              name: result.data.relationships.cidade.data.attributes?.nome,
            }
            : undefined),
        especialidade:
          prescriberData.especialidade ||
          (result.data?.relationships?.especialidade?.data
            ? {
              id: result.data.relationships.especialidade.data.id,
              nome: result.data.relationships.especialidade.data.attributes
                ?.nome,
              name: result.data.relationships.especialidade.data.attributes
                ?.nome,
            }
            : undefined),
        specialty:
          prescriberData.especialidade?.nome ||
          (data.specialtyId ? data.specialtyId.toString() : undefined),
        // Inclui outros campos que possam vir na resposta
        ...Object.fromEntries(
          Object.entries(prescriberData).filter(
            ([key]) =>
              ![
                'external_id',
                'nome',
                'sobrenome',
                'email',
                'cpf',
                'telefone',
                'data_nascimento',
                'sexo',
                'board',
                'cidade',
                'especialidade',
              ].includes(key),
          ),
        ),
      }

      return {
        success: true,
        memedId: memedId?.toString(),
        prescriberToken,
        prescriber,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao cadastrar médico',
      }
    }
  }

  /**
   * Valida CRM tentando buscar o usuário na Memed
   *
   * Usa o formato registro+UF (ex: 12345SP) para buscar o usuário
   * Se encontrar, o CRM é válido
   */
  async validateCrm(
    data: ValidateCrmData,
  ): Promise<MemedCrmValidationResponse> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        return {
          valid: false,
          error: 'Credenciais Memed não configuradas',
        }
      }

      // Formato: registro+UF (ex: 12345SP)
      const cleanCrm = data.crm.replace(/\D/g, '')
      const identifier = `${cleanCrm}${data.crmState.toUpperCase()}`

      const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios/${encodeURIComponent(identifier)}?${this.getAuthQueryString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      const responseText = await response.text()

      if (response.ok) {
        const result = JSON.parse(responseText)
        const userData = result.data?.attributes || result.data || result
        const memedId = result.data?.id || result.id || userData.id

        return {
          valid: true,
          memedId: memedId?.toString(),
          doctor: {
            name: userData.nome || userData.name,
            crm: cleanCrm,
            crmState: data.crmState.toUpperCase(),
            specialty: userData.especialidade || userData.specialty,
          },
        }
      }

      if (response.status === 404) {
        return {
          valid: false,
          error: 'CRM não encontrado na Memed',
        }
      }

      // Outros erros
      let errorMessage = 'Erro ao validar CRM'
      try {
        const errorData = JSON.parse(responseText)
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage =
            errorData.errors[0]?.detail ||
            errorData.errors[0]?.title ||
            errorMessage
        }
      } catch {
        errorMessage = `Erro ${response.status}: ${response.statusText}`
      }

      return {
        valid: false,
        error: errorMessage,
      }
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao validar CRM',
      }
    }
  }

  /**
   * Busca o memedId de um médico usando múltiplas estratégias
   * Tenta buscar por: CRM+UF, external_id, CPF (nesta ordem)
   *
   * @param options - Opções para buscar o médico
   * @returns memedId se encontrado, null caso contrário
   */
  async getDoctorMemedId(options: {
    crm?: string
    crmState?: string
    externalId?: string
    cpf?: string
  }): Promise<string | null> {
    try {
      // Estratégia 1: Buscar por CRM+UF
      if (options.crm && options.crmState) {
        const cleanCrm = options.crm.replace(/\D/g, '')
        const identifier = `${cleanCrm}${options.crmState.toUpperCase()}`
        const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios/${encodeURIComponent(identifier)}?${this.getAuthQueryString()}`

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/vnd.api+json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          })

          if (response.ok) {
            const result = await response.json()
            const memedId =
              result.data?.id || result.id || result.data?.attributes?.id

            if (memedId) {
              return memedId.toString()
            }
          }
        } catch {
          // Continua para próxima estratégia
        }
      }

      // Estratégia 2: Buscar por external_id
      if (options.externalId) {
        const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios/${encodeURIComponent(options.externalId)}?${this.getAuthQueryString()}`

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/vnd.api+json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          })

          if (response.ok) {
            const result = await response.json()
            const memedId =
              result.data?.id || result.id || result.data?.attributes?.id

            if (memedId) {
              return memedId.toString()
            }
          }
        } catch {
          // Continua para próxima estratégia
        }
      }

      // Estratégia 3: Buscar por CPF
      if (options.cpf) {
        const cleanCpf = options.cpf.replace(/\D/g, '')
        const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios/${encodeURIComponent(cleanCpf)}?${this.getAuthQueryString()}`

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/vnd.api+json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          })

          if (response.ok) {
            const result = await response.json()
            const memedId =
              result.data?.id || result.id || result.data?.attributes?.id

            if (memedId) {
              return memedId.toString()
            }
          }
        } catch {
          // Continua para próxima estratégia
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Verifica se um médico foi cadastrado na Memed usando external_id
   *
   * GET /v1/sinapse-prescricao/usuarios/{external_id}?api-key=...&secret-key=...
   *
   * @param externalId - external_id usado no cadastro (geralmente o UID do Firebase)
   * @returns Objeto indicando se o médico foi encontrado e seus dados
   */
  async checkDoctorExists(
    externalId: string,
  ): Promise<CheckDoctorExistsResponse> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        return {
          exists: false,
          error: 'Credenciais Memed não configuradas',
        }
      }

      const url = `${this.config.baseUrl}/v1/sinapse-prescricao/usuarios/${encodeURIComponent(externalId)}?${this.getAuthQueryString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      const responseText = await response.text()

      if (response.ok) {
        const result = JSON.parse(responseText)
        const userData = result.data?.attributes || result.data || result
        const memedId = result.data?.id || result.id || userData.id

        return {
          exists: true,
          memedId: memedId?.toString(),
          doctor: {
            name: userData.nome || userData.name,
            email: userData.email,
            crm: userData.board?.board_number,
            crmState: userData.board?.board_state,
          },
        }
      }

      if (response.status === 404) {
        return {
          exists: false,
          error: 'Médico não encontrado na Memed',
        }
      }

      // Outros erros
      let errorMessage = 'Erro ao verificar médico na Memed'
      try {
        const errorData = JSON.parse(responseText)
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage =
            errorData.errors[0]?.detail ||
            errorData.errors[0]?.title ||
            errorMessage
        }
      } catch {
        errorMessage = `Erro ${response.status}: ${response.statusText}`
      }

      return {
        exists: false,
        error: errorMessage,
      }
    } catch (error) {
      return {
        exists: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao verificar médico',
      }
    }
  }

  /**
   * Busca uma prescrição específica pelo ID usando token do prescritor
   *
   * GET /v1/prescricoes/{ID_PRESCRICAO}?token=user_token
   *
   * Conforme documentação: https://doc.memed.com.br/docs/backend/prescricao
   *
   * @param prescriptionId - ID da prescrição na Memed
   * @param prescriberToken - Token do prescritor (obrigatório)
   * @returns Dados da prescrição incluindo medicamentos e exames
   */
  async getPrescription(
    prescriptionId: string,
    prescriberToken?: string,
  ): Promise<GetPrescriptionResponse> {
    try {
      // Se não tiver token, tenta usar api-key/secret como fallback
      if (!prescriberToken) {
        if (!this.config.apiKey || !this.config.apiSecret) {
          return {
            success: false,
            error: 'Token do prescritor ou credenciais Memed não configuradas',
          }
        }

        // Fallback: usar api-key/secret
        const url = `${this.config.baseUrl}/v1/sinapse-prescricao/prescricoes/${encodeURIComponent(prescriptionId)}?structuredDocuments=true&${this.getAuthQueryString()}`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        const responseText = await response.text()

        if (!response.ok) {
          return {
            success: false,
            error: `Erro ${response.status}: ${response.statusText}`,
          }
        }

        const result = JSON.parse(responseText)
        const prescriptionData =
          result.data?.attributes || result.data || result

        const fullPrescription: MemedPrescription = {
          id: result.data?.id || prescriptionId,
          medicamentos: prescriptionData.medicamentos || [],
          ...prescriptionData,
        }

        // Filtrar apenas exames e medicamentos
        const exames = extractExamsFromPrescription(fullPrescription)
        const medicamentos =
          extractMedicationsFromPrescription(fullPrescription)

        const prescription: MemedPrescription = {
          id: fullPrescription.id,
          exames,
          medicamentos,
          // Manter campos essenciais para referência
          created_at: fullPrescription.created_at,
          link_receita: fullPrescription.link_receita,
          pdf_url: fullPrescription.pdf_url,
        }

        return {
          success: true,
          prescription,
        }
      }

      // Método correto: usar token do prescritor
      const url = `${this.config.baseUrl}/v1/prescricoes/${encodeURIComponent(prescriptionId)}?token=${encodeURIComponent(prescriberToken)}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = 'Erro ao buscar prescrição'
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage =
              errorData.errors[0]?.detail ||
              errorData.errors[0]?.title ||
              errorMessage
          }
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }

        return {
          success: false,
          error: errorMessage,
        }
      }

      const result = JSON.parse(responseText)
      const prescriptionData = result.data?.attributes || result.data || result

      const fullPrescription: MemedPrescription = {
        id: result.data?.id || prescriptionId,
        medicamentos: prescriptionData.medicamentos || [],
        ...prescriptionData,
      }

      // Filtrar apenas exames e medicamentos
      const exames = extractExamsFromPrescription(fullPrescription)
      const medicamentos = extractMedicationsFromPrescription(fullPrescription)

      const prescription: MemedPrescription = {
        id: fullPrescription.id,
        exames,
        medicamentos,
        // Manter campos essenciais para referência
        created_at: fullPrescription.created_at,
        link_receita: fullPrescription.link_receita,
        pdf_url: fullPrescription.pdf_url,
      }

      return {
        success: true,
        prescription,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao buscar prescrição',
      }
    }
  }

  /**
   * Busca a última prescrição de um paciente usando o external_id
   *
   * Esta função tenta buscar prescrições do paciente e retorna a mais recente.
   * Como a API da Memed pode não ter um endpoint direto para isso, esta é uma
   * implementação que pode precisar ser ajustada conforme a documentação real da API.
   *
   * @param patientExternalId - external_id do paciente (geralmente o ID do Firestore)
   * @returns Última prescrição do paciente ou null se não encontrada
   */
  async getPatientLastPrescription(
    patientExternalId: string,
  ): Promise<GetPrescriptionResponse> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        return {
          success: false,
          error: 'Credenciais Memed não configuradas',
        }
      }

      // Nota: A API da Memed pode ter um endpoint específico para buscar prescrições por paciente
      // Este é um placeholder que pode precisar ser ajustado conforme a documentação real
      // Uma alternativa é usar o comando do MdHub se disponível no frontend
      const url = `${this.config.baseUrl}/v1/sinapse-prescricao/prescricoes?paciente_external_id=${encodeURIComponent(patientExternalId)}&${this.getAuthQueryString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      const responseText = await response.text()

      if (!response.ok) {
        // Se o endpoint não existir, retornar erro informativo
        if (response.status === 404) {
          return {
            success: false,
            error: 'Endpoint de prescrições por paciente não disponível',
          }
        }

        let errorMessage = 'Erro ao buscar prescrições do paciente'
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage =
              errorData.errors[0]?.detail ||
              errorData.errors[0]?.title ||
              errorMessage
          }
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }

        return {
          success: false,
          error: errorMessage,
        }
      }

      const result = JSON.parse(responseText)
      const prescriptions = result.data || []

      if (!prescriptions || prescriptions.length === 0) {
        return {
          success: false,
          error: 'Nenhuma prescrição encontrada para o paciente',
        }
      }

      // Ordenar por data de criação (mais recente primeiro) e pegar a primeira
      const sortedPrescriptions = prescriptions.sort(
        (a: MemedPrescription, b: MemedPrescription) => {
          const dateA = a.created_at || a.createdAt || ''
          const dateB = b.created_at || b.createdAt || ''
          return String(dateB).localeCompare(String(dateA))
        },
      )

      const lastPrescription = sortedPrescriptions[0]
      const prescriptionData = lastPrescription.attributes || lastPrescription

      const fullPrescription: MemedPrescription = {
        id: lastPrescription.id || lastPrescription.attributes?.id,
        medicamentos: prescriptionData.medicamentos || [],
        ...prescriptionData,
      }

      // Filtrar apenas exames e medicamentos
      const exames = extractExamsFromPrescription(fullPrescription)
      const medicamentos = extractMedicationsFromPrescription(fullPrescription)

      const prescription: MemedPrescription = {
        id: fullPrescription.id,
        exames,
        medicamentos,
        // Manter campos essenciais para referência
        created_at: fullPrescription.created_at,
        link_receita: fullPrescription.link_receita,
        pdf_url: fullPrescription.pdf_url,
      }

      return {
        success: true,
        prescription,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao buscar prescrição',
      }
    }
  }

  /**
   * Busca o histórico de prescrições de um prescritor
   *
   * GET /v1/sinapse-prescricao/prescricoes?token={prescritor_token}
   *
   * @param prescriberToken - Token do prescritor
   * @param limit - Número máximo de prescrições a retornar (opcional)
   * @returns Lista de prescrições do prescritor
   */
  async getPrescriberPrescriptions(
    prescriberToken: string,
    limit?: number,
  ): Promise<GetPrescriptionsListResponse> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        return {
          success: false,
          error: 'Credenciais Memed não configuradas',
        }
      }

      if (!prescriberToken) {
        return {
          success: false,
          error: 'Token do prescritor é obrigatório',
        }
      }

      let url = `${this.config.baseUrl}/v1/sinapse-prescricao/prescricoes?token=${encodeURIComponent(prescriberToken)}&${this.getAuthQueryString()}`

      if (limit) {
        url += `&limit=${limit}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = 'Erro ao buscar histórico de prescrições'
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage =
              errorData.errors[0]?.detail ||
              errorData.errors[0]?.title ||
              errorMessage
          }
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }

        return {
          success: false,
          error: errorMessage,
        }
      }

      const result = JSON.parse(responseText)
      const prescriptionsData = result.data || []

      const prescriptions: MemedPrescription[] = prescriptionsData.map(
        (item: {
          id?: string
          attributes?: MemedPrescription
          [key: string]: unknown
        }) => {
          const prescriptionData = item.attributes || item
          const fullPrescription: MemedPrescription = {
            id: item.id || prescriptionData.id,
            medicamentos: prescriptionData.medicamentos || [],
            exames: prescriptionData.exames || [],
            procedimentos: prescriptionData.procedimentos || [],
            ...prescriptionData,
          } as MemedPrescription

          // Filtrar apenas exames e medicamentos
          const exames = extractExamsFromPrescription(fullPrescription)
          const medicamentos =
            extractMedicationsFromPrescription(fullPrescription)

          return {
            id: fullPrescription.id,
            exames,
            medicamentos,
            // Manter campos essenciais para referência
            created_at: fullPrescription.created_at,
            link_receita: fullPrescription.link_receita,
            pdf_url: fullPrescription.pdf_url,
          } as MemedPrescription
        },
      )

      return {
        success: true,
        prescriptions,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao buscar histórico',
      }
    }
  }
}

export const memedService = new MemedService()
