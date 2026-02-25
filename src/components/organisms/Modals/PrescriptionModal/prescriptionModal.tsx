/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState } from 'react'

import LoadingComponent from '@/components/atoms/Loading/loading'
import { UsageClassificationWarningModal } from '@/components/organisms/Modals/UsageClassificationWarningModal/usageClassificationWarningModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { auth } from '@/config/firebase/firebase'
import { createExam } from '@/services/exam'
import {
  createMedication,
  findMedicationsByPatientId,
} from '@/services/medication'
import { memedService } from '@/services/memed'
import type { MemedMedication, MemedPrescription } from '@/services/memed/types'
import { sendNotification } from '@/services/notification/notification'
import { getPatientById, getPatientsByIds } from '@/services/patient'
import { createTimelinePatient } from '@/services/timelinePatient'
import {
  MedicationCreationBy,
  MedicationStatus,
} from '@/types/entities/medication'
import type { PatientEntity } from '@/types/entities/user'
import { extractExamsFromPrescription } from '@/utils/extractExamsFromPrescription'
import { extractMedicationsFromPrescription } from '@/utils/extractMedicationsFromPrescription'
import {
  extractDoctorDataFromPrescription,
  extractPrescriptionData,
  toMemedPrescription,
} from '@/utils/extractPrescriptionData'
import { classifyMemedItem } from '@/utils/memedItemClassification'

import { PrescriptionModalProps } from './types'

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

// Estender Window para incluir MdHub e MdSinapsePrescricao
declare global {
  interface Window {
    MdHub?: MdHub
    MdSinapsePrescricao?: MdSinapsePrescricao
  }
}

