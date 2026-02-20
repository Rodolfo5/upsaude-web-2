import type { ILocalAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseVideoCallRecorderProps {
  localAudioTrack: ILocalAudioTrack | null
  remoteAudioTracks: IRemoteAudioTrack[]
}

interface UseVideoCallRecorderReturn {
  // Estados
  isRecording: boolean
  isPaused: boolean
  blob: Blob | null
  error: string | null
  recordingDuration: number // em segundos

  // Funções
  startRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => void
  clearBlob: () => void
}

/**
 * Hook para gravar áudio de videochamada combinando local e remoto
 *
 * @param localAudioTrack - Track de áudio local (médico)
 * @param remoteAudioTracks - Array de tracks de áudio remotos (pacientes)
 * @returns Estado e funções para controlar gravação
 *
 * @example
 * ```tsx
 * const {
 *   isRecording,
 *   blob,
 *   startRecording,
 *   stopRecording
 * } = useVideoCallRecorder({
 *   localAudioTrack: localAudioTrackRef.current,
 *   remoteAudioTracks: remoteUsers.map(u => u.audioTrack).filter(Boolean)
 * })
 * ```
 */
export function useVideoCallRecorder({
  localAudioTrack,
  remoteAudioTracks,
}: UseVideoCallRecorderProps): UseVideoCallRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number>(0)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const requestDataIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const localSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const remoteSourcesRef = useRef<MediaStreamAudioSourceNode[]>([])

  // Limpar recursos quando o componente desmontar ou tracks mudarem
  useEffect(() => {
    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualizar conexões quando tracks mudarem durante a gravação
  useEffect(() => {
    if (isRecording && !isPaused && audioContextRef.current) {
      reconnectAudioSources()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAudioTrack, remoteAudioTracks, isRecording, isPaused])

  const cleanup = useCallback(() => {
    // Parar gravação se estiver ativa
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // Ignorar erros
      }
    }

    // Limpar intervalos
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    // Desconectar fontes de áudio
    localSourceRef.current?.disconnect()
    remoteSourcesRef.current.forEach((source) => source.disconnect())
    remoteSourcesRef.current = []

    // Fechar AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {
        // Ignorar erros ao fechar
      })
    }

    // Limpar refs
    mediaRecorderRef.current = null
    audioContextRef.current = null
    destinationRef.current = null
    chunksRef.current = []
    startTimeRef.current = null
    pausedTimeRef.current = 0
  }, [])

  const reconnectAudioSources = useCallback(() => {
    if (!audioContextRef.current || !destinationRef.current) return

    // Desconectar fontes antigas
    localSourceRef.current?.disconnect()
    remoteSourcesRef.current.forEach((source) => source.disconnect())
    remoteSourcesRef.current = []

    // Reconectar áudio local
    if (localAudioTrack) {
      try {
        const localStream = new MediaStream([
          localAudioTrack.getMediaStreamTrack(),
        ])
        const localSource =
          audioContextRef.current.createMediaStreamSource(localStream)
        localSource.connect(destinationRef.current)
        localSourceRef.current = localSource
      } catch (err) {
        console.error('Erro ao conectar áudio local:', err)
      }
    }

    // Reconectar áudios remotos
    remoteAudioTracks.forEach((remoteTrack) => {
      if (remoteTrack) {
        try {
          const remoteStream = new MediaStream([
            remoteTrack.getMediaStreamTrack(),
          ])
          const remoteSource =
            audioContextRef.current!.createMediaStreamSource(remoteStream)
          remoteSource.connect(destinationRef.current!)
          remoteSourcesRef.current.push(remoteSource)
        } catch (err) {
          console.error('Erro ao conectar áudio remoto:', err)
        }
      }
    })
  }, [localAudioTrack, remoteAudioTracks])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setBlob(null)
      chunksRef.current = []

      // Verificar se há pelo menos um track de áudio disponível
      if (!localAudioTrack && remoteAudioTracks.length === 0) {
        throw new Error('Nenhum áudio disponível para gravar')
      }

      // Criar AudioContext se não existir
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        audioContextRef.current = new AudioContextClass()
      }

      // Garantir que o AudioContext esteja ativo (evita estado "suspended" em alguns browsers)
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
        } catch {
          // Ignorar erros ao retomar AudioContext
        }
      }

      // Criar destino para o stream combinado
      if (!destinationRef.current) {
        destinationRef.current =
          audioContextRef.current.createMediaStreamDestination()
      }

      // Conectar áudio local (médico)
      if (localAudioTrack) {
        try {
          const localStream = new MediaStream([
            localAudioTrack.getMediaStreamTrack(),
          ])
          const localSource =
            audioContextRef.current.createMediaStreamSource(localStream)
          localSource.connect(destinationRef.current!)
          localSourceRef.current = localSource
        } catch {
          // Ignorar erros ao conectar áudio local
        }
      }

      // Conectar áudios remotos (pacientes)
      remoteAudioTracks.forEach((remoteTrack) => {
        if (remoteTrack) {
          try {
            const remoteStream = new MediaStream([
              remoteTrack.getMediaStreamTrack(),
            ])
            const remoteSource =
              audioContextRef.current!.createMediaStreamSource(remoteStream)
            remoteSource.connect(destinationRef.current!)
            remoteSourcesRef.current.push(remoteSource)
          } catch {
            // Ignorar erros ao conectar áudio remoto
          }
        }
      })

      // Verificar se há pelo menos uma fonte conectada
      if (!localSourceRef.current && remoteSourcesRef.current.length === 0) {
        throw new Error('Não foi possível conectar nenhuma fonte de áudio')
      }

      // Criar MediaRecorder com o stream combinado
      const combinedStream = destinationRef.current.stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg'

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Garantir que temos chunks antes de criar o blob
        if (chunksRef.current.length === 0) {
          setIsRecording(false)
          setIsPaused(false)
          setBlob(null)
          return
        }

        const finalBlob = new Blob(chunksRef.current, { type: mimeType })
        setBlob(finalBlob)
        setIsRecording(false)
        setIsPaused(false)
        setRecordingDuration(0)
        pausedTimeRef.current = 0

        // Limpar intervalos
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current)
          durationIntervalRef.current = null
        }

        // Limpar recursos após garantir que o blob foi setado
        // Aguardar um pouco para garantir que o React processou o setBlob
        setTimeout(() => {
          // Não limpar chunks aqui - eles podem ser necessários
          // Apenas limpar conexões de áudio
          localSourceRef.current?.disconnect()
          remoteSourcesRef.current.forEach((source) => source.disconnect())
          remoteSourcesRef.current = []
        }, 500)
      }

      mediaRecorder.onerror = () => {
        const errorMessage = 'Erro durante a gravação'
        setError(errorMessage)
      }

      // Iniciar gravação
      mediaRecorder.start() // sem timeslice; usaremos requestData manual
      mediaRecorderRef.current = mediaRecorder

      // Solicitar dados periodicamente para garantir chunks mesmo sem timeslice
      requestDataIntervalRef.current = setInterval(() => {
        try {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.requestData()
          }
        } catch {
          // Ignorar erros ao solicitar dados
        }
      }, 1000)

      // Iniciar contador de duração
      startTimeRef.current = Date.now() - pausedTimeRef.current * 1000
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current && !isPaused) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          setRecordingDuration(Math.floor(elapsed))
        }
      }, 1000)

      setIsRecording(true)
      setIsPaused(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao iniciar gravação'
      setError(errorMessage)
      cleanup()
    }
  }, [localAudioTrack, remoteAudioTracks, isPaused, cleanup])

  const pauseRecording = useCallback(() => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== 'recording'
    ) {
      return
    }

    try {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      // Pausar contador de duração
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      // Salvar tempo pausado
      if (startTimeRef.current) {
        pausedTimeRef.current += (Date.now() - startTimeRef.current) / 1000
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao pausar gravação'
      setError(errorMessage)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== 'recording'
    ) {
      return
    }

    try {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Retomar contador de duração
      startTimeRef.current = Date.now() - pausedTimeRef.current * 1000
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current && !isPaused) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          setRecordingDuration(Math.floor(elapsed))
        }
      }, 1000)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao retomar gravação'
      setError(errorMessage)
    }
  }, [isPaused])

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return
    }

    try {
      const state = mediaRecorderRef.current.state

      if (state === 'recording' || state === 'paused') {
        // Solicitar dados finais antes de parar
        if (state === 'recording') {
          mediaRecorderRef.current.requestData()
        }
        mediaRecorderRef.current.stop()
      }

      // Limpar intervalos
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      if (requestDataIntervalRef.current) {
        clearInterval(requestDataIntervalRef.current)
        requestDataIntervalRef.current = null
      }

      // NÃO limpar chunks ou recursos imediatamente
      // O onstop precisa processar os chunks para criar o blob
      // O cleanup será feito no onstop após criar o blob
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao parar gravação'
      setError(errorMessage)
      cleanup()
    }
  }, [cleanup])

  const clearBlob = useCallback(() => {
    setBlob(null)
  }, [])

  return {
    isRecording,
    isPaused,
    blob,
    error,
    recordingDuration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearBlob,
  }
}
