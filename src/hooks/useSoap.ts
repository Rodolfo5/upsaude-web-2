/**
 * 🪝 HOOK DE GERENCIAMENTO SOAP
 *
 * Hook customizado para gerenciar o estado de edição e salvamento de dados SOAP
 * em videochamadas de teste.
 *
 * Funcionalidades:
 * - Carregamento inicial dos dados
 * - Controle de estado de edição por campo
 * - Funções para habilitar/desabilitar edição
 * - Salvamento de dados no Firestore
 */

import { useEffect, useState, useCallback } from 'react'

import {
  getSoapData,
  updateSoapField,
  type SoapData,
} from '@/services/testVideoCall'

type SoapField = keyof SoapData

interface UseSoapOptions {
  callId: string
  enabled?: boolean
}

interface UseSoapReturn {
  // Dados SOAP
  soapData: SoapData
  loading: boolean
  error: string | null

  // Estado de edição por campo
  editingFields: Record<SoapField, boolean>

  // Funções
  startEditing: (field: SoapField) => void
  saveField: (field: SoapField, value: string) => Promise<void>
  cancelEditing: (field: SoapField) => void

  // Atualizar dados locais (sem salvar)
  updateLocalData: (field: SoapField, value: string) => void
}

/**
 * Hook para gerenciar dados SOAP em uma videochamada
 *
 * @param options - Opções do hook
 * @returns Estado e funções para gerenciar SOAP
 *
 * @example
 * ```tsx
 * const {
 *   soapData,
 *   editingFields,
 *   startEditing,
 *   saveField
 * } = useSoap({ callId: 'abc123' })
 *
 * // Iniciar edição
 * startEditing('subjective')
 *
 * // Salvar campo
 * await saveField('subjective', 'Novo valor')
 * ```
 */
export function useSoap({
  callId,
  enabled = true,
}: UseSoapOptions): UseSoapReturn {
  const [soapData, setSoapData] = useState<SoapData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingFields, setEditingFields] = useState<
    Record<SoapField, boolean>
  >({
    subjective: false,
    objective: false,
    assessment: false,
    plan: false,
  })

  // Carregar dados iniciais
  useEffect(() => {
    if (!enabled || !callId) {
      setLoading(false)
      return
    }

    const loadSoapData = async () => {
      setLoading(true)
      setError(null)

      const result = await getSoapData(callId)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.data) {
        setSoapData(result.data)
      }

      setLoading(false)
    }

    loadSoapData()
  }, [callId, enabled])

  // Iniciar edição de um campo
  const startEditing = useCallback((field: SoapField) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: true,
    }))
  }, [])

  // Cancelar edição de um campo
  const cancelEditing = useCallback((field: SoapField) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: false,
    }))
  }, [])

  // Atualizar dados locais (sem salvar no Firestore)
  const updateLocalData = useCallback((field: SoapField, value: string) => {
    setSoapData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Salvar um campo específico
  const saveField = useCallback(
    async (field: SoapField, value: string) => {
      if (!callId) {
        setError('ID da chamada não disponível')
        return
      }

      setError(null)

      // Atualiza localmente primeiro para feedback imediato
      setSoapData((prev) => ({
        ...prev,
        [field]: value,
      }))

      const result = await updateSoapField(callId, field, value)

      if (result.error) {
        setError(result.error)
        // Reverter mudança local em caso de erro
        // (na prática, você pode querer manter o valor e mostrar um toast)
        return
      }

      // Desabilitar edição após salvar com sucesso
      setEditingFields((prev) => ({
        ...prev,
        [field]: false,
      }))
    },
    [callId],
  )

  return {
    soapData,
    loading,
    error,
    editingFields,
    startEditing,
    saveField,
    cancelEditing,
    updateLocalData,
  }
}
