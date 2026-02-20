'use client'

import { useEffect, useRef, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { auth } from '@/config/firebase/firebase'
import { createMedication, findMedicationsByPatientId } from '@/services/medication'
import { memedService } from '@/services/memed'
import type { MemedMedication, MemedPrescription } from '@/services/memed/types'
import { getPatientById } from '@/services/patient'
import {
  MedicationCreationBy,
  MedicationStatus,
} from '@/types/entities/medication'
import type { PatientEntity } from '@/types/entities/user'
import { extractMedicationsFromPrescription } from '@/utils/extractMedicationsFromPrescription'
import {
  extractPrescriptionData,
  toMemedPrescription,
} from '@/utils/extractPrescriptionData'

// Interfaces para o MdHub e MdSinapsePrescricao da Memed conforme documentação
interface MemedModule {
  name: string
  [key: string]: unknown
}

interface MdHub {
  command: {
    send: (
      module: string,
      command: string,
      data?: Record<string, unknown>,
    ) => Promise<unknown>
  }
  module: {
    show: (module: string) => void
  }
  close: () => void
}

interface MdSinapsePrescricao {
  event: {
    add: (
      eventName: string,
      callback: (module: MemedModule) => void | Promise<void>,
    ) => void
  }
}

// Estender Window para incluir MdHub e MdSinapsePrescricao
declare global {
  interface Window {
    MdHub?: MdHub
    MdSinapsePrescricao?: MdSinapsePrescricao
  }
}

interface EmbeddedMemedPrescriptionProps {
  doctorId: string
  patientId: string
  onPrescriptionSuccess?: (medicationIds: string[]) => void
  onClose?: () => void
}

function isExamLikeItem(item: Record<string, unknown>): boolean {
  const id = typeof item.id === 'string' ? item.id : ''
  const tipo = typeof item.tipo === 'string' ? item.tipo.toLowerCase() : ''
  const hasExamCodes = Boolean(
    item.exames_sus_codigo ||
      item.exames_tuss_codigo ||
      item.codigo_sus ||
      item.codigo_tuss,
  )

  return tipo === 'exame' || id.startsWith('e') || hasExamCodes
}

function isMedicationLikeItem(item: Record<string, unknown>): boolean {
  return Boolean(
    item.tarja ||
      item.receituario ||
      item.forma_farmaceutica ||
      item.pharmaceutical_form ||
      item.apresentacao ||
      item.presentation ||
      item.via ||
      item.quantidade ||
      item.duracao ||
      item.frequencia ||
      item.unit ||
      item.dose,
  )
}

function normalizeMedicationFromAny(
  med: Record<string, unknown>,
): MemedMedication {
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
    receituario: med.receituario as string | undefined,
    tarja: med.tarja as string | undefined,
    unit: med.unit as string | undefined,
  }
}

