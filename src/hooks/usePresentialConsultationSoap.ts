import { useEffect, useState, useCallback } from 'react'

import { getConsultationSoap } from '@/services/consultation'
import { updateConsultationSoapField } from '@/services/consultation-mutations'
import { SoapData } from '@/types/entities/consultation'

type SoapField = keyof SoapData

interface UsePresentialConsultationSoapOptions {
  consultationId: string
  enabled?: boolean
}

interface UsePresentialConsultationSoapReturn {
  soapData: SoapData
  loading: boolean
  error: string | null

  editingFields: Record<SoapField, boolean>

  startEditing: (field: SoapField) => void
  saveField: (field: SoapField, value: string) => Promise<void>
  cancelEditing: (field: SoapField) => void

  updateLocalData: (field: SoapField, value: string) => void
}

/**
 * Hook para gerenciar dados SOAP em uma consulta presencial
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
 * } = usePresentialConsultationSoap({ consultationId: 'abc123' })
 *
 * // Iniciar edição
 * startEditing('subjective')
 *
 * // Salvar campo
 * await saveField('subjective', 'Novo valor')
 * ```
 */
export function usePresentialConsultationSoap({
  consultationId,
  enabled = true,
}: UsePresentialConsultationSoapOptions): UsePresentialConsultationSoapReturn {
  const [soapData, setSoapData] = useState<SoapData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [originalData, setOriginalData] = useState<SoapData>({
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

  useEffect(() => {
    if (!enabled || !consultationId) {
      setLoading(false)
      return
    }

    const loadSoapData = async () => {
      setLoading(true)
      setError(null)

      const result = await getConsultationSoap(consultationId)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.data) {
        setSoapData(result.data)
        setOriginalData(result.data)
      }

      setLoading(false)
    }

    loadSoapData()
  }, [consultationId, enabled])

  const startEditing = useCallback(
    (field: SoapField) => {
      setOriginalData((prev) => ({
        ...prev,
        [field]: soapData[field] || '',
      }))
      setEditingFields((prev) => ({
        ...prev,
        [field]: true,
      }))
    },
    [soapData],
  )

  const cancelEditing = useCallback(
    (field: SoapField) => {
      setSoapData((prev) => ({
        ...prev,
        [field]: originalData[field] || '',
      }))
      setEditingFields((prev) => ({
        ...prev,
        [field]: false,
      }))
    },
    [originalData],
  )

  const updateLocalData = useCallback((field: SoapField, value: string) => {
    setSoapData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const saveField = useCallback(
    async (field: SoapField, value: string) => {
      if (!consultationId) {
        setError('ID da consulta não disponível')
        return
      }

      setError(null)

      setSoapData((prev) => ({
        ...prev,
        [field]: value,
      }))

      const result = await updateConsultationSoapField(
        consultationId,
        field,
        value,
      )

      if (result.error) {
        setError(result.error)
        return
      }

      setOriginalData((prev) => ({
        ...prev,
        [field]: value,
      }))

      setEditingFields((prev) => ({
        ...prev,
        [field]: false,
      }))
    },
    [consultationId],
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