export function PrescriptionModal({
  isOpen,
  setIsOpen,
  doctorId,
  patientId,
  consultationId,
  onSuccess,
}: PrescriptionModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prescriberToken, setPrescriberToken] = useState<string | null>(null)
  const [patientData, setPatientData] = useState<PatientEntity | null>(null)
  const [warningQueue, setWarningQueue] = useState<string[]>([])
  const scriptLoadedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const processingExamsRef = useRef(false)
  const prescriptionWasCreatedRef = useRef(false)
  const processedPrescriptionIdsRef = useRef<Set<string>>(new Set())
  const processedUnknownPrescriptionRef = useRef(false)
  const processingPrescriptionIdRef = useRef<string | null>(null)
  const isProcessingRef = useRef(false)
  const createdMedicationsNamesRef = useRef<string[]>([])

  const createMedicationsFromPrescription = async (
    prescription: MemedPrescription,
    finalPatientId: string,
  ) => {
    const memedPrescriptionId =
      prescription.id ||
      (
        prescription.data as {
          attributes?: { prescriptionUuid?: string }
        }
      )?.attributes?.prescriptionUuid ||
      (prescription as { prescriptionUuid?: string })?.prescriptionUuid
    const memedPrescriptionUrl = memedPrescriptionId
      ? `https://prescricao.memed.com.br/prescricoes/${memedPrescriptionId}`
      : undefined

    let medications = extractMedicationsFromPrescription(prescription)
    const createdMedicationKeys = new Set<string>()
    const existingMedicationKeys = new Set<string>()
    const existingMedicationNames = new Set<string>()

    try {
      const existingMedications =
        await findMedicationsByPatientId(finalPatientId)
      existingMedications.forEach((medication) => {
        if (medication.memedId) {
          const key = `${medication.memedId}:${medication.name.toLowerCase()}`
          existingMedicationKeys.add(key)
        }
        existingMedicationNames.add(medication.name.toLowerCase())
      })
    } catch (existingError) {
      console.error('❌ Erro ao buscar medicamentos existentes:', existingError)
    }

    if (medications.length === 0) {
      const prescriptionData = prescription as {
        medicamentos?: unknown[]
        data?: {
          attributes?: {
            medicamentos?: unknown[]
          }
          medicamentos?: unknown[]
        }
      }

      // NÃO incluir prescriptionData.exames - exames devem ir para a coleção exams, não medications
      const candidates = [
        ...(Array.isArray(prescriptionData.medicamentos)
          ? prescriptionData.medicamentos
          : []),
        ...(Array.isArray(prescriptionData.data?.attributes?.medicamentos)
          ? prescriptionData.data?.attributes?.medicamentos || []
          : []),
        ...(Array.isArray(prescriptionData.data?.medicamentos)
          ? prescriptionData.data?.medicamentos || []
          : []),
      ]

      medications = candidates
        .filter((med) => {
          if (typeof med === 'object' && med !== null) {
            const medObj = med as Record<string, unknown>
            // Usar classificação robusta para manter apenas medicamentos
            return classifyMemedItem(medObj) === 'medication'
          }
          return false
        })
        .map((med) =>
          normalizeMedicationFromAny(med as Record<string, unknown>),
        )
        .filter((med) => med.nome || med.id)
    }

    if (medications.length > 0) {
      for (const memedMed of medications) {
        try {
          const posologia = memedMed.posologia || ''
          const observation = memedMed.instrucoes || posologia

          let concentration = 0
          let concentrationUnit = ''
          if (memedMed.apresentacao) {
            const match = memedMed.apresentacao.match(/(\d+)\s*(\w+)/)
            if (match) {
              concentration = parseInt(match[1], 10)
              concentrationUnit = match[2]
            }
          }

          let interval: number | undefined
          let intervalUnit: string | undefined
          if (posologia.toLowerCase().includes('a cada')) {
            const match = posologia.match(/a cada\s*(\d+)\s*(hora|horas)/i)
            if (match) {
              interval = parseInt(match[1], 10)
              intervalUnit = 'Horas'
            }
          }

          const medicationName = (
            memedMed.nome ||
            memedMed.id ||
            ''
          ).toLowerCase()
          const medicationKey = `${memedPrescriptionId || 'unknown'}:${medicationName}`

          if (
            (memedPrescriptionId &&
              existingMedicationKeys.has(medicationKey)) ||
            createdMedicationKeys.has(medicationKey)
          ) {
            continue
          }

          if (
            !memedPrescriptionId &&
            existingMedicationNames.has(medicationName)
          ) {
            continue
          }

          createdMedicationKeys.add(medicationKey)

          await createMedication(finalPatientId, {
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
            status: MedicationStatus.CREATED,
            createdBy: MedicationCreationBy.DOCTOR,
            memedId: memedPrescriptionId,
            memedUrl: memedPrescriptionUrl,
          })

          try {
            await createTimelinePatient(finalPatientId, {
              title: `Medicamento prescrito: ${memedMed.nome || 'Prescrição'}`,
              type: 'Prescrição Memed',
              createdBy: 'Doctor',
            })
          } catch (timelineErr) {
            console.error('Erro ao criar timeline (medicamento):', timelineErr)
          }
          // Acumular nomes dos medicamentos criados
          createdMedicationsNamesRef.current.push(
            memedMed.nome || 'Medicamento',
          )
        } catch (medError) {
          console.error('❌ Erro ao criar medicamento:', medError)
          console.error('❌ Dados do medicamento:', memedMed)
        }
      }
    }
  }

  // Obter token do prescritor e dados do paciente quando o modal abrir
  useEffect(() => {
    if (isOpen && doctorId) {
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
            // Mensagem de erro mais amigável
            let errorMessage =
              tokenResult.error || 'Erro ao obter token do prescritor'

            // Se o médico não estiver cadastrado, mostra mensagem específica
            if (tokenResult.doctorNotRegistered) {
              errorMessage =
                'Médico não cadastrado na Memed. É necessário cadastrar o médico na plataforma Memed antes de poder prescrever. Entre em contato com o suporte para realizar o cadastro.'
            }

            throw new Error(errorMessage)
          }

          setPrescriberToken(tokenResult.token)

          // Buscar dados do paciente se patientId estiver disponível
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
  }, [isOpen, doctorId, patientId])

  // Carregar e inicializar script da Memed quando o token estiver disponível
  useEffect(() => {
    if (!isOpen || !prescriberToken) {
      return
    }

    // URL do script conforme documentação oficial da Memed
    const memedScriptUrl =
      process.env.NEXT_PUBLIC_MEMED_SCRIPT_URL ||
      'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'

    // Verifica se o script já foi carregado
    const existingScript = document.querySelector(
      `script[src="${memedScriptUrl}"]`,
    )

    // Função para inicializar o módulo conforme documentação oficial
    const prescricaoMemed = () => {
      if (!window.MdSinapsePrescricao) {
        console.error('❌ MdSinapsePrescricao não está disponível')
        setError('Erro ao inicializar prescrição')
        setIsLoading(false)
        return
      }

      // Registrar listeners para prescrição criada ANTES de inicializar o módulo
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

      // Listener para fechar o modal quando o iframe da Memed for fechado
      try {
        window.MdSinapsePrescricao.event.add('core:moduleClose', () => {
          setIsOpen(false)
        })
      } catch (err) {
        console.error('Erro ao registrar core:moduleClose:', err)
      }

      // Adiciona listener para o evento core:moduleInit conforme documentação
      window.MdSinapsePrescricao.event.add(
        'core:moduleInit',
        async (module: MemedModule) => {
          try {
            // Verifica se o módulo 'plataforma.prescricao' está carregado
            if (module.name === 'plataforma.prescricao') {
              // Se temos dados do paciente, enviar comando setPaciente
              if (patientData) {
                // Formata telefone (apenas números)
                const cleanPhone =
                  patientData.phoneNumber?.replace(/\D/g, '') || ''

                // Formata CPF (apenas números)
                const cleanCpf = patientData.cpf?.replace(/\D/g, '') || ''

                // Monta endereço completo se disponível
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

                // Prepara dados do paciente para a Memed
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

                // Adiciona CPF ou marca sem CPF
                if (cleanCpf) {
                  pacienteData.cpf = cleanCpf
                } else {
                  pacienteData.withoutCpf = true
                }

                // Adiciona campos opcionais se disponíveis
                if (patientData.socialName) {
                  pacienteData.nome_social = patientData.socialName
                }
                if (enderecoCompleto) {
                  pacienteData.endereco = enderecoCompleto
                }

                // Envia comando setPaciente conforme documentação
                if (window.MdHub?.command) {
                  await window.MdHub.command.send(
                    'plataforma.prescricao',
                    'setPaciente',
                    pacienteData,
                  )
                }
              }

              // Mostra o módulo conforme documentação
              if (window.MdHub?.module) {
                window.MdHub.module.show('plataforma.prescricao')
              }

              // Aguarda um pouco para garantir que o iframe está renderizado antes de esconder o loading
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

    // Se o script já existe, apenas inicializa
    if (existingScript) {
      setTimeout(() => {
        if (window.MdSinapsePrescricao) {
          prescricaoMemed()
        } else {
          let attempts = 0
          const maxAttempts = 300 // 30 segundos (300 * 100ms)
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

    // Cria e carrega o script da Memed conforme documentação (doc.memed.com.br/docs/frontend/configuracoes)
    const script = document.createElement('script')
    script.src = memedScriptUrl
    script.dataset.token = prescriberToken
    const memedEnv = process.env.NEXT_PUBLIC_MEMED_ENV || 'integrations'
    script.dataset.env = memedEnv

    // Timeout de segurança para o carregamento do script
    const scriptTimeout = setTimeout(() => {
      if (!scriptLoadedRef.current) {
        setError(
          'O servidor da Memed não respondeu em 30 segundos.\n' +
            'Por favor, verifique sua conexão e tente novamente.',
        )
        setIsLoading(false)
      }
    }, 30000) // 30 segundos

    // Adiciona listener para o evento load conforme documentação
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

    // Função para processar prescrição criada
    async function handlePrescriptionCreated(eventData: unknown) {
      // Bloquear processamento simultâneo globalmente
      if (isProcessingRef.current) {
        return
      }

      setIsLoading(true)
      setError(null)
      isProcessingRef.current = true

      try {
        const extractedData = extractPrescriptionData(eventData)

        // Extrair ID da prescrição do evento
        const eventPayload =
          typeof eventData === 'object' && eventData !== null
            ? (eventData as Record<string, unknown>)
            : null
        const eventPrescriptionId =
          (eventPayload?.prescriptionId as string | undefined) ||
          (eventPayload?.prescricaoId as string | undefined) ||
          (eventPayload?.id as string | undefined) ||
          extractedData.prescriptionId

        // Verificar se já foi processado
        if (
          eventPrescriptionId &&
          processedPrescriptionIdsRef.current.has(eventPrescriptionId)
        ) {
          setIsLoading(false)
          isProcessingRef.current = false
          return
        }

        if (
          processingPrescriptionIdRef.current &&
          processingPrescriptionIdRef.current === eventPrescriptionId
        ) {
          setIsLoading(false)
          isProcessingRef.current = false
          return
        }

        if (!eventPrescriptionId && processedUnknownPrescriptionRef.current) {
          setIsLoading(false)
          isProcessingRef.current = false
          return
        }

        processingPrescriptionIdRef.current =
          eventPrescriptionId || '__unknown__'

        // Tentar obter patientId dos dados da prescrição se não estiver disponível
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

        // Validar patientId (obrigatório)
        if (!actualPatientId) {
          throw new Error('ID do paciente não disponível')
        }

        const finalPatientId: string = actualPatientId

        // Buscar dados do paciente se não estiverem disponíveis
        let currentPatientData = patientData
        if (!currentPatientData && finalPatientId) {
          try {
            const patientResult = await getPatientById(finalPatientId)
            if (patientResult.patient && !patientResult.error) {
              currentPatientData = patientResult.patient
            }
          } catch {
            // Silently fail
          }
        }

        let prescriptionResult: {
          success: boolean
          prescription?: MemedPrescription
          error?: string
        } = {
          success: false,
          error: 'Nenhuma prescrição encontrada',
        }

        // Se temos dados extraídos com medicamentos/exames/procedimentos, usar diretamente
        const hasExtractedData =
          extractedData.medicamentos.length > 0 ||
          extractedData.exames.length > 0 ||
          extractedData.procedimentos.length > 0 ||
          extractedData.prescriptionId

        if (hasExtractedData) {
          prescriptionResult = {
            success: true,
            prescription: {
              ...toMemedPrescription(extractedData),
              // Adicionar rawData para salvar dados completos
              _rawEventData: extractedData.rawData,
            } as MemedPrescription,
          }
        } else if (extractedData.prescriptionId) {
          // Buscar prescrição específica pelo ID via API route (mais seguro)
          const prescriptionIdFromExtracted = extractedData.prescriptionId

          try {
            const params = new URLSearchParams({
              prescriptionId: prescriptionIdFromExtracted,
            })
            if (doctorId) params.set('doctorId', doctorId)
            else if (prescriberToken)
              params.set('prescriberToken', prescriberToken)
            const url = `/api/memed/get-prescription?${params.toString()}`

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
              const currentPrescription = await window.MdHub.command.send(
                'plataforma.prescricao',
                'getPrescricao',
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
            } catch {
              // Silently fail
            }
          }

          // Fallback: buscar última prescrição do paciente via API
          if (!prescriptionResult || !prescriptionResult.success) {
            const patientIdForSearch = currentPatientData?.id || patientId
            prescriptionResult =
              await memedService.getPatientLastPrescription(patientIdForSearch)
          }
        }

        if (!prescriptionResult.success || !prescriptionResult.prescription) {
          throw new Error(
            prescriptionResult.error ||
              'Não foi possível obter a prescrição criada',
          )
        }

        // Normalizar prescrição antes de criar medicamentos
        const normalizedPrescriptionForMeds = {
          ...prescriptionResult.prescription,
          medicamentos:
            (prescriptionResult.prescription?.medicamentos?.length ?? 0) > 0
              ? prescriptionResult.prescription.medicamentos
              : (prescriptionResult.prescription as any)?.data?.attributes
                  ?.medicamentos || [],
        }

        await createMedicationsFromPrescription(
          normalizedPrescriptionForMeds,
          finalPatientId,
        )

        // Usar o patientId final para criar exames individuais (se houver)
        const patientIdToUse = finalPatientId || patientId

        if (!patientIdToUse) {
          throw new Error('patientId é obrigatório para salvar prescrição')
        }

        // Normalizar prescrição antes de extrair exames (a Memed pode retornar dados em data.attributes)
        const normalizedPrescription = {
          ...prescriptionResult.prescription,
          medicamentos:
            (prescriptionResult.prescription?.medicamentos?.length ?? 0) > 0
              ? prescriptionResult.prescription.medicamentos
              : (prescriptionResult.prescription as any)?.data?.attributes
                  ?.medicamentos || [],
          exames:
            (prescriptionResult.prescription?.exames?.length ?? 0) > 0
              ? prescriptionResult.prescription.exames
              : (prescriptionResult.prescription as any)?.data?.attributes
                  ?.exames || [],
        }

        // Extrair exames da prescrição normalizada
        const exams = extractExamsFromPrescription(normalizedPrescription)

        // Criar exames no Firestore (separados da prescrição)
        if (exams.length > 0) {
          const memedUrl = prescriptionResult.prescription?.id
            ? `https://prescricao.memed.com.br/prescricoes/${prescriptionResult.prescription.id}`
            : undefined

          // Extrair dados do médico para salvar nos exames individuais
          const examDoctorData = extractDoctorDataFromPrescription(
            prescriptionResult.prescription as unknown as Record<
              string,
              unknown
            >,
          )

          const examPromises = exams.map(async (exam) => {
            try {
              const examEntity = await createExam(patientIdToUse, {
                type: 'exam',
                doctorId,
                consultationId: consultationId || undefined,
                status: 'requested',
                examName: exam.nome,
                examUrl: memedUrl,
                examFile: '',
                memedId: prescriptionResult.prescription?.id,
                memedUrl,
                notes: exam.instrucoes || exam.posologia,
                doctorData: examDoctorData,
                patientData: currentPatientData
                  ? {
                      name: currentPatientData.name,
                      cpf: currentPatientData.cpf,
                      birthDate: currentPatientData.birthDate
                        ? typeof currentPatientData.birthDate === 'string'
                          ? currentPatientData.birthDate
                          : currentPatientData.birthDate instanceof Date
                            ? currentPatientData.birthDate
                                .toISOString()
                                .split('T')[0]
                            : undefined
                        : undefined,
                    }
                  : undefined,
                exams: [
                  {
                    id: exam.id || '',
                    name: exam.nome || '',
                    instructions: exam.instrucoes || exam.posologia || '',
                    observations: exam.observacoes || '',
                    tipo: exam.tipo || 'exame',
                    codigo_sus: exam.codigo_sus || '',
                    codigo_tuss: exam.codigo_tuss || '',
                  },
                ],
              })
              try {
                await createTimelinePatient(patientIdToUse, {
                  title: `Exame solicitado: ${exam.nome || 'Exame'}`,
                  type: 'Prescrição Memed',
                  createdBy: 'Doctor',
                })
              } catch (timelineErr) {
                console.error('Erro ao criar timeline (exame):', timelineErr)
              }
              return examEntity
            } catch (examError) {
              console.error('Erro ao criar exame:', examError)
              throw examError
            }
          })

          await Promise.all(examPromises)
        }

        // Enviar notificação e criar timeline da prescrição
        // Usar mesma lógica de createMedicationsFromPrescription (inclui fallback)
        let medsForCheck = extractMedicationsFromPrescription(
          prescriptionResult.prescription,
        )
        if (medsForCheck.length === 0) {
          const prescriptionData = prescriptionResult.prescription as {
            medicamentos?: unknown[]
            data?: {
              attributes?: { medicamentos?: unknown[] }
              medicamentos?: unknown[]
            }
          }
          const candidates = [
            ...(Array.isArray(prescriptionData.medicamentos)
              ? prescriptionData.medicamentos
              : []),
            ...(Array.isArray(prescriptionData.data?.attributes?.medicamentos)
              ? prescriptionData.data?.attributes?.medicamentos || []
              : []),
            ...(Array.isArray(prescriptionData.data?.medicamentos)
              ? prescriptionData.data?.medicamentos || []
              : []),
          ]
          medsForCheck = candidates
            .filter((med) => {
              if (typeof med === 'object' && med !== null) {
                return (
                  classifyMemedItem(med as Record<string, unknown>) ===
                  'medication'
                )
              }
              return false
            })
            .map((med) =>
              normalizeMedicationFromAny(med as Record<string, unknown>),
            )
            .filter((med) => med.nome || med.id)
        }
        const hasMedications = medsForCheck.length > 0
        const hasExams = exams.length > 0
        if (hasMedications || hasExams) {
          try {
            const { patients } = await getPatientsByIds([patientIdToUse])
            const patient = patients[0]
            await sendNotification({
              title: 'Nova prescrição médica',
              content:
                hasMedications && hasExams
                  ? 'Você recebeu uma nova prescrição com medicamentos e exames.'
                  : hasMedications
                    ? 'Você recebeu uma nova prescrição de medicamentos.'
                    : 'Você recebeu uma nova solicitação de exame.',
              type: 'Prescrição Memed',
              users: [
                {
                  userId: patientIdToUse,
                  tokens: patient?.tokens ?? [],
                },
              ],
              status: '',
              date: null,
              hasSeenToUsers: [],
            })
          } catch {
            // ignora erro da notificação
          }
          try {
            await createTimelinePatient(patientIdToUse, {
              title:
                hasMedications && hasExams
                  ? 'Prescrição recebida: medicamentos e exames'
                  : hasMedications
                    ? 'Prescrição de medicamentos recebida'
                    : 'Solicitação de exame recebida',
              type: 'Prescrição Memed',
              createdBy: 'Doctor',
            })
          } catch {
            // ignora erro da timeline
          }
        }

        // Marcar prescrição como processada antes de chamar onSuccess
        const memedPrescriptionId =
          prescriptionResult.prescription?.id ||
          (
            prescriptionResult.prescription?.data as {
              attributes?: { prescriptionUuid?: string }
            }
          )?.attributes?.prescriptionUuid ||
          (prescriptionResult.prescription as { prescriptionUuid?: string })
            ?.prescriptionUuid

        if (memedPrescriptionId) {
          processedPrescriptionIdsRef.current.add(memedPrescriptionId)
        } else if (
          processingPrescriptionIdRef.current &&
          processingPrescriptionIdRef.current !== '__unknown__'
        ) {
          processedPrescriptionIdsRef.current.add(
            processingPrescriptionIdRef.current,
          )
        } else {
          processedUnknownPrescriptionRef.current = true
        }

        setIsLoading(false)
        onSuccess?.()
      } catch (error) {
        console.error('Erro ao processar prescrição:', error)
        setError(
          error instanceof Error
            ? error.message
            : 'Erro ao salvar exames da prescrição',
        )
        setIsLoading(false)
      } finally {
        processingPrescriptionIdRef.current = null
        isProcessingRef.current = false
      }
    }

    // Listener para eventos da Memed via postMessage
    const handleMemedMessage = async (event: MessageEvent) => {
      const eventType = event.data?.type || event.data?.event
      const eventName = event.data?.name
      const eventCallback = event.data?.callback
      const innerData = event.data?.data

      // Excluir eventos que NÃO são de prescrição criada
      const excludedEvents = ['getUsuario', 'getPartnerColor', 'findGateway']

      if (excludedEvents.includes(eventName || '')) {
        return
      }

      // Verificar se é o evento de fechamento do modal
      if (
        eventType === 'memed.close' ||
        eventName === 'close' ||
        eventCallback === 'close'
      ) {
        setIsOpen(false)
        return
      }

      // Verificar especificamente se é o evento setGeneratedPrescription
      const isSetGeneratedPrescription =
        eventName === 'setGeneratedPrescription' ||
        (eventType === 'command' && eventName === 'setGeneratedPrescription') ||
        eventCallback === 'setGeneratedPrescription'

      // Também verificar por prescricaoSalva
      const isPrescricaoSalva =
        eventName === 'prescricaoSalva' ||
        eventType === 'prescricaoSalva' ||
        eventCallback === 'prescricaoSalva'

      // Só considerar eventos específicos de prescrição
      const isPrescriptionCreated =
        eventType === 'MEMED_PRESCRIPTION_CREATED' ||
        eventType === 'prescription.created' ||
        eventType === 'prescricao.criada' ||
        eventName === 'prescription.created' ||
        eventName === 'prescricao.criada' ||
        isSetGeneratedPrescription ||
        isPrescricaoSalva ||
        event.data?.prescriptionId ||
        event.data?.prescricaoId ||
        innerData?.prescriptionId ||
        innerData?.prescricaoId

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
      } else if (eventType === 'memed.close') {
        setIsOpen(false)
      }
    }

    window.addEventListener('message', handleMemedMessage)

    return () => {
      window.removeEventListener('message', handleMemedMessage)
      // Não remove o script para evitar recarregar múltiplas vezes
    }
  }, [
    isOpen,
    prescriberToken,
    patientData,
    patientId,
    doctorId,
    consultationId,
    setIsOpen,
    onSuccess,
  ])

  // Remover overlay completamente para não bloquear iframe
  useEffect(() => {
    if (isOpen) {
      // Remover overlay do DOM quando modal estiver aberto
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      if (overlay) {
        ;(overlay as HTMLElement).style.display = 'none'
      }
    }
  }, [isOpen])

  // Limpar quando o modal fechar e resetar loading quando abrir
  useEffect(() => {
    if (!isOpen) {
      // Transferir medicamentos criados para a fila de avisos
      if (createdMedicationsNamesRef.current.length > 0) {
        setWarningQueue(createdMedicationsNamesRef.current)
        createdMedicationsNamesRef.current = []
      }

      // Se o script estava carregado, pode ter sido criada uma prescrição
      // Processar exames antes de limpar tudo
      const processExamsBeforeClose = async () => {
        // Evitar processamento duplicado
        if (processingExamsRef.current) {
          return
        }

        // Se já processou via evento, não precisa processar novamente
        if (prescriptionWasCreatedRef.current) {
          setIsLoading(false)
          return
        }

        // O salvamento deve acontecer no momento da criação da prescrição,
        // não no fechamento do modal. O fallback só é usado se o evento não foi capturado.
        if (scriptLoadedRef.current && patientId && doctorId) {
          if (prescriptionWasCreatedRef.current) {
            return
          }

          processingExamsRef.current = true

          try {
            // Buscar dados do paciente se não estiverem disponíveis
            let currentPatientData = patientData
            if (!currentPatientData && patientId) {
              try {
                const patientResult = await getPatientById(patientId)
                if (patientResult.patient && !patientResult.error) {
                  currentPatientData = patientResult.patient
                }
              } catch {
                // Silently fail
              }
            }

            // Aguardar um pouco para garantir que a prescrição foi salva no backend da Memed
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Buscar prescrição via API
            let prescriptionResult = null
            try {
              const patientIdForSearch = currentPatientData?.id || patientId
              prescriptionResult =
                await memedService.getPatientLastPrescription(
                  patientIdForSearch,
                )
            } catch (apiError) {
              prescriptionResult = {
                success: false,
                error:
                  apiError instanceof Error
                    ? apiError.message
                    : 'Erro ao buscar prescrição',
              }
            }

            if (prescriptionResult.success && prescriptionResult.prescription) {
              try {
                const memedPrescription = prescriptionResult.prescription

                // Normalizar prescrição antes de criar medicamentos (fallback)
                const normalizedPrescriptionForFallbackMeds = {
                  ...memedPrescription,
                  medicamentos:
                    (memedPrescription.medicamentos?.length ?? 0) > 0
                      ? memedPrescription.medicamentos
                      : (memedPrescription as any)?.data?.attributes
                          ?.medicamentos || [],
                }

                await createMedicationsFromPrescription(
                  normalizedPrescriptionForFallbackMeds,
                  patientId,
                )
              } catch (prescriptionSaveError) {
                console.error(
                  'Erro ao salvar medicamentos no fallback:',
                  prescriptionSaveError,
                )
              }

              const exams = extractExamsFromPrescription(
                prescriptionResult.prescription,
              )
              // Usar mesma lógica de createMedicationsFromPrescription (inclui fallback)
              let fallbackMedsForCheck = extractMedicationsFromPrescription(
                prescriptionResult.prescription,
              )
              if (fallbackMedsForCheck.length === 0) {
                const prescriptionData = prescriptionResult.prescription as {
                  medicamentos?: unknown[]
                  data?: {
                    attributes?: { medicamentos?: unknown[] }
                    medicamentos?: unknown[]
                  }
                }
                const candidates = [
                  ...(Array.isArray(prescriptionData.medicamentos)
                    ? prescriptionData.medicamentos
                    : []),
                  ...(Array.isArray(
                    prescriptionData.data?.attributes?.medicamentos,
                  )
                    ? prescriptionData.data?.attributes?.medicamentos || []
                    : []),
                  ...(Array.isArray(prescriptionData.data?.medicamentos)
                    ? prescriptionData.data?.medicamentos || []
                    : []),
                ]
                fallbackMedsForCheck = candidates
                  .filter((med) => {
                    if (typeof med === 'object' && med !== null) {
                      return (
                        classifyMemedItem(med as Record<string, unknown>) ===
                        'medication'
                      )
                    }
                    return false
                  })
                  .map((med) =>
                    normalizeMedicationFromAny(med as Record<string, unknown>),
                  )
                  .filter((med) => med.nome || med.id)
              }
              const hasMedications = fallbackMedsForCheck.length > 0
              const hasExams = exams.length > 0

              if (hasMedications || hasExams) {
                try {
                  const { patients } = await getPatientsByIds([patientId])
                  const patient = patients[0]
                  await sendNotification({
                    title: 'Nova prescrição médica',
                    content:
                      hasMedications && hasExams
                        ? 'Você recebeu uma nova prescrição com medicamentos e exames.'
                        : hasMedications
                          ? 'Você recebeu uma nova prescrição de medicamentos.'
                          : 'Você recebeu uma nova solicitação de exame.',
                    type: 'Prescrição Memed',
                    users: [
                      {
                        userId: patientId,
                        tokens: patient?.tokens ?? [],
                      },
                    ],
                    status: '',
                    date: null,
                    hasSeenToUsers: [],
                  })
                } catch {
                  // ignora erro da notificação
                }
                try {
                  await createTimelinePatient(patientId, {
                    title:
                      hasMedications && hasExams
                        ? 'Prescrição recebida: medicamentos e exames'
                        : hasMedications
                          ? 'Prescrição de medicamentos recebida'
                          : 'Solicitação de exame recebida',
                    type: 'Prescrição Memed',
                    createdBy: 'Doctor',
                  })
                } catch {
                  // ignora erro da timeline
                }
              }

              if (exams.length > 0) {
                const fallbackExamDoctorData =
                  extractDoctorDataFromPrescription(
                    prescriptionResult.prescription as unknown as Record<
                      string,
                      unknown
                    >,
                  )

                await Promise.all(
                  exams.map(async (exam) => {
                    const examEntity = await createExam(patientId, {
                      type: 'exam',
                      doctorId,
                      consultationId: consultationId || undefined,
                      status: 'requested',
                      examName: exam.nome,
                      examUrl: prescriptionResult.prescription?.id
                        ? `https://prescricao.memed.com.br/prescricoes/${prescriptionResult.prescription.id}`
                        : undefined,
                      memedId: prescriptionResult.prescription?.id,
                      memedUrl: prescriptionResult.prescription?.id
                        ? `https://prescricao.memed.com.br/prescricoes/${prescriptionResult.prescription.id}`
                        : undefined,
                      notes: exam.instrucoes || exam.posologia,
                      examFile: '',
                      doctorData: fallbackExamDoctorData,
                      patientData: currentPatientData
                        ? {
                            name: currentPatientData.name,
                            cpf: currentPatientData.cpf,
                            birthDate: currentPatientData.birthDate
                              ? typeof currentPatientData.birthDate === 'string'
                                ? currentPatientData.birthDate
                                : currentPatientData.birthDate instanceof Date
                                  ? currentPatientData.birthDate
                                      .toISOString()
                                      .split('T')[0]
                                  : undefined
                              : undefined,
                          }
                        : undefined,
                      exams: [
                        {
                          id: exam.id || '',
                          name: exam.nome || '',
                          instructions: exam.instrucoes || exam.posologia || '',
                          observations: exam.observacoes || '',
                          tipo: exam.tipo || 'exame',
                          codigo_sus: exam.codigo_sus || '',
                          codigo_tuss: exam.codigo_tuss || '',
                        },
                      ],
                    })
                    try {
                      await createTimelinePatient(patientId, {
                        title: `Exame solicitado: ${exam.nome || 'Exame'}`,
                        type: 'Prescrição Memed',
                        createdBy: 'Doctor',
                      })
                    } catch (timelineErr) {
                      console.error(
                        'Erro ao criar timeline (exame):',
                        timelineErr,
                      )
                    }
                    return examEntity
                  }),
                )

                onSuccess?.()
              }
            }
          } catch (error) {
            console.error('Erro ao processar exames ao fechar modal:', error)
            // Não bloqueia o fechamento do modal
          } finally {
            processingExamsRef.current = false
          }
        }
      }

      // Executar processamento de forma assíncrona
      processExamsBeforeClose()

      // Fechar o módulo da Memed se estiver aberto
      if (window.MdHub && containerRef.current) {
        try {
          window.MdHub.close()
        } catch {
          // Silently fail
        }
      }

      scriptLoadedRef.current = false
      setPrescriberToken(null)
      setPatientData(null)
      setError(null)
      setIsLoading(false)
      prescriptionWasCreatedRef.current = false

      // Limpar o container
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }

      // Restaurar display do overlay
      const overlay = document.querySelector('[data-radix-dialog-overlay]')
      if (overlay) {
        ;(overlay as HTMLElement).style.display = ''
      }
    } else {
      // Quando o modal abrir, garantir que o loading está ativo
      setIsLoading(true)
      prescriptionWasCreatedRef.current = false
      processingExamsRef.current = false
      createdMedicationsNamesRef.current = []
    }
  }, [
    isOpen,
    patientData,
    patientId,
    doctorId,
    consultationId,
    prescriberToken,
    onSuccess,
  ])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DialogContent className="rounded-none bg-white sm:max-w-4xl">
          <DialogHeader className="items-start text-left">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Prescrever com Memed
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Crie uma prescrição digital para o paciente
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-4 h-[700px] w-full">
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
        </DialogContent>
      </Dialog>

      <UsageClassificationWarningModal
        isOpen={!isOpen && warningQueue.length > 0}
        onClose={() =>
          setWarningQueue((prev) => (prev.length > 0 ? prev.slice(1) : prev))
        }
        medicationName={warningQueue[0]}
      />
    </>
  )
}
