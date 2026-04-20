'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Check,
  Circle,
  Maximize,
  Mic,
  MicOff,
  Video,
  VideoOff,
  LayoutGrid,
} from 'lucide-react'
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentReference,
} from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import { DischargePlanModal } from '@/components/organisms/Modals/DischargePlanModal/dischargePlanModal'
import { PrescriptionModal } from '@/components/organisms/Modals/PrescriptionModal/prescriptionModal'
import { SoapNotesPanel } from '@/components/organisms/SoapNotesPanel/soapNotesPanel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { firestore } from '@/config/firebase/firebase'
import {
  useCurrentTherapeuticPlan,
  useHasDischargedPlan,
} from '@/hooks/queries/useTherapeuticPlan'
import { useAppToast } from '@/hooks/useAppToast'
import { useConsultationSoap } from '@/hooks/useConsultationSoap'
import useDoctor from '@/hooks/useDoctor'
import { usePatient } from '@/hooks/usePatient'
import useUser from '@/hooks/useUser'
import { useVideoCallRecorder } from '@/hooks/useVideoCallRecorder'
import { generateAgoraNumericUid } from '@/lib/agora/generateUid'
import { cn } from '@/lib/utils'
import { getAuthenticatedJsonHeaders } from '@/services/api/authenticatedFetch'
import { updateConsultation } from '@/services/consultation'
import {
  getVideoCall,
  endVideoCall,
  type VideoCall,
} from '@/services/consultationVideoCall'
import { uploadAudioFile } from '@/services/firebase/firebaseStorage'
import {
  createRequestConsultation,
  type CreateRequestConsultationData,
} from '@/services/requestConsultations'
import { getAllSpecialties } from '@/utils/specialtyHelpers'
import RequestConsultationsSchema, {
  RequestConsultationsData,
} from '@/validations/requestConsultations'

type RequestStatus = 'pending' | 'accepted' | 'denied'

type JoinRequestSnapshot = {
  id: string
  patientId: string
  patientName: string
  status: RequestStatus
  ref: DocumentReference
}

type JoinRequest = {
  patientId: string
  patientName: string
  status: RequestStatus
}

const envAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID

if (!envAppId) {
  throw new Error(
    '🚨 Variável NEXT_PUBLIC_AGORA_APP_ID não definida. Configure o App ID do Agora em .env.local.',
  )
}

const APP_ID: string = envAppId

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

interface PageProps {
  params: Promise<{
    consultationId: string
    callId: string
  }>
}