export function EmbeddedMemedPrescription({
  doctorId,
  patientId,
  onPrescriptionSuccess,
  onClose,
}: EmbeddedMemedPrescriptionProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prescriberToken, setPrescriberToken] = useState<string | null>(null)
  const [patientData, setPatientData] = useState<PatientEntity | null>(null)
  const scriptLoadedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const prescriptionWasCreatedRef = useRef(false)
  const processedPrescriptionIdsRef = useRef<Set<string>>(new Set())
  const processedUnknownPrescriptionRef = useRef(false)
  const processingPrescriptionIdRef = useRef<string | null>(null)
  const isProcessingRef = useRef(false)

  // Obter token do prescritor e dados do paciente quando o componente montar
  useEffect(() => {
    if (doctorId) {
      const fetchData = async () => {
        try {
          setIsLoading(true)
          setError(null)

          // Tenta obter o Firebase ID Token do usuário atual primeiro
          let firebaseIdToken: string | null = null
          const currentUser = auth.currentUser

          if (currentUser) {
            try {
              firebaseIdToken = await currentUser.getIdToken()
            } catch {
              // Silently fail
            }
          }

          // Buscar token do prescritor
          const tokenResponse = await fetch('/api/memed/get-prescriber-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doctorId,
              firebaseIdToken,
            }),
          })

          const tokenResult = await tokenResponse.json()

          if (!tokenResponse.ok) {
            let errorMessage =
              tokenResult.error || 'Erro ao obter token do prescritor'

            if (tokenResult.doctorNotRegistered) {
              errorMessage =
                'Médico não cadastrado na Memed. É necessário cadastrar o médico na plataforma Memed antes de poder prescrever. Entre em contato com o suporte para realizar o cadastro.'
            }

            throw new Error(errorMessage)
          }

          setPrescriberToken(tokenResult.token)

          // Buscar dados do paciente
          if (patientId) {
            try {
              const patientResult = await getPatientById(patientId)
              if (patientResult.patient && !patientResult.error) {
                setPatientData(patientResult.patient)
              }
            } catch (err) {
              console.error('Erro ao buscar dados do paciente:', err)
            }
          }
        } catch (error) {
          console.error('Erro ao obter dados:', error)
          setError(
            error instanceof Error
              ? error.message
              : 'Erro ao obter token de autenticação',
          )
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [doctorId, patientId])

  // Carregar e inicializar script da Memed quando o token estiver disponível
  useEffect(() => {
    if (!prescriberToken) {
      return
    }

    const memedScriptUrl =
      process.env.NEXT_PUBLIC_MEMED_SCRIPT_URL ||
      'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'

    const existingScript = document.querySelector(
      `script[src="${memedScriptUrl}"]`,
    )

    // Função para processar prescrição criada - DEFINIDA ANTES DE SER USADA
    const handlePrescriptionCreated = async (eventData: unknown) => {
      // Bloquear processamento simultâneo globalmente
      if (isProcessingRef.current) {
        console.log('⏳ Já está processando uma prescrição, ignorando evento duplicado')
        return
      }

      setIsLoading(true)
      setError(null)
      isProcessingRef.current = true

      try {
        const eventPayload =
          typeof eventData === 'object' && eventData !== null
            ? (eventData as Record<string, unknown>)
            : null
        const eventPrescriptionId =
          (eventPayload?.prescriptionId as string | undefined) ||
          (eventPayload?.prescricaoId as string | undefined) ||
          (eventPayload?.id as string | undefined)

        if (
          eventPrescriptionId &&
          processedPrescriptionIdsRef.current.has(eventPrescriptionId)
        ) {
          console.log(
            '🔁 Prescrição já processada, ignorando:',
            eventPrescriptionId,
          )
          setIsLoading(false)
          isProcessingRef.current = false
          return
        }

        if (
          processingPrescriptionIdRef.current &&
          processingPrescriptionIdRef.current === eventPrescriptionId
        ) {
          console.log(
            '⏳ Prescrição em processamento, ignorando:',
            eventPrescriptionId,
          )
          setIsLoading(false)
          isProcessingRef.current = false
          return
        }

        if (!eventPrescriptionId && processedUnknownPrescriptionRef.current) {
          console.log(
            '🔁 Evento duplicado sem ID de prescrição, ignorando.',
          )
          setIsLoading(false)
          isProcessingRef.current = false
          return
        }

        processingPrescriptionIdRef.current = eventPrescriptionId || '__unknown__'

        console.log('📥 Evento de prescrição recebido:', eventData)
        console.log('📥 Tipo do evento:', typeof eventData)
        console.log(
          '📥 Estrutura do evento:',
          JSON.stringify(eventData, null, 2),
        )

        const extractedData = extractPrescriptionData(eventData)
        console.log('📋 Dados extraídos:', extractedData)
        console.log('📋 Medicamentos extraídos:', extractedData.medicamentos)

        let actualPatientId: string | undefined = patientId
        if (!actualPatientId && extractedData.paciente) {
          const pacienteData = extractedData.paciente as {
            external_id?: string
            id?: string | number
          }
          actualPatientId =
            pacienteData.external_id?.toString() ||
            pacienteData.id?.toString() ||
            undefined
        }

        if (!actualPatientId) {
          throw new Error('ID do paciente não disponível')
        }

        const finalPatientId: string = actualPatientId

        let currentPatientData = patientData
        if (!currentPatientData && finalPatientId) {
          try {
            console.log('🔍 Buscando dados do paciente:', finalPatientId)
            const patientResult = await getPatientById(finalPatientId)
            if (patientResult.patient && !patientResult.error) {
              currentPatientData = patientResult.patient
              console.log('✅ Paciente encontrado:', currentPatientData.name)
            } else {
              console.warn('⚠️ Paciente não encontrado ou erro:', patientResult.error)
              throw new Error(
                `Paciente não encontrado no sistema: ${patientResult.error || 'Sem informações'}`,
              )
            }
          } catch (err) {
            console.error('❌ Erro ao buscar paciente:', err)
            throw new Error(
              `Não foi possível verificar o paciente antes de criar medicamentos: ${err instanceof Error ? err.message : String(err)}`,
            )
          }
        }

        // Validação adicional: garantir que temos os dados do paciente
        if (!currentPatientData) {
          throw new Error(
            'Dados do paciente não estão disponíveis. Certifique-se de que o paciente foi criado corretamente no sistema.',
          )
        }

        console.log('✅ Dados do paciente validados, prosseguindo com criação de medicamentos')

        let prescriptionResult: {
          success: boolean
          prescription?: MemedPrescription
          error?: string
        } = {
          success: false,
          error: 'Nenhuma prescrição encontrada',
        }

        // Se temos medicamentos extraídos diretamente do evento, usar eles
        if (extractedData.medicamentos.length > 0) {
          console.log(
            '✅ Medicamentos encontrados diretamente no evento extraído!',
          )
          prescriptionResult = {
            success: true,
            prescription: {
              ...toMemedPrescription(extractedData),
              _rawEventData: extractedData.rawData,
              // Garantir que os medicamentos estejam no lugar certo
              medicamentos: extractedData.medicamentos,
            } as MemedPrescription,
          }
        } else {
          const hasOtherData =
            extractedData.exames.length > 0 ||
            extractedData.procedimentos.length > 0 ||
            extractedData.prescriptionId

          if (hasOtherData) {
            prescriptionResult = {
              success: true,
              prescription: {
                ...toMemedPrescription(extractedData),
                _rawEventData: extractedData.rawData,
              } as MemedPrescription,
            }
          } else if (extractedData.prescriptionId) {
            try {
              const url = `/api/memed/get-prescription?prescriptionId=${encodeURIComponent(extractedData.prescriptionId)}${prescriberToken ? `&prescriberToken=${encodeURIComponent(prescriberToken)}` : ''}`

              const response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erro ao buscar prescrição')
              }

              const result = await response.json()
              prescriptionResult = {
                success: result.success,
                prescription: result.prescription,
                error: result.error,
              }
            } catch (fetchError) {
              prescriptionResult = {
                success: false,
                error:
                  fetchError instanceof Error
                    ? fetchError.message
                    : 'Erro ao buscar prescrição',
              }
            }
          } else {
            // Tentar usar comando do MdHub para obter prescrição atual
            if (window.MdHub?.command) {
              try {
                console.log('🔍 Tentando obter prescrição via MdHub.command...')
                const currentPrescription = await window.MdHub.command.send(
                  'plataforma.prescricao',
                  'getPrescricao',
                )

                console.log(
                  '📋 Prescrição obtida via MdHub:',
                  currentPrescription,
                )

                if (
                  currentPrescription &&
                  typeof currentPrescription === 'object'
                ) {
                  const prescriptionData = currentPrescription as {
                    id?: string
                    medicamentos?: Array<{
                      id: string
                      nome: string
                      posologia?: string
                      [key: string]: unknown
                    }>
                    [key: string]: unknown
                  }

                  prescriptionResult = {
                    success: true,
                    prescription: {
                      id: prescriptionData.id,
                      medicamentos: prescriptionData.medicamentos || [],
                      ...prescriptionData,
                    } as MemedPrescription,
                  }
                }
              } catch (hubError) {
                console.error(
                  '❌ Erro ao obter prescrição via MdHub:',
                  hubError,
                )
              }
            }

            // Fallback: buscar última prescrição do paciente via API
            if (!prescriptionResult || !prescriptionResult.success) {
              try {
                const patientIdForSearch = currentPatientData?.id || patientId
                console.log(
                  '🔍 Buscando última prescrição do paciente:',
                  patientIdForSearch,
                )

                // Aguardar um pouco para garantir que a prescrição foi salva no backend da Memed
                await new Promise((resolve) => setTimeout(resolve, 2000))

                prescriptionResult =
                  await memedService.getPatientLastPrescription(
                    patientIdForSearch,
                  )
                console.log('📋 Resultado da busca:', prescriptionResult)
              } catch (apiError) {
                console.error('❌ Erro ao buscar última prescrição:', apiError)
              }
            }
          }
        }

        // Se ainda não temos medicamentos, tentar buscar novamente após delay
        if (prescriptionResult.success && prescriptionResult.prescription) {
          const initialMedications = extractMedicationsFromPrescription(
            prescriptionResult.prescription,
          )

          if (initialMedications.length === 0) {
            console.log('⏳ Aguardando processamento da prescrição...')
            await new Promise((resolve) => setTimeout(resolve, 3000))

            // Tentar buscar novamente
            if (prescriptionResult.prescription.id) {
              try {
                const url = `/api/memed/get-prescription?prescriptionId=${encodeURIComponent(prescriptionResult.prescription.id)}${prescriberToken ? `&prescriberToken=${encodeURIComponent(prescriberToken)}` : ''}`
                const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })

                if (response.ok) {
                  const result = await response.json()
                  if (result.success && result.prescription) {
                    console.log(
                      '📋 Prescrição atualizada após delay:',
                      result.prescription,
                    )
                    prescriptionResult.prescription = result.prescription
                  }
                }
              } catch (retryError) {
                console.error(
                  '❌ Erro ao buscar prescrição após delay:',
                  retryError,
                )
              }
            }
          }
        }

        if (!prescriptionResult.success || !prescriptionResult.prescription) {
          throw new Error(
            prescriptionResult.error ||
              'Não foi possível obter a prescrição criada',
          )
        }

        // Extrair medicamentos da prescrição
        let medications = extractMedicationsFromPrescription(
          prescriptionResult.prescription,
        )

        console.log('📋 Medicamentos extraídos da prescrição:', medications)
        console.log('📋 Prescrição completa:', prescriptionResult.prescription)

        // Obter ID e URL da prescrição Memed
        // Tentar múltiplas fontes para o ID
        const memedPrescriptionId =
          prescriptionResult.prescription.id ||
          (
            prescriptionResult.prescription.data as {
              attributes?: { prescriptionUuid?: string }
            }
          )?.attributes?.prescriptionUuid ||
          (prescriptionResult.prescription as { prescriptionUuid?: string })
            ?.prescriptionUuid
        const memedPrescriptionUrl = memedPrescriptionId
          ? `https://prescricao.memed.com.br/prescricoes/${memedPrescriptionId}`
          : undefined

        console.log('🆔 ID da prescrição Memed:', memedPrescriptionId)

        if (memedPrescriptionId) {
          processedPrescriptionIdsRef.current.add(memedPrescriptionId)
        } else if (eventPrescriptionId) {
          processedPrescriptionIdsRef.current.add(eventPrescriptionId)
        } else {
          processedUnknownPrescriptionRef.current = true
        }

        // Buscar medicamentos existentes para evitar duplicação
        const existingMedicationKeys = new Set<string>()
        const existingMedicationNames = new Set<string>()
        try {
          console.log('🔍 Buscando medicamentos existentes do paciente...')
          const existingMedications =
            await findMedicationsByPatientId(finalPatientId)
          console.log(
            `📋 Encontrados ${existingMedications.length} medicamentos existentes`,
          )

          existingMedications.forEach((medication) => {
            // Chave por memedId + name (quando disponível)
            if (medication.memedId) {
              const key = `${medication.memedId}:${medication.name.toLowerCase()}`
              existingMedicationKeys.add(key)
              console.log('🔑 Chave existente (memedId):', key)
            }
            // Também guardar apenas o nome para fallback
            existingMedicationNames.add(medication.name.toLowerCase())
          })

          console.log(
            `✅ Total de chaves mapeadas: ${existingMedicationKeys.size} com memedId, ${existingMedicationNames.size} nomes únicos`,
          )
        } catch (existingError) {
          console.error(
            '❌ Erro ao buscar medicamentos existentes:',
            existingError,
          )
        }

        // Fallback: se não encontrou medicamentos, tentar acessar em diferentes estruturas
        if (medications.length === 0) {
          console.log(
            '⚠️ Tentando fallback: buscando medicamentos em diferentes estruturas',
          )

          // Tentar 1: prescription.medicamentos (nível raiz)
          if (
            prescriptionResult.prescription.medicamentos &&
            Array.isArray(prescriptionResult.prescription.medicamentos)
          ) {
            const directMedications =
              prescriptionResult.prescription.medicamentos
            medications = directMedications
              .filter((med: unknown) => {
                if (typeof med === 'object' && med !== null) {
                  const medObj = med as Record<string, unknown>
                  return isMedicationLikeItem(medObj) || !isExamLikeItem(medObj)
                }
                return false
              })
              .map((med) => normalizeMedicationFromAny(med as Record<string, unknown>))
              .filter((med) => med.nome || med.id)
            console.log(
              '📋 Medicamentos do fallback (nível raiz):',
              medications,
            )
          }

          // Tentar 1.1: prescription.exames (quando a API devolve medicamentos como exames)
          if (
            medications.length === 0 &&
            prescriptionResult.prescription.exames &&
            Array.isArray(prescriptionResult.prescription.exames)
          ) {
            const examsAsMeds = prescriptionResult.prescription.exames
            medications = examsAsMeds
              .filter((med: unknown) => {
                if (typeof med === 'object' && med !== null) {
                  const medObj = med as Record<string, unknown>
                  return isMedicationLikeItem(medObj) || !isExamLikeItem(medObj)
                }
                return false
              })
              .map((med) => normalizeMedicationFromAny(med as Record<string, unknown>))
              .filter((med) => med.nome || med.id)
            console.log(
              '📋 Medicamentos do fallback (exames):',
              medications,
            )
          }

          // Tentar 2: data.attributes.medicamentos (estrutura aninhada)
          if (
            medications.length === 0 &&
            prescriptionResult.prescription.data
          ) {
            const data = prescriptionResult.prescription.data as {
              attributes?: {
                medicamentos?: unknown[]
              }
            }
            if (
              data.attributes?.medicamentos &&
              Array.isArray(data.attributes.medicamentos)
            ) {
              medications = data.attributes.medicamentos
                .filter((med: unknown) => {
                  if (typeof med === 'object' && med !== null) {
                    const medObj = med as Record<string, unknown>
                    return isMedicationLikeItem(medObj) || !isExamLikeItem(medObj)
                  }
                  return false
                })
                .map((med) =>
                  normalizeMedicationFromAny(med as Record<string, unknown>),
                )
                .filter((med) => med.nome || med.id)
              console.log(
                '📋 Medicamentos do fallback (data.attributes):',
                medications,
              )
            }
          }

          // Tentar 3: data.medicamentos (sem attributes)
          if (
            medications.length === 0 &&
            prescriptionResult.prescription.data
          ) {
            const data = prescriptionResult.prescription.data as {
              medicamentos?: unknown[]
            }
            if (data.medicamentos && Array.isArray(data.medicamentos)) {
              medications = data.medicamentos
                .filter((med: unknown) => {
                  if (typeof med === 'object' && med !== null) {
                    const medObj = med as Record<string, unknown>
                    return isMedicationLikeItem(medObj) || !isExamLikeItem(medObj)
                  }
                  return false
                })
                .map((med) =>
                  normalizeMedicationFromAny(med as Record<string, unknown>),
                )
                .filter((med) => med.nome || med.id)
              console.log('📋 Medicamentos do fallback (data):', medications)
            }
          }
        }

        // Criar medicamentos no Firestore
        const medicationIds: string[] = []
        const errors: Array<{ medication: string; error: unknown }> = []
        const createdMedicationKeys = new Set<string>()

        if (medications.length > 0) {
          console.log(`💊 Criando ${medications.length} medicamento(s)...`)
          console.log('💊 PatientId:', finalPatientId)

          for (const memedMed of medications) {
            try {
              console.log('💊 Processando medicamento:', memedMed.nome)

              // Validar que temos o ID do paciente
              if (!finalPatientId) {
                throw new Error('ID do paciente não está disponível')
              }

              // Parse posologia para extrair informações
              const posologia = memedMed.posologia || ''
              const observation = memedMed.instrucoes || posologia

              // Tentar extrair dose e unidade da apresentação ou posologia
              let concentration = 0
              let concentrationUnit = ''
              if (memedMed.apresentacao) {
                const match = memedMed.apresentacao.match(/(\d+)\s*(\w+)/)
                if (match) {
                  concentration = parseInt(match[1], 10)
                  concentrationUnit = match[2]
                }
              }

              // Extrair frequência da posologia
              let interval: number | undefined
              let intervalUnit: string | undefined
              if (posologia.toLowerCase().includes('a cada')) {
                const match = posologia.match(/a cada\s*(\d+)\s*(hora|horas)/i)
                if (match) {
                  interval = parseInt(match[1], 10)
                  intervalUnit = 'Horas'
                }
              }

              console.log('💊 Dados do medicamento a criar:', {
                patientId: finalPatientId,
                name: memedMed.nome,
                memedId: memedPrescriptionId,
              })

              // Criar chave de deduplicação: memedId + nome (em lowercase)
              const medicationName = (
                memedMed.nome ||
                memedMed.id ||
                ''
              ).toLowerCase()
              const prescriptionIdToUse =
                memedPrescriptionId || eventPrescriptionId || 'unknown'
              const medicationKey = `${prescriptionIdToUse}:${medicationName}`

              // Verificar duplicação por chave completa (memedId + nome)
              if (
                existingMedicationKeys.has(medicationKey) ||
                createdMedicationKeys.has(medicationKey)
              ) {
                console.log(
                  '🔁 Medicamento já existe com mesma chave (memedId+nome), ignorando:',
                  medicationKey,
                )
                continue
              }

              // Verificar duplicação por nome apenas (fallback se não tiver memedId)
              if (
                !memedPrescriptionId &&
                existingMedicationNames.has(medicationName)
              ) {
                console.log(
                  '🔁 Medicamento com mesmo nome já existe (sem memedId), ignorando:',
                  medicationName,
                )
                continue
              }

              // Marcar como "em criação" para evitar duplicatas no mesmo loop
              createdMedicationKeys.add(medicationKey)

              const medication = await createMedication(finalPatientId, {
                name: memedMed.nome || '',
                image: '',
                usageClassification: 'Sintomático',
                pharmaceuticalForm: memedMed.forma_farmaceutica || '',
                observation,
                concentration,
                concentrationUnit,
                stock: 0,
                stockUnit: '',
                dose: 1,
                doseUnit: memedMed.unit || '',
                interval,
                intervalUnit,
                startDate: new Date().toISOString(),
                status: MedicationStatus.ACTIVE,
                createdBy: MedicationCreationBy.DOCTOR,
                memedId: memedPrescriptionId,
                memedUrl: memedPrescriptionUrl,
              })

              console.log('✅ Medicamento criado com sucesso:', medication.id)
              console.log('✅ Path: users/' + finalPatientId + '/medications/' + medication.id)
              medicationIds.push(medication.id)
            } catch (medError) {
              console.error('❌ Erro ao criar medicamento:', medError)
              console.error('❌ Tipo do erro:', typeof medError)
              console.error('❌ Stack trace:', (medError as Error)?.stack)
              console.error('❌ Dados do medicamento:', memedMed)
              console.error('❌ PatientId usado:', finalPatientId)

              // Armazenar erro para reportar ao usuário
              errors.push({
                medication: memedMed.nome || 'Desconhecido',
                error: medError,
              })
            }
          }
        } else {
          console.warn('⚠️ Nenhum medicamento encontrado na prescrição')
          console.warn(
            '⚠️ Dados da prescrição:',
            prescriptionResult.prescription,
          )
        }

        // Se houve erros, reportar ao usuário
        if (errors.length > 0) {
          console.error('❌ Erros ao criar medicamentos:', errors)
          const errorMessages = errors
            .map((e) => {
              const errorMsg =
                e.error instanceof Error ? e.error.message : String(e.error)
              return `${e.medication}: ${errorMsg}`
            })
            .join('\n')

          throw new Error(
            `Falha ao criar ${errors.length} medicamento(s):\n${errorMessages}`,
          )
        }

        console.log(`✅ Total de medicamentos criados: ${medicationIds.length}`)
        setIsLoading(false)

        // Sempre chamar onPrescriptionSuccess, mesmo se não houver medicamentos
        // para garantir que a query seja invalidada
        onPrescriptionSuccess?.(medicationIds)
      } catch (error) {
        console.error('❌ Erro ao processar prescrição:', error)
        setError(
          error instanceof Error
            ? error.message
            : 'Erro ao processar prescrição',
        )
        setIsLoading(false)
      } finally {
        processingPrescriptionIdRef.current = null
        isProcessingRef.current = false
      }
    }

    const prescricaoMemed = () => {
      if (!window.MdSinapsePrescricao) {
        console.error('❌ MdSinapsePrescricao não está disponível')
        setError('Erro ao inicializar prescrição')
        setIsLoading(false)
        return
      }

      // Registrar listeners para prescrição criada
      try {
        window.MdSinapsePrescricao.event.add(
          'prescricaoSalva',
          async (data: unknown) => {
            prescriptionWasCreatedRef.current = true
            await handlePrescriptionCreated(data)
          },
        )
      } catch (err) {
        console.error('Erro ao registrar prescricaoSalva:', err)
      }

      try {
        window.MdSinapsePrescricao.event.add(
          'prescricao.criada',
          async (data: unknown) => {
            prescriptionWasCreatedRef.current = true
            await handlePrescriptionCreated(data)
          },
        )
      } catch (err) {
        console.error('Erro ao registrar prescricao.criada:', err)
      }

      try {
        window.MdSinapsePrescricao.event.add(
          'prescription.created',
          async (data: unknown) => {
            prescriptionWasCreatedRef.current = true
            await handlePrescriptionCreated(data)
          },
        )
      } catch (err) {
        console.error('Erro ao registrar prescription.created:', err)
      }

      // Listener para fechar quando o iframe da Memed for fechado
      try {
        window.MdSinapsePrescricao.event.add('core:moduleClose', () => {
          onClose?.()
        })
      } catch (err) {
        console.error('Erro ao registrar core:moduleClose:', err)
      }

      // Adiciona listener para o evento core:moduleInit
      window.MdSinapsePrescricao.event.add(
        'core:moduleInit',
        async (module: MemedModule) => {
          try {
            if (module.name === 'plataforma.prescricao') {
              // Se temos dados do paciente, enviar comando setPaciente
              if (patientData) {
                const cleanPhone =
                  patientData.phoneNumber?.replace(/\D/g, '') || ''
                const cleanCpf = patientData.cpf?.replace(/\D/g, '') || ''

                let enderecoCompleto = ''
                if (patientData.address) {
                  const parts = [
                    patientData.address,
                    patientData.number,
                    patientData.complement,
                    patientData.neighborhood,
                    patientData.city,
                    patientData.state,
                    patientData.cep ? `CEP ${patientData.cep}` : '',
                  ].filter(Boolean)
                  enderecoCompleto = parts.join(', ')
                }

                const pacienteData: {
                  idExterno: string
                  nome: string
                  telefone: string
                  cpf?: string
                  withoutCpf?: boolean
                  nome_social?: string
                  endereco?: string
                } = {
                  idExterno: patientData.id,
                  nome: patientData.name,
                  telefone: cleanPhone,
                }

                if (cleanCpf) {
                  pacienteData.cpf = cleanCpf
                } else {
                  pacienteData.withoutCpf = true
                }

                if (patientData.socialName) {
                  pacienteData.nome_social = patientData.socialName
                }
                if (enderecoCompleto) {
                  pacienteData.endereco = enderecoCompleto
                }

                if (window.MdHub?.command) {
                  await window.MdHub.command.send(
                    'plataforma.prescricao',
                    'setPaciente',
                    pacienteData,
                  )
                }
              }

              if (window.MdHub?.module) {
                window.MdHub.module.show('plataforma.prescricao')
              }

              setTimeout(() => {
                setIsLoading(false)
                scriptLoadedRef.current = true
              }, 1000)
            }
          } catch (error) {
            console.error('❌ Erro ao inicializar módulo Memed:', error)
            setError(
              error instanceof Error
                ? error.message
                : 'Erro ao inicializar prescrição',
            )
            setIsLoading(false)
          }
        },
      )
    }

    if (existingScript) {
      setTimeout(() => {
        if (window.MdSinapsePrescricao) {
          prescricaoMemed()
        } else {
          let attempts = 0
          const maxAttempts = 300
          const checkInterval = setInterval(() => {
            attempts++
            if (window.MdSinapsePrescricao) {
              clearInterval(checkInterval)
              prescricaoMemed()
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval)
              setError('Timeout ao carregar Memed. Por favor, tente novamente.')
              setIsLoading(false)
            }
          }, 100)
        }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.src = memedScriptUrl
    script.dataset.token = prescriberToken

    const scriptTimeout = setTimeout(() => {
      if (!scriptLoadedRef.current) {
        setError(
          'O servidor da Memed não respondeu em 30 segundos.\n' +
            'Por favor, verifique sua conexão e tente novamente.',
        )
        setIsLoading(false)
      }
    }, 30000)

    script.addEventListener('load', () => {
      clearTimeout(scriptTimeout)
      prescricaoMemed()
    })

    script.onerror = () => {
      clearTimeout(scriptTimeout)
      setError(
        'Não foi possível carregar o módulo da Memed.\n' +
          'Verifique sua conexão com a internet e tente novamente.',
      )
      setIsLoading(false)
    }

    document.body.appendChild(script)

    // Listener para eventos da Memed via postMessage
    const handleMemedMessage = async (event: MessageEvent) => {
      const eventType = event.data?.type || event.data?.event
      const eventName = event.data?.name

      if (eventType === 'memed.close' || eventName === 'close') {
        onClose?.()
        return
      }

      const isPrescriptionCreated =
        eventType === 'MEMED_PRESCRIPTION_CREATED' ||
        eventType === 'prescription.created' ||
        eventType === 'prescricao.criada' ||
        eventName === 'prescription.created' ||
        eventName === 'prescricao.criada' ||
        event.data?.prescriptionId ||
        event.data?.prescricaoId

      if (isPrescriptionCreated) {
        prescriptionWasCreatedRef.current = true
        await handlePrescriptionCreated(event.data)
      } else if (
        eventType === 'MEMED_PRESCRIPTION_ERROR' ||
        eventType === 'prescription.error'
      ) {
        const errorMessage =
          event.data?.message || event.data?.error || 'Erro ao criar prescrição'
        setError(errorMessage)
        setIsLoading(false)
      }
    }

    window.addEventListener('message', handleMemedMessage)

    return () => {
      window.removeEventListener('message', handleMemedMessage)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [
    prescriberToken,
    patientData,
    patientId,
    doctorId,
    onPrescriptionSuccess,
    onClose,
  ])

  return (
    <div className="relative h-[700px] w-full rounded-lg border border-gray-200 bg-white p-4">
      {isLoading && !error && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center bg-white bg-opacity-100"
          style={{ pointerEvents: 'none' }}
        >
          <LoadingComponent />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white p-4">
          <p className="mb-4 text-center text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              scriptLoadedRef.current = false
              setPrescriberToken(null)
            }}
            className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Container onde o script da Memed irá renderizar a interface */}
      <div
        ref={containerRef}
        id="memed-prescription-container"
        className="h-full w-full"
        style={{
          display: error ? 'none' : 'block',
          visibility: isLoading ? 'hidden' : 'visible',
          pointerEvents: isLoading ? 'none' : 'auto',
          zIndex: isLoading ? -1 : 10,
          position: 'relative',
        }}
      />
    </div>
  )
}