export default function ConsultationVideoCallPage({ params }: PageProps) {
  const { consultationId, callId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentDoctor } = useDoctor()
  const toast = useAppToast()

  const roleParam = (searchParams.get('role') || 'guest') as 'host' | 'guest'
  const requestIdParam = searchParams.get('requestId')

  const isHostRole = roleParam === 'host'

  const agoraUid = useMemo(() => {
    if (!currentUser?.id) return null
    return generateAgoraNumericUid({
      userId: currentUser.id,
      consultationId,
      callId,
      role: roleParam,
      requestId: requestIdParam || undefined,
    })
  }, [consultationId, callId, currentUser?.id, requestIdParam, roleParam])

  const [callData, setCallData] = useState<VideoCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'prontuario' | 'soap'>('soap')
  const [isComplementaryConsultationOpen, setIsComplementaryConsultationOpen] =
    useState(false)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)

  const handleOpenComplementaryConsultation = useCallback(() => {
    setIsComplementaryConsultationOpen(!isComplementaryConsultationOpen)
  }, [isComplementaryConsultationOpen])
  const [isResponsibleForConsultation, setIsResponsibleForConsultation] =
    useState(false)

  const handleResponsibleForConsultation = useCallback(() => {
    setIsResponsibleForConsultation(!isResponsibleForConsultation)
  }, [isResponsibleForConsultation])

  // Hook para gerenciar dados SOAP
  const { soapData, editingFields, startEditing, saveField, updateLocalData } =
    useConsultationSoap({
      consultationId,
      callId,
      enabled: !!callData,
    })

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [incomingRequest, setIncomingRequest] =
    useState<JoinRequestSnapshot | null>(null)
  const [userNamesMap, setUserNamesMap] = useState<Map<string, string>>(
    new Map(),
  )

  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [isSplitView, setIsSplitView] = useState(false)

  const [localPosition, setLocalPosition] = useState({ x: 24, y: 24 })
  const dragStateRef = useRef({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  })

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null)
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null)
  const localPreviewRef = useRef<HTMLDivElement | null>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement | null>(null)
  const hostRequestsListenerRef = useRef<ReturnType<typeof onSnapshot> | null>(
    null,
  )
  const checkUsersIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const joinedRef = useRef(false)
  const joiningRef = useRef(false)
  const hasErroredRef = useRef(false)
  const lastAttemptedCallIdRef = useRef<string | null>(null)
  const userNamesMapRef = useRef<Map<string, string>>(new Map())
  // Rastrear quais vídeos já estão sendo reproduzidos para evitar múltiplas chamadas de play()
  const playingVideoTracksRef = useRef<Map<number, HTMLElement>>(new Map())
  // Debounce para evitar múltiplas renderizações em sequência
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Rastrear quais usuários já foram inscritos para evitar assinaturas duplicadas
  const subscribedUsersRef = useRef<Set<string>>(new Set())

  // Hook para gravar áudio da videochamada (local + remoto)
  const remoteAudioTracks = useMemo(
    () =>
      remoteUsers
        .map((user) => user.audioTrack)
        .filter((track): track is NonNullable<typeof track> => track !== null),
    [remoteUsers],
  )

  // Ref para armazenar o blob de gravação quando disponível
  const recordingBlobRef = useRef<Blob | null>(null)

  const {
    isRecording,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    blob: recordingBlob, // Disponível após stopRecording para download/upload
    error: recordingError,
    recordingDuration,
    startRecording,
    stopRecording,
  } = useVideoCallRecorder({
    localAudioTrack: localAudioTrackRef.current,
    remoteAudioTracks,
  })

  // Atualizar ref quando o blob estiver disponível
  useEffect(() => {
    if (recordingBlob) {
      recordingBlobRef.current = recordingBlob
    }
  }, [recordingBlob])

  // Mostrar erro de gravação se houver
  useEffect(() => {
    if (recordingError) {
      toast.error(`Erro na gravação: ${recordingError}`)
    }
  }, [recordingError, toast])

  // Iniciar gravação automaticamente quando a chamada estiver ativa
  const hasStartedRecordingRef = useRef(false)
  useEffect(() => {
    // Aguardar um pouco para garantir que os tracks estejam prontos
    if (
      joinedRef.current &&
      !isRecording &&
      !hasStartedRecordingRef.current &&
      (localAudioTrackRef.current || remoteAudioTracks.length > 0)
    ) {
      const timer = setTimeout(() => {
        try {
          hasStartedRecordingRef.current = true
          startRecording()
        } catch {
          hasStartedRecordingRef.current = false // Permitir tentar novamente
        }
      }, 2000) // Delay de 2 segundos para garantir que tudo está pronto

      return () => clearTimeout(timer)
    }
  }, [isRecording, remoteAudioTracks.length, startRecording])

  const userInitials = useMemo(() => {
    if (!currentUser?.name) return 'M'
    return currentUser.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [currentUser?.name])

  // Mapeamento de UID numérico para userId
  // Como agora usamos UIDs numéricos, precisamos mapear baseado no callData
  const uidToUserIdMapRef = useRef<Map<number, string>>(new Map())

  // Função para obter userId a partir do UID numérico do Agora
  const getUserIdFromAgoraUid = useCallback(
    (agoraUid: number): string | null => {
      // Se já temos no mapeamento, retornar
      if (uidToUserIdMapRef.current.has(agoraUid)) {
        return uidToUserIdMapRef.current.get(agoraUid) || null
      }

      // Tentar identificar baseado no callData e nosso próprio UID
      if (callData && agoraUid) {
        // Se somos host, o remoto deve ser o patient
        if (isHostRole && callData.patientId) {
          uidToUserIdMapRef.current.set(agoraUid, callData.patientId)
          return callData.patientId
        }
        // Se somos guest, o remoto deve ser o host
        if (!isHostRole && callData.hostId) {
          uidToUserIdMapRef.current.set(agoraUid, callData.hostId)
          return callData.hostId
        }
      }

      return null
    },
    [callData, isHostRole],
  )

  // Calcular o nome do participante atual
  const participantDisplayName = useMemo(() => {
    if (remoteUsers.length === 0) {
      return 'Aguardando participante'
    }

    const firstParticipant = remoteUsers[0]
    const agoraUidNum = Number(firstParticipant.uid)
    const userId = getUserIdFromAgoraUid(agoraUidNum)
    const participantName = userId
      ? userNamesMap.get(userId) || 'Participante'
      : 'Participante'
    return `Participante: ${participantName}`
  }, [remoteUsers, userNamesMap, getUserIdFromAgoraUid])

  // Identificar o patientId - já temos no callData
  const patientId = useMemo(() => {
    return callData?.patientId || null
  }, [callData])

  // Buscar dados do paciente e plano atual
  const { patient } = usePatient(patientId || '')
  const { data: currentPlan } = useCurrentTherapeuticPlan(patientId || '')
  const hasDischargedPlan = useHasDischargedPlan(patientId || '')

  const isCareCoordinator = currentDoctor?.id === patient?.doctorId && patientId
  const canDischarge =
    !hasDischargedPlan &&
    isCareCoordinator &&
    currentPlan &&
    !currentPlan.dischargedAt

  // Função para obter as iniciais de um nome
  const getInitials = useCallback((name: string): string => {
    if (!name) return 'M'
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [])

  // Função para buscar o nome do usuário no Firestore
  const fetchUserName = useCallback(
    async (userId: string): Promise<string | null> => {
      try {
        // Verifica se já temos o nome no mapa usando o ref (preenchido automaticamente pelo useEffect)
        if (userNamesMapRef.current.has(userId)) {
          const cachedName = userNamesMapRef.current.get(userId)
          return cachedName || null
        }

        // Busca o nome do usuário no Firestore (primeiro tenta em 'users', depois em 'medicos')
        let userRef = doc(firestore, 'users', userId)
        let userSnap = await getDoc(userRef)

        // Se não encontrar em 'users', tenta em 'medicos'
        if (!userSnap.exists()) {
          userRef = doc(firestore, 'medicos', userId)
          userSnap = await getDoc(userRef)
        }

        if (userSnap.exists()) {
          const userData = userSnap.data()
          const name =
            userData?.name || userData?.nome || userData?.displayName || null

          if (name) {
            // Atualiza o ref e o estado com o nome
            userNamesMapRef.current.set(userId, name)
            setUserNamesMap((prev) => {
              const newMap = new Map(prev)
              newMap.set(userId, name)
              return newMap
            })
            return name
          }
        }

        return null
      } catch {
        // Erro silencioso - retorna null se não conseguir buscar
        return null
      }
    },
    [],
  )

  const resetAgoraState = useCallback(async () => {
    try {
      // Limpar intervalo de verificação de usuários
      if (checkUsersIntervalRef.current) {
        clearInterval(checkUsersIntervalRef.current)
        checkUsersIntervalRef.current = null
      }

      const client = clientRef.current

      if (localVideoTrackRef.current) {
        try {
          localVideoTrackRef.current.stop()
          localVideoTrackRef.current.close()
        } catch {
          // Ignorar erros ao limpar
        }
        localVideoTrackRef.current = null
      }

      if (localAudioTrackRef.current) {
        try {
          localAudioTrackRef.current.stop()
          localAudioTrackRef.current.close()
        } catch {
          // Ignorar erros ao limpar
        }
        localAudioTrackRef.current = null
      }

      if (client) {
        try {
          client.removeAllListeners()
          const connectionState = client.connectionState
          if (
            connectionState !== 'DISCONNECTED' &&
            connectionState !== 'DISCONNECTING'
          ) {
            await client.leave()
          }
        } catch {
          // Ignorar erros ao desconectar
        }
        clientRef.current = null
      }

      // Limpar refs de controle
      subscribedUsersRef.current.clear()
      playingVideoTracksRef.current.clear()
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
        renderTimeoutRef.current = null
      }

      setRemoteUsers([])
      joinedRef.current = false
      joiningRef.current = false
    } catch {
      // Ignorar erros ao resetar
    }
  }, [])

  useEffect(() => {
    const renderTimeout = renderTimeoutRef.current
    const playingTracks = playingVideoTracksRef.current
    const hostRequestsListener = hostRequestsListenerRef.current

    return () => {
      resetAgoraState().catch(() => {
        // Ignorar erros na desmontagem
      })
      if (hostRequestsListener) {
        hostRequestsListener()
        hostRequestsListenerRef.current = null
      }
      // Limpar timeout de renderização
      if (renderTimeout) {
        clearTimeout(renderTimeout)
        renderTimeoutRef.current = null
      }
      // Limpar mapa de reprodução
      playingTracks.clear()
    }
  }, [resetAgoraState])

  const renderRemoteUsers = useCallback(async () => {
    const container = remoteVideoContainerRef.current
    if (!container) {
      return
    }

    const validIds = new Set(
      remoteUsers.map((user) => `remote-user-${user.uid}`),
    )

    const agoraClient = clientRef.current

    // Remover apenas elementos que realmente não existem mais no estado
    // e também não estão mais presentes no cliente Agora
    Array.from(container.querySelectorAll('[data-remote-video]')).forEach(
      (element) => {
        if (!validIds.has(element.id)) {
          const uid = Number(element.id.replace('remote-user-', ''))
          // Só remover se realmente não existe no estado E nem no client Agora
          const existsInState = remoteUsers.some(
            (u) => String(u.uid) === String(uid),
          )
          const existsInClient = agoraClient?.remoteUsers?.some(
            (u) => String(u.uid) === String(uid),
          )

          if (!existsInState && !existsInClient) {
            playingVideoTracksRef.current.delete(uid)
            element.remove()
          }
        }
      },
    )

    // Renderizar cada usuário remoto
    await Promise.all(
      remoteUsers.map(async (user) => {
        const elementId = `remote-user-${user.uid}`
        const agoraUidNum = Number(user.uid)
        let element = container.querySelector(`#${elementId}`) as HTMLElement

        if (!element) {
          element = document.createElement('div')
          element.id = elementId
          element.dataset.remoteVideo = 'true'
          element.className =
            'relative flex aspect-video w-full max-w-6xl items-center justify-center overflow-hidden rounded-3xl bg-purple-900/80 shadow-xl'
          container.appendChild(element)
        }

        const videoElementInDOM = element.querySelector('video')
        const existingElement = playingVideoTracksRef.current.get(agoraUidNum)

        // Se tem videoTrack, renderizar o vídeo
        if (user.videoTrack) {
          // Se já está reproduzindo no elemento correto e o vídeo está no DOM, não fazer nada
          if (
            existingElement === element &&
            videoElementInDOM &&
            !videoElementInDOM.paused &&
            user.videoTrack.isPlaying
          ) {
            // Apenas garantir classes CSS
            requestAnimationFrame(() => {
              videoElementInDOM?.classList.add(
                'h-full',
                'w-full',
                'object-cover',
              )
            })
            return
          }

          // Se está em outro elemento, parar primeiro
          if (existingElement && existingElement !== element) {
            try {
              user.videoTrack.stop()
            } catch {
              // Ignorar erros
            }
          }

          // Limpar apenas se não há vídeo no DOM
          if (!videoElementInDOM) {
            element.innerHTML = ''
          }

          // Reproduzir o vídeo
          try {
            await user.videoTrack.play(element)
            playingVideoTracksRef.current.set(agoraUidNum, element)

            // Aplicar classes CSS após renderização
            requestAnimationFrame(() => {
              const videoEl = element.querySelector('video')
              if (videoEl) {
                videoEl.classList.add('h-full', 'w-full', 'object-cover')
              }
            })
          } catch (error) {
            console.error(
              '❌ [WEB] Erro ao reproduzir vídeo (primeira tentativa):',
              agoraUidNum,
              error,
            )
            // Tentar novamente após um pequeno delay
            setTimeout(async () => {
              try {
                if (user.videoTrack) {
                  await user.videoTrack.play(element)
                  playingVideoTracksRef.current.set(agoraUidNum, element)
                }
              } catch {
                // Ignorar erro na segunda tentativa
              }
            }, 500)
          }
        } else {
          // Se não tem videoTrack mas tem vídeo no DOM, manter o vídeo (atualização transitória)
          if (videoElementInDOM) {
            // Manter o vídeo - não limpar
            return
          }

          // Se não tem vídeo e não tem track, mostrar iniciais
          playingVideoTracksRef.current.delete(agoraUidNum)
          const userId = getUserIdFromAgoraUid(agoraUidNum)
          const userName = userId ? await fetchUserName(userId) : null
          const initials = userName ? getInitials(userName) : 'M'

          element.innerHTML = `
            <div class="flex h-full w-full items-center justify-center">
              <div class="flex h-32 w-32 items-center justify-center rounded-full bg-purple-700 text-4xl font-semibold text-white shadow-lg">
                ${initials}
              </div>
            </div>
          `
        }
      }),
    )
  }, [remoteUsers, getUserIdFromAgoraUid, fetchUserName, getInitials])

  // Único useEffect para renderizar vídeos quando necessário
  useEffect(() => {
    // Limpar timeout anterior
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    // Debounce curto para evitar múltiplas renderizações
    renderTimeoutRef.current = setTimeout(() => {
      renderRemoteUsers()
    }, 50)

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [remoteUsers, isSplitView, renderRemoteUsers])

  const handleAgoraEvents = useCallback(
    (client: IAgoraRTCClient) => {
      // Listener para quando um usuário publica vídeo/áudio
      client.on('user-published', async (user, mediaType) => {
        const subscriptionKey = `${user.uid}-${mediaType}`

        // Verificar se já foi inscrito para evitar assinaturas duplicadas
        if (subscribedUsersRef.current.has(subscriptionKey)) {
          return
        }

        try {
          await client.subscribe(user, mediaType)
          // Marcar como inscrito
          subscribedUsersRef.current.add(subscriptionKey)
        } catch (error) {
          console.error('❌ Erro ao fazer subscribe:', {
            uid: user.uid,
            mediaType,
            error,
          })
          // Não quebrar a aplicação se o subscribe falhar
          // O stream pode não estar mais disponível ou o usuário pode ter saído
          return
        }

        // Aguardar um pouco para o SDK adicionar os tracks ao objeto user
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Atualizar mapeamento de UID para userId
        const agoraUidNum = Number(user.uid)
        const userId = getUserIdFromAgoraUid(agoraUidNum)
        if (userId) {
          uidToUserIdMapRef.current.set(agoraUidNum, userId)
          if (!userNamesMapRef.current.has(userId)) {
            fetchUserName(userId)
          }
        }

        // Atualizar estado - o useEffect vai renderizar automaticamente
        setRemoteUsers((prev) => {
          const exists = prev.some((item) => item.uid === user.uid)
          if (exists) {
            return prev.map((item) => {
              if (item.uid === user.uid) {
                return {
                  ...item,
                  ...user,
                  videoTrack: user.videoTrack || item.videoTrack,
                  audioTrack: user.audioTrack || item.audioTrack,
                }
              }
              return item
            })
          }
          return [...prev, user]
        })

        // Reproduzir áudio se disponível
        if (mediaType === 'audio' && user.audioTrack) {
          try {
            await user.audioTrack.play()
          } catch {
            // Ignorar erros
          }
        }
      })

      // Listener para quando um usuário entra no canal
      client.on('user-joined', async (user) => {
        // Aguardar um pouco para tracks serem publicados
        setTimeout(async () => {
          try {
            // Fazer subscribe de vídeo se disponível
            if (user.hasVideo) {
              const videoKey = `${user.uid}-video`
              if (!subscribedUsersRef.current.has(videoKey)) {
                await client.subscribe(user, 'video')
                subscribedUsersRef.current.add(videoKey)
                await new Promise((resolve) => setTimeout(resolve, 200))
              }
            }

            // Fazer subscribe de áudio se disponível
            if (user.hasAudio) {
              const audioKey = `${user.uid}-audio`
              if (!subscribedUsersRef.current.has(audioKey)) {
                await client.subscribe(user, 'audio')
                subscribedUsersRef.current.add(audioKey)
                await new Promise((resolve) => setTimeout(resolve, 200))
                if (user.audioTrack) {
                  try {
                    await user.audioTrack.play()
                  } catch {
                    // Ignorar erros
                  }
                }
              }
            }

            // Atualizar mapeamento
            const agoraUidNum = Number(user.uid)
            const userId = getUserIdFromAgoraUid(agoraUidNum)
            if (userId) {
              uidToUserIdMapRef.current.set(agoraUidNum, userId)
              if (!userNamesMapRef.current.has(userId)) {
                fetchUserName(userId)
              }
            }

            // Atualizar estado - o useEffect vai renderizar
            setRemoteUsers((prev) => {
              const exists = prev.some((item) => item.uid === user.uid)
              if (!exists) {
                return [...prev, user]
              }
              return prev.map((item) => {
                if (item.uid === user.uid) {
                  return {
                    ...item,
                    ...user,
                    videoTrack: user.videoTrack || item.videoTrack,
                    audioTrack: user.audioTrack || item.audioTrack,
                  }
                }
                return item
              })
            })
          } catch (error) {
            console.error('❌ [WEB] Erro ao processar user-joined:', error)
          }
        }, 500)
      })

      client.on('user-unpublished', (user, mediaType) => {
        const subscriptionKey = `${user.uid}-${mediaType}`
        subscribedUsersRef.current.delete(subscriptionKey)

        if (mediaType === 'video') {
          playingVideoTracksRef.current.delete(Number(user.uid))
        }

        // Atualizar estado - o useEffect vai renderizar
        setRemoteUsers((prev) =>
          prev.map((item) => (item.uid === user.uid ? user : item)),
        )
      })

      client.on('user-left', (user) => {
        const agoraUidNum = Number(user.uid)
        // Remover todas as assinaturas deste usuário
        subscribedUsersRef.current.delete(`${user.uid}-video`)
        subscribedUsersRef.current.delete(`${user.uid}-audio`)
        // Remover do mapa de reprodução
        playingVideoTracksRef.current.delete(agoraUidNum)
        setRemoteUsers((prev) =>
          prev.filter((remoteUser) => remoteUser.uid !== user.uid),
        )
        renderRemoteUsers()
      })

      // Listener para quando informações do usuário são atualizadas
      client.on('user-info-updated', (uid) => {
        const updatedUser = client.remoteUsers.find((u) => u.uid === uid)
        if (updatedUser) {
          // Atualizar estado - o useEffect vai renderizar
          setRemoteUsers((prev) => {
            const exists = prev.some((item) => item.uid === uid)
            if (!exists) {
              return [...prev, updatedUser]
            }
            return prev.map((item) => (item.uid === uid ? updatedUser : item))
          })

          // Tentar fazer subscribe se necessário
          if (updatedUser.hasVideo && !updatedUser.videoTrack) {
            const videoKey = `${updatedUser.uid}-video`
            if (!subscribedUsersRef.current.has(videoKey)) {
              client.subscribe(updatedUser, 'video').catch(() => {
                // Ignorar erros
              })
            }
          }
          if (updatedUser.hasAudio && !updatedUser.audioTrack) {
            const audioKey = `${updatedUser.uid}-audio`
            if (!subscribedUsersRef.current.has(audioKey)) {
              client
                .subscribe(updatedUser, 'audio')
                .then(async () => {
                  if (updatedUser.audioTrack) {
                    try {
                      await updatedUser.audioTrack.play()
                    } catch {
                      // Ignorar erros
                    }
                  }
                })
                .catch(() => {
                  // Ignorar erros
                })
            }
          }
        }
      })
    },
    [renderRemoteUsers, getUserIdFromAgoraUid, fetchUserName],
  )

  const joinAgoraChannel = useCallback(
    async (channelName: string, role: 'host' | 'guest') => {
      if (!currentUser) throw new Error('Usuário não autenticado')
      if (!agoraUid) {
        throw new Error('Não foi possível determinar o UID do Agora')
      }

      // Verificar se está em contexto seguro (HTTPS ou localhost)
      const isSecureContext =
        window.isSecureContext ||
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'

      if (!isSecureContext) {
        const errorMsg =
          '⚠️ Acesso a câmera e microfone requer HTTPS ou localhost.\n\n' +
          'Por favor, acesse via:\n' +
          '• https://localhost:3000 (recomendado)\n' +
          '• http://localhost:3000\n' +
          '• http://127.0.0.1:3000\n\n' +
          'Acessar por IP (ex: http://192.168.x.x:3000) não funciona devido às políticas de segurança do navegador.'
        throw new Error(errorMsg)
      }

      // Limpar qualquer cliente anterior antes de criar um novo
      await resetAgoraState()

      // Pequeno delay para garantir que a limpeza foi concluída
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Garantir que agoraUid seja número antes de fazer a requisição
      if (agoraUid === null || agoraUid === undefined) {
        throw new Error('UID do Agora não foi gerado corretamente')
      }

      const numericUidForRequest =
        typeof agoraUid === 'number' ? agoraUid : Number(agoraUid)

      if (isNaN(numericUidForRequest)) {
        throw new Error(
          `UID inválido para requisição: ${agoraUid} (tipo: ${typeof agoraUid})`,
        )
      }

      try {
        const response = await fetch('/api/agora/token', {
          method: 'POST',
          headers: await getAuthenticatedJsonHeaders(),
          body: JSON.stringify({
            callId,
            role,
            consultationId,
            requestId: role === 'guest' ? requestIdParam : undefined,
          }),
        })

        const data = (await response.json()) as {
          token?: string
          error?: string
          uid?: number
          channelName?: string
        }

        if (!response.ok || !data.token) {
          throw new Error(data.error || 'Não foi possível gerar o token.')
        }

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client
        handleAgoraEvents(client)

        await client.join(
          APP_ID,
          data.channelName || channelName,
          data.token,
          data.uid ?? numericUidForRequest,
        )

        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
        const [audioTrack, videoTrack] = tracks

        localAudioTrackRef.current = audioTrack
        localVideoTrackRef.current = videoTrack

        const container = localPreviewRef.current
        if (container) {
          container.innerHTML = ''
          videoTrack.play(container)
        }

        await client.publish(tracks)

        // CRÍTICO: Verificar usuários que já estão no canal
        // Se o web entra primeiro, ele não recebe user-published quando o mobile entra depois
        const checkExistingUsers = async () => {
          // Usar for...of para aguardar operações assíncronas corretamente
          for (const existingUser of client.remoteUsers) {
            try {
              // Se o usuário já tem vídeo publicado, fazer subscribe
              if (existingUser.hasVideo) {
                const videoSubscriptionKey = `${existingUser.uid}-video`
                if (!subscribedUsersRef.current.has(videoSubscriptionKey)) {
                  await client.subscribe(existingUser, 'video')
                  subscribedUsersRef.current.add(videoSubscriptionKey)
                  // Aguardar um pouco para o track ser adicionado
                  await new Promise((resolve) => setTimeout(resolve, 200))
                  if (!existingUser.videoTrack) {
                    console.warn(
                      '⚠️ [WEB] Vídeo track não disponível após subscribe:',
                      existingUser.uid,
                    )
                  }
                }
              }

              // Se o usuário já tem áudio publicado, fazer subscribe
              if (existingUser.hasAudio) {
                const audioSubscriptionKey = `${existingUser.uid}-audio`
                if (!subscribedUsersRef.current.has(audioSubscriptionKey)) {
                  await client.subscribe(existingUser, 'audio')
                  subscribedUsersRef.current.add(audioSubscriptionKey)
                  // Aguardar um pouco para o track ser adicionado
                  await new Promise((resolve) => setTimeout(resolve, 200))
                  if (existingUser.audioTrack) {
                    try {
                      await existingUser.audioTrack.play()
                    } catch (error) {
                      console.error('❌ [WEB] Erro ao reproduzir áudio:', error)
                    }
                  } else {
                    console.warn(
                      '⚠️ [WEB] Áudio track não disponível após subscribe:',
                      existingUser.uid,
                    )
                  }
                }
              }

              // Atualizar mapeamento de UID para userId
              const agoraUidNum = Number(existingUser.uid)
              const userId = getUserIdFromAgoraUid(agoraUidNum)
              if (userId) {
                uidToUserIdMapRef.current.set(agoraUidNum, userId)
                // Buscar nome do usuário se ainda não tiver
                if (!userNamesMapRef.current.has(userId)) {
                  fetchUserName(userId)
                }
              }

              // Adicionar usuário ao estado
              setRemoteUsers((prev) => {
                const exists = prev.some(
                  (item) => String(item.uid) === String(existingUser.uid),
                )
                if (!exists) {
                  return [...prev, existingUser]
                }
                return prev
              })
            } catch (error) {
              console.error(
                '❌ [WEB] Erro ao processar usuário existente:',
                error,
              )
            }
          }

          // Renderizar após verificar usuários existentes (com debounce)
          if (renderTimeoutRef.current) {
            clearTimeout(renderTimeoutRef.current)
          }
          renderTimeoutRef.current = setTimeout(() => {
            renderRemoteUsers()
          }, 500)
        }

        // Verificar imediatamente após ingressar
        setTimeout(() => {
          checkExistingUsers()
        }, 1000)

        // Verificar periodicamente a cada 2 segundos para pegar usuários que entram depois
        checkUsersIntervalRef.current = setInterval(() => {
          checkExistingUsers()
        }, 2000)
      } catch (error) {
        // Limpar estado em caso de erro
        await resetAgoraState()
        // Limpar mapa de reprodução
        playingVideoTracksRef.current.clear()
        // Limpar timeout de renderização
        if (renderTimeoutRef.current) {
          clearTimeout(renderTimeoutRef.current)
          renderTimeoutRef.current = null
        }
        // Aguardar um pouco antes de permitir nova tentativa
        await new Promise((resolve) => setTimeout(resolve, 500))
        throw error
      }
    },
    [
      agoraUid,
      callId,
      consultationId,
      currentUser,
      handleAgoraEvents,
      resetAgoraState,
      requestIdParam,
      renderRemoteUsers,
      getUserIdFromAgoraUid,
      fetchUserName,
    ],
  )

  useEffect(() => {
    if (!currentUser) return

    let cancelled = false

    const loadCall = async () => {
      setLoading(true)
      try {
        const result = await getVideoCall(consultationId, callId)

        if (result.error || !result.call) {
          throw new Error(
            result.error || 'Chamada não encontrada ou já encerrada.',
          )
        }

        const data = result.call

        if (data.status === 'ended') {
          throw new Error('Esta chamada já foi encerrada.')
        }

        if (roleParam === 'host') {
          if (data.hostId !== currentUser.id) {
            throw new Error(
              'Você não possui permissão para entrar como host nesta chamada.',
            )
          }
        } else {
          // Para guest, verificar se há requestId
          if (!requestIdParam) {
            throw new Error('Solicitação inválida. Refaça o pedido de entrada.')
          }
          const requestRef = doc(
            firestore,
            'consultations',
            consultationId,
            'videoCalls',
            callId,
            'requests',
            requestIdParam,
          )
          const requestSnap = await getDoc(requestRef)
          if (!requestSnap.exists()) {
            throw new Error(
              'Solicitação não encontrada. Refaça o pedido de entrada.',
            )
          }
          const requestData = requestSnap.data() as JoinRequest
          if (requestData.patientId !== currentUser.id) {
            throw new Error('Solicitação pertence a outro usuário.')
          }
          if (requestData.status !== 'accepted') {
            throw new Error('Sua solicitação ainda não foi aprovada.')
          }
        }

        if (!cancelled) {
          setCallData(data)
        }
      } catch (error) {
        // Erro ao carregar chamada - já tratado pelo setErrorMessage
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Erro ao carregar chamada.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCall()

    return () => {
      cancelled = true
    }
  }, [consultationId, callId, currentUser, roleParam, requestIdParam])

  useEffect(() => {
    if (
      !callData ||
      !currentUser ||
      joinedRef.current ||
      !agoraUid ||
      !callData.channelName
    )
      return

    // Resetar erro se estamos tentando uma chamada diferente
    if (lastAttemptedCallIdRef.current !== callData.id) {
      hasErroredRef.current = false
      lastAttemptedCallIdRef.current = callData.id
    }

    // Não tentar novamente se já houve um erro nesta chamada (evita loop infinito)
    if (hasErroredRef.current) {
      return
    }

    // Evitar múltiplas tentativas simultâneas
    if (joiningRef.current) {
      return
    }

    // Verificar se já existe um cliente conectado
    const existingClient = clientRef.current
    if (existingClient && existingClient.connectionState !== 'DISCONNECTED') {
      return
    }

    joiningRef.current = true

    joinAgoraChannel(callData.channelName, roleParam)
      .then(() => {
        joinedRef.current = true
        joiningRef.current = false
        hasErroredRef.current = false
        setErrorMessage(null)
      })
      .catch((error) => {
        joinedRef.current = false
        joiningRef.current = false
        hasErroredRef.current = true
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Erro ao ingressar na chamada.',
        )
      })

    // Cleanup: resetar flags se o componente for desmontado
    return () => {
      joiningRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agoraUid,
    callData?.channelName,
    callData?.id,
    currentUser?.id,
    roleParam,
  ])

  // Mapear nomes dos participantes automaticamente
  useEffect(() => {
    if (!callData) return

    const newMap = new Map<string, string>()

    // Mapear o host
    if (callData.hostId && callData.hostName) {
      newMap.set(callData.hostId, callData.hostName)
      userNamesMapRef.current.set(callData.hostId, callData.hostName)
    }

    // Buscar requests aceitos para mapear participantes
    const acceptedQuery = query(
      collection(
        firestore,
        'consultations',
        consultationId,
        'videoCalls',
        callData.id,
        'requests',
      ),
      where('status', '==', 'accepted'),
    )

    const unsubscribe = onSnapshot(
      acceptedQuery,
      (snapshot) => {
        snapshot.docs.forEach((requestDoc) => {
          const requestData = requestDoc.data() as JoinRequest
          if (requestData.patientId && requestData.patientName) {
            newMap.set(requestData.patientId, requestData.patientName)
            userNamesMapRef.current.set(
              requestData.patientId,
              requestData.patientName,
            )
          }
        })

        // Atualizar o estado com todos os nomes
        setUserNamesMap((prev) => {
          const updatedMap = new Map(prev)
          newMap.forEach((name, userId) => {
            updatedMap.set(userId, name)
          })
          return updatedMap
        })
      },
      () => {
        // Ignorar erros ao buscar requests
      },
    )

    return () => {
      unsubscribe()
    }
  }, [callData, consultationId])

  // Listener para requests pendentes (apenas para host)
  useEffect(() => {
    if (!callData || roleParam !== 'host') return

    const pendingQuery = query(
      collection(
        firestore,
        'consultations',
        consultationId,
        'videoCalls',
        callData.id,
        'requests',
      ),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
    )

    hostRequestsListenerRef.current = onSnapshot(pendingQuery, (snapshot) => {
      const requests = snapshot.docs.map((requestDoc) => ({
        id: requestDoc.id,
        ...(requestDoc.data() as Omit<JoinRequestSnapshot, 'id' | 'ref'>),
        ref: requestDoc.ref,
      }))

      setIncomingRequest((previous) => {
        if (requests.length === 0) {
          return null
        }
        if (!previous) {
          return requests[0]
        }
        const stillExists = requests.find(
          (request) => request.id === previous.id,
        )
        return stillExists ?? requests[0]
      })
    })

    return () => {
      if (hostRequestsListenerRef.current) {
        hostRequestsListenerRef.current()
        hostRequestsListenerRef.current = null
      }
    }
  }, [callData, consultationId, roleParam])

  const acceptRequest = useCallback(async () => {
    if (!incomingRequest) return
    try {
      await updateDoc(incomingRequest.ref, {
        status: 'accepted',
        respondedAt: serverTimestamp(),
      })
      // Verificar se o documento foi atualizado corretamente após um pequeno delay
      setTimeout(async () => {
        try {
          const requestSnap = await getDoc(incomingRequest.ref)
          if (requestSnap.exists()) {
            // Verificação silenciosa do request após aceitar
          }
        } catch (error) {
          console.error('❌ [WEB] Erro ao verificar request:', error)
        }
      }, 500)

      setIncomingRequest(null)
    } catch (error) {
      console.error('❌ [WEB] Erro ao aceitar request:', error)
      throw error
    }
  }, [incomingRequest])

  const denyRequest = useCallback(async () => {
    if (!incomingRequest) return
    await updateDoc(incomingRequest.ref, {
      status: 'denied',
      respondedAt: serverTimestamp(),
    })
    setIncomingRequest(null)
  }, [incomingRequest])

  const leaveCall = useCallback(
    async (endForAll = false) => {
      // Mostrar loading imediatamente ao clicar em encerrar
      const mainLoadingToastId = toast.loading('Encerrando chamada...')

      try {
        let audioUrl: string | undefined

        // Parar gravação antes de encerrar a chamada
        if (isRecording) {
          toast.updateLoading(
            mainLoadingToastId,
            'Parando gravação e salvando áudio...',
          )
          try {
            // Limpar ref antes de parar
            recordingBlobRef.current = null

            stopRecording()

            // Aguardar o blob estar disponível (máximo 10 segundos)
            let attempts = 0
            const maxAttempts = 100 // 100 tentativas de 100ms = 10 segundos
            let finalBlob: Blob | null = null

            while (!finalBlob && attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 100))
              attempts++

              // Verificar ref primeiro (mais confiável)
              const refBlob = recordingBlobRef.current
              if (refBlob && (refBlob as Blob).size > 0) {
                finalBlob = refBlob
                break
              }

              // Fallback: verificar estado do hook
              if (recordingBlob && recordingBlob.size > 0) {
                finalBlob = recordingBlob
                recordingBlobRef.current = recordingBlob
                break
              }
            }

            // Fazer upload do áudio se houver blob
            if (finalBlob && finalBlob.size > 0) {
              toast.updateLoading(
                mainLoadingToastId,
                'Fazendo upload do áudio...',
              )
              const uploadResult = await uploadAudioFile(
                finalBlob,
                consultationId,
              )

              if (uploadResult.error) {
                toast.updateLoading(
                  mainLoadingToastId,
                  `Erro ao fazer upload do áudio: ${uploadResult.error}`,
                  'error',
                )
                // Continuar mesmo se o upload falhar
              } else if (uploadResult.url) {
                audioUrl = uploadResult.url
                toast.updateLoading(
                  mainLoadingToastId,
                  'Áudio salvo! Finalizando...',
                )
              }
            } else {
              toast.updateLoading(
                mainLoadingToastId,
                'Nenhum áudio gravado. Finalizando...',
              )
            }
          } catch {
            toast.error('Erro ao processar gravação de áudio')
          }
        }

        if (callData && (isHostRole || endForAll)) {
          toast.updateLoading(mainLoadingToastId, 'Encerrando chamada...')
          await endVideoCall(consultationId, callData.id)

          // Host encerrando a chamada para todos:
          // marcar a consulta como concluída e remover autorização do paciente
          const updateData: {
            status: string
            patientAuthorized: boolean
            audioUrl?: string
          } = {
            status: 'COMPLETED',
            patientAuthorized: false,
          }

          // Incluir audioUrl apenas se houver uma URL válida
          if (audioUrl) {
            updateData.audioUrl = audioUrl
          }

          toast.updateLoading(mainLoadingToastId, 'Atualizando consulta...')
          const result = await updateConsultation(consultationId, updateData)

          if (!result.success) {
            console.error(
              'Erro ao atualizar consulta para COMPLETED ao encerrar chamada:',
              result.error,
            )
            toast.updateLoading(
              mainLoadingToastId,
              'Erro ao atualizar consulta',
              'error',
            )
          } else {
            // Iniciar transcrição em background se houver URL de áudio
            if (audioUrl) {
              try {
                const payload = JSON.stringify({
                  consultationId,
                  audioUrl,
                  audioChannelCount: 2,
                })

                if (
                  typeof navigator !== 'undefined' &&
                  'sendBeacon' in navigator
                ) {
                  const blob = new Blob([payload], {
                    type: 'application/json',
                  })
                  navigator.sendBeacon('/api/transcribe', blob)
                } else {
                  fetch('/api/transcribe', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: payload,
                    keepalive: true,
                  }).catch(() => {
                    // Erro silencioso - transcrição pode ser iniciada depois
                  })
                }
              } catch {
                // Erro silencioso - transcrição pode ser iniciada depois
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao encerrar chamada:', error)
        toast.updateLoading(
          mainLoadingToastId,
          'Erro ao encerrar chamada',
          'error',
        )
      } finally {
        try {
          await resetAgoraState()
          toast.updateLoading(
            mainLoadingToastId,
            'Redirecionando...',
            'success',
          )
          // Aguardar um pouco para o usuário ver a mensagem de sucesso
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error('Erro ao resetar estado:', error)
        }
        router.push('/agenda')
      }
    },
    [
      callData,
      consultationId,
      isHostRole,
      isRecording,
      recordingBlob,
      resetAgoraState,
      router,
      stopRecording,
      toast,
    ],
  )

  const toggleCamera = useCallback(async () => {
    if (!localVideoTrackRef.current) return

    try {
      const videoTrack = localVideoTrackRef.current

      if (isCameraOn) {
        // Desativar câmera - apenas desabilitar
        await videoTrack.setEnabled(false)
        setIsCameraOn(false)
      } else {
        // Reativar câmera
        await videoTrack.setEnabled(true)
        setIsCameraOn(true)
      }
    } catch {
      // Ignorar erros ao alternar câmera
    }
  }, [isCameraOn])

  // useEffect para gerenciar a reprodução do vídeo quando isCameraOn muda
  // Isso evita conflitos entre React e manipulação direta do DOM
  useEffect(() => {
    const videoTrack = localVideoTrackRef.current
    const container = localPreviewRef.current

    if (!videoTrack || !container || !isCameraOn) return

    // Verificar se já está reproduzindo antes de tentar reproduzir novamente
    if (videoTrack.isPlaying) {
      return
    }

    // Usar setTimeout para garantir que o React terminou de renderizar
    const timer = setTimeout(async () => {
      try {
        // Chamar play() - o Agora SDK gerencia os elementos DOM automaticamente
        await videoTrack.play(container)
      } catch {
        // Ignorar erros silenciosamente
      }
    }, 100) // Pequeno delay para garantir que o React terminou

    return () => {
      clearTimeout(timer)
    }
  }, [isCameraOn])

  const toggleMicrophone = useCallback(async () => {
    if (!localAudioTrackRef.current) return
    if (isMicrophoneOn) {
      await localAudioTrackRef.current.setEnabled(false)
      setIsMicrophoneOn(false)
    } else {
      await localAudioTrackRef.current.setEnabled(true)
      setIsMicrophoneOn(true)
    }
  }, [isMicrophoneOn])

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragStateRef.current.dragging) return

    const preview = localPreviewRef.current
    const width = preview?.offsetWidth ?? 0
    const height = preview?.offsetHeight ?? 0

    const nextX = event.clientX - dragStateRef.current.offsetX
    const nextY = event.clientY - dragStateRef.current.offsetY

    const maxX = window.innerWidth - width - 16
    const maxY = window.innerHeight - height - 16

    setLocalPosition({
      x: clamp(nextX, 16, Math.max(maxX, 16)),
      y: clamp(nextY, 16, Math.max(maxY, 16)),
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!dragStateRef.current.dragging) return
    dragStateRef.current.dragging = false
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const preview = localPreviewRef.current
      if (!preview) return

      dragStateRef.current.dragging = true
      dragStateRef.current.offsetX = event.clientX - localPosition.x
      dragStateRef.current.offsetY = event.clientY - localPosition.y

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [handlePointerMove, handlePointerUp, localPosition.x, localPosition.y],
  )

  const { handleSubmit, control, reset, setValue } =
    useForm<RequestConsultationsData>({
      resolver: zodResolver(RequestConsultationsSchema),
      defaultValues: {
        specialty: '',
        reason: '',
        numberConsultations: '1',
      },
    })

  // Observar mudanças no checkbox de responsável
  useEffect(() => {
    if (isResponsibleForConsultation && currentDoctor?.specialty) {
      // Se marcou como responsável, preencher com a especialidade do médico
      setValue('specialty', currentDoctor.specialty)
    } else if (!isResponsibleForConsultation) {
      // Se desmarcou, limpar o campo (opcional - pode manter o valor)
      // setValue('speciality', '')
    }
  }, [isResponsibleForConsultation, currentDoctor?.specialty, setValue])

  const onSubmit = useCallback(
    async (data: RequestConsultationsData) => {
      if (!currentUser?.id) {
        toast.error('Usuário não autenticado')
        return
      }

      if (!patientId) {
        toast.error('Não foi possível identificar o paciente na chamada')
        return
      }

      const loadingToastId = toast.loading(
        'Criando solicitação de consulta complementar...',
      )

      try {
        const requestData: CreateRequestConsultationData = {
          consultationId: String(consultationId),
          doctorId: currentUser.id,
          patientId,
          specialty: data.specialty,
          responsible: isResponsibleForConsultation,
          numberConsultations: '1',
          reason: data.reason,
        }

        const result = await createRequestConsultation(requestData)

        if (result.error) {
          toast.updateLoading(loadingToastId, result.error, 'error')
          return
        }

        toast.updateLoading(
          loadingToastId,
          'Solicitação de consulta complementar criada com sucesso!',
          'success',
        )
        reset()
        setIsComplementaryConsultationOpen(false)
        setIsResponsibleForConsultation(false)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Erro ao criar solicitação de consulta complementar'
        toast.updateLoading(loadingToastId, errorMessage, 'error')
      }
    },
    [
      consultationId,
      currentUser?.id,
      patientId,
      isResponsibleForConsultation,
      reset,
      toast,
    ],
  )

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-purple-50">
        Carregando sala...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center text-slate-700">
        <h1 className="text-2xl font-semibold text-slate-900">
          Não foi possível iniciar a chamada
        </h1>
        <p className="max-w-md text-sm text-slate-600">{errorMessage}</p>
        <Button onClick={() => router.push('/agenda')}>
          Voltar para a agenda
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white">
      {/* Botão de alternar visualização no canto superior direito - apenas para host */}
      {isHostRole && !isSplitView && (
        <div
          className={`pointer-events-none absolute ${isSplitView ? 'right-[53%] top-10' : 'right-6 top-6'} z-50`}
        >
          <Button
            variant="ghost"
            className={`pointer-events-auto h-10 w-10 rounded-full ${isSplitView ? 'bg-purple-100 text-purple-700 hover:bg-purple-700/90 hover:text-white' : 'bg-white/80 text-purple-700 hover:bg-purple-700/90 hover:text-white'}`}
            onClick={() => setIsSplitView(!isSplitView)}
          >
            {isSplitView ? <Maximize /> : <LayoutGrid />}
          </Button>
        </div>
      )}
      {/* Modo Split: Câmeras à esquerda, conteúdo à direita */}
      {isSplitView ? (
        <div className="flex h-full w-full">
          {/* Lado esquerdo - Câmeras divididas ao meio + controles */}
          <div className="flex w-1/2 flex-col overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
            {/* Câmera remota - Metade superior */}
            <div
              ref={remoteVideoContainerRef}
              className={cn(
                'flex h-1/2 w-full items-center justify-center p-4',
                remoteUsers.length === 0 && 'bg-purple-800/40',
              )}
            >
              {remoteUsers.length === 0 && (
                <div className="pointer-events-none flex flex-col items-center justify-center gap-4 text-center text-purple-100">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-semibold uppercase shadow-lg">
                    {userInitials}
                  </div>
                  <div className="max-w-md space-y-2">
                    <p className="text-lg font-semibold">
                      Aguardando participantes
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Câmera local - Espaço restante acima dos controles */}
            <div className="flex flex-1 items-center justify-center p-4 pb-2">
              <div
                ref={localPreviewRef}
                className={cn(
                  'flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-900/80 shadow-xl',
                  isCameraOn
                    ? ''
                    : 'items-center justify-center text-slate-200/80',
                )}
              >
                {!isCameraOn && (
                  <span className="text-sm font-medium">Câmera desligada</span>
                )}
              </div>
            </div>

            {/* Controles na parte inferior do lado esquerdo */}
            <div className="pointer-events-none flex flex-wrap items-center justify-between gap-4 bg-black/40 px-4 py-3">
              <div className="pointer-events-auto flex flex-col text-xs">
                <span className="font-semibold">
                  {isHostRole ? 'Sala em andamento' : 'Participando'}
                </span>
                <span className="text-xs text-white/70">
                  {participantDisplayName}
                </span>
              </div>
              <div className="pointer-events-auto flex items-center gap-2">
                {/* Indicador de gravação */}
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <Circle className="animate-pulse fill-red-500 text-red-500" />
                    {recordingDuration > 0 && (
                      <span className="text-xs text-white/90">
                        {Math.floor(recordingDuration / 60)}:
                        {String(recordingDuration % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  className={cn(
                    'h-10 w-10 rounded-full bg-white/80 text-purple-700 hover:bg-white/50',
                  )}
                  onClick={toggleCamera}
                >
                  {isCameraOn ? <Video /> : <VideoOff />}
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    'h-10 w-10 rounded-full bg-white/80 text-purple-700 hover:bg-white/50',
                  )}
                  onClick={toggleMicrophone}
                >
                  {isMicrophoneOn ? <Mic /> : <MicOff />}
                </Button>
                <Button
                  className="h-10 rounded-full bg-red-500 px-4 text-sm text-white hover:bg-red-500/90"
                  onClick={() => setLeaveDialogOpen(true)}
                >
                  {isHostRole ? 'Encerrar' : 'Sair'}
                </Button>
              </div>
            </div>
          </div>

          {isComplementaryConsultationOpen ? (
            <div className="flex h-full w-2/3 flex-col overflow-y-auto bg-white">
              <div className="mt-10 flex flex-col gap-y-10 px-10">
                <div className="flex items-center gap-x-4">
                  <div
                    className="cursor-pointer text-primary-500 hover:text-primary-500/60"
                    onClick={handleOpenComplementaryConsultation}
                  >
                    <ArrowLeft size={32} />
                  </div>
                  <h3 className="text-2xl font-medium text-primary-500">
                    Solicitar consulta complementar
                  </h3>
                </div>
                <div className="flex flex-col gap-y-8">
                  <div className="flex flex-col gap-y-2">
                    <SelectField
                      control={control}
                      label="Especialidade"
                      name="specialty"
                      options={getAllSpecialties()}
                      placeholder="Selecione a especialidade"
                      disabled={isResponsibleForConsultation}
                    />
                    <div
                      className="ml-4 flex cursor-pointer items-center gap-x-2"
                      onClick={handleResponsibleForConsultation}
                    >
                      {isResponsibleForConsultation ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-[2px] border-2 border-gray-500 text-gray-500">
                          <Check size={16} />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-[2px] border-2 border-gray-500"></div>
                      )}
                      <p className="text-gray-500">
                        Eu serei o responsável pelo atendimento
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-8">
                    {/* <div className="flex w-1/2 gap-x-3">
                      <div className="flex w-1/2">
                        <SelectField
                          control={control}
                          label="Frequência"
                          name="frequency"
                          options={[
                            { value: '1', label: '1' },
                            { value: '2', label: '2' },
                            { value: '3', label: '3' },
                            { value: '4', label: '4' },
                            { value: '5', label: '5' },
                            { value: '6', label: '6' },
                            { value: '7', label: '7' },
                            { value: '8', label: '8' },
                            { value: '9', label: '9' },
                            { value: '10', label: '10' },
                          ]}
                        />
                      </div>
                      <SelectField
                        control={control}
                        name="frequencyType"
                        options={[
                          { value: 'Diaria', label: 'Diaria' },
                          { value: 'Semanal', label: 'Semanal' },
                          { value: 'Mensal', label: 'Mensal' },
                        ]}
                        placeholder="Selecione o tipo de frequência"
                      />
                    </div> */}
                    {/* <div className="flex w-1/2">
                      <SelectField
                        control={control}
                        label="Consultas necessárias"
                        placeholder="Selecione o número de consultas"
                        name="numberConsultations"
                        options={[
                          { value: '1', label: '1' },
                          { value: '2', label: '2' },
                          { value: '3', label: '3' },
                          { value: '4', label: '4' },
                          { value: '5', label: '5' },
                          { value: '6', label: '6' },
                          { value: '7', label: '7' },
                          { value: '8', label: '8' },
                          { value: '9', label: '9' },
                          { value: '10', label: '10' },
                        ]}
                      />
                    </div> */}
                  </div>
                  <TextareaField
                    control={control}
                    label="Justificativa"
                    name="reason"
                    placeholder="Digite o motivo da consulta complementar"
                  />
                </div>
                <div className="flex items-center justify-end gap-x-4">
                  <Button
                    variant="outline"
                    onClick={handleOpenComplementaryConsultation}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit(onSubmit)} variant="success">
                    Solicitar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Lado direito - Conteúdo scrollável */}
              <div className="flex h-full w-2/3 flex-col overflow-y-auto bg-white">
                <div className="mt-10 flex flex-col gap-y-8 px-10">
                  <div className="flex flex-row items-center justify-between">
                    <div className="pointer-events-none">
                      <Button
                        variant="ghost"
                        className={`pointer-events-auto h-10 w-10 rounded-full ${isSplitView ? 'bg-purple-100 text-purple-700 hover:bg-purple-700/90 hover:text-white' : 'bg-white/80 text-purple-700 hover:bg-purple-700/90 hover:text-white'}`}
                        onClick={() => setIsSplitView(!isSplitView)}
                      >
                        {isSplitView ? <Maximize /> : <LayoutGrid />}
                      </Button>
                    </div>
                    <div className="flex flex-row items-center gap-x-4">
                      {currentDoctor?.typeOfCredential === 'CRM' && (
                        <Button
                          variant="outline"
                          onClick={() => setIsPrescriptionModalOpen(true)}
                        >
                          Prescrever com Memed
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setIsDischargeModalOpen(true)}
                        className="border-green-500 text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canDischarge}
                        title={
                          hasDischargedPlan
                            ? 'Alta já realizada'
                            : !isCareCoordinator
                              ? 'Apenas o médico do paciente pode dar alta'
                              : !currentPlan
                                ? 'Nenhum plano terapêutico encontrado'
                                : 'Dar alta ao paciente'
                        }
                      >
                        {hasDischargedPlan ? 'Alta realizada' : 'Dar alta'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleOpenComplementaryConsultation}
                      >
                        Solicitar consulta complementar
                      </Button>
                    </div>
                  </div>

                  <SoapNotesPanel
                    activeTab={activeTab}
                    onChangeTab={setActiveTab}
                    soapData={soapData}
                    editingFields={editingFields}
                    startEditing={startEditing}
                    saveField={saveField}
                    updateLocalData={updateLocalData}
                    patientId={patientId}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Modo Fullscreen: Visualização atual */
        <>
          <div
            ref={remoteVideoContainerRef}
            className={cn(
              'flex h-full w-full flex-1 items-center justify-center p-6',
              remoteUsers.length === 0 && 'bg-purple-800/40',
            )}
          >
            {remoteUsers.length === 0 && (
              <div className="pointer-events-none flex flex-col items-center justify-center gap-4 text-center text-purple-100">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-purple-700 text-3xl font-semibold uppercase shadow-lg">
                  {userInitials}
                </div>
                <div className="max-w-xl space-y-2">
                  <p className="text-2xl font-semibold">
                    Sala aguardando outros participantes
                  </p>
                  <p className="text-sm text-purple-200">
                    Assim que alguém entrar e tiver a solicitação aprovada, o
                    vídeo será exibido automaticamente.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            ref={localPreviewRef}
            onPointerDown={handlePointerDown}
            className={cn(
              'group absolute z-30 flex h-40 w-64 cursor-grab flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-900/80 shadow-xl transition-shadow hover:shadow-2xl active:cursor-grabbing',
              isCameraOn ? '' : 'items-center justify-center text-slate-200/80',
            )}
            style={{ top: localPosition.y, left: localPosition.x }}
          >
            {!isCameraOn && (
              <span className="text-sm font-medium">Câmera desligada</span>
            )}
          </div>
        </>
      )}
      {/* Controles apenas no modo fullscreen */}
      {!isSplitView && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-6 bg-black/40 px-6 py-4">
          <div className="pointer-events-auto flex flex-col text-sm">
            <span className="font-semibold">
              {isHostRole ? 'Sala em andamento' : 'Participando da chamada'}
            </span>
            <span className="text-white/70">{participantDisplayName}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            {/* Indicador de gravação */}
            {isRecording && (
              <div className="flex items-center gap-2">
                <Circle className="animate-pulse fill-red-500 text-red-500" />
                {recordingDuration > 0 && (
                  <span className="text-sm font-semibold text-white">
                    {Math.floor(recordingDuration / 60)}:
                    {String(recordingDuration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              className={cn(
                'h-12 w-12 rounded-full bg-white/80 text-purple-700 hover:bg-white/50',
              )}
              onClick={toggleCamera}
            >
              {isCameraOn ? <Video /> : <VideoOff />}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'h-12 w-12 rounded-full bg-white/80 text-purple-700 hover:bg-white/50',
              )}
              onClick={toggleMicrophone}
            >
              {isMicrophoneOn ? <Mic /> : <MicOff />}
            </Button>
            <Button
              className="h-12 rounded-full bg-red-500 px-6 text-white hover:bg-red-500/90"
              onClick={() => setLeaveDialogOpen(true)}
            >
              {isHostRole ? 'Encerrar' : 'Sair'}
            </Button>
          </div>
        </div>
      )}
      <Dialog
        open={!!incomingRequest}
        onOpenChange={(open) => !open && setIncomingRequest(null)}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#792EBD]">
              {incomingRequest?.patientName} gostaria de ingressar na chamada.
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Libere a entrada para permitir que o paciente participe da
              consulta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={denyRequest}>
              Ainda não estou pronto
            </Button>
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={acceptRequest}
            >
              Permitir entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#792EBD]">
              {isHostRole
                ? 'Tem certeza que deseja encerrar a chamada para todos?'
                : 'Tem certeza que deseja sair da chamada?'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {isHostRole
                ? 'Ao encerrar, todos os participantes serão desconectados imediatamente.'
                : 'Você poderá solicitar a entrada novamente se precisar retornar.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setLeaveDialogOpen(false)}
              className="text-[#792EBD]"
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-500/90"
              onClick={() => leaveCall(isHostRole)}
            >
              {isHostRole ? 'Encerrar chamada' : 'Sair da chamada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {callData && currentUser?.id && (
        <>
          <PrescriptionModal
            isOpen={isPrescriptionModalOpen}
            setIsOpen={setIsPrescriptionModalOpen}
            doctorId={currentUser?.id ?? ''}
            patientId={callData.patientId}
            consultationId={consultationId}
            onSuccess={() => {}}
          />
          {currentDoctor && currentPlan && (
            <DischargePlanModal
              isOpen={isDischargeModalOpen}
              setIsOpen={setIsDischargeModalOpen}
              patientId={callData.patientId}
              planId={currentPlan.id}
              doctorId={currentDoctor.id}
              onSuccess={() => {
                router.refresh()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
