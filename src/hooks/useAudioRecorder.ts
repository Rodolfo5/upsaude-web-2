/**
 * 🎤 HOOK DE GRAVAÇÃO DE ÁUDIO
 *
 * Hook customizado para gerenciar gravação de áudio usando react-media-recorder
 *
 * Funcionalidades:
 * - Iniciar gravação
 * - Pausar/retomar gravação
 * - Parar gravação e obter blob
 * - Gerenciar estados de erro e permissões
 */

import { useEffect, useState } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'

interface UseAudioRecorderReturn {
  // Estados
  isRecording: boolean
  isPaused: boolean
  blob: Blob | null
  mediaBlobUrl: string | null
  error: string | null

  // Funções
  startRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => void
  clearBlob: () => void
}

/**
 * Hook para gerenciar gravação de áudio
 *
 * @returns Estado e funções para controlar gravação
 *
 * @example
 * ```tsx
 * const {
 *   isRecording,
 *   isPaused,
 *   blob,
 *   startRecording,
 *   pauseRecording,
 *   resumeRecording,
 *   stopRecording
 * } = useAudioRecorder()
 *
 * // Iniciar gravação
 * startRecording()
 *
 * // Pausar
 * pauseRecording()
 *
 * // Retomar
 * resumeRecording()
 *
 * // Parar e obter blob
 * stopRecording()
 * // blob estará disponível após stopRecording
 * ```
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [blob, setBlob] = useState<Blob | null>(null)

  const {
    status,
    startRecording: startMediaRecording,
    pauseRecording: pauseMediaRecording,
    resumeRecording: resumeMediaRecording,
    stopRecording: stopMediaRecording,
    mediaBlobUrl,
    error: recorderError,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    onStop: async (blobUrl: string, blob: Blob | undefined) => {
      // Quando a gravação para, o blob está disponível
      if (blob) {
        setBlob(blob)
      } else if (blobUrl) {
        // Fallback: converter URL para blob se necessário
        try {
          const response = await fetch(blobUrl)
          const fetchedBlob = await response.blob()
          setBlob(fetchedBlob)
        } catch (error) {
          console.error('Erro ao converter blob:', error)
        }
      }
    },
  })

  // Converter mediaBlobUrl para blob quando disponível
  useEffect(() => {
    if (mediaBlobUrl && status === 'stopped' && !blob) {
      fetch(mediaBlobUrl)
        .then((response) => response.blob())
        .then((fetchedBlob) => {
          setBlob(fetchedBlob)
        })
        .catch((error) => {
          console.error('Erro ao obter blob de mediaBlobUrl:', error)
        })
    }
  }, [mediaBlobUrl, status, blob])

  // Limpar blob quando iniciar nova gravação
  useEffect(() => {
    if (status === 'recording' && blob) {
      setBlob(null)
    }
  }, [status, blob])

  const startRecording = () => {
    try {
      setBlob(null) // Limpar blob anterior
      startMediaRecording()
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
    }
  }

  const pauseRecording = () => {
    try {
      pauseMediaRecording()
    } catch (error) {
      console.error('Erro ao pausar gravação:', error)
    }
  }

  const resumeRecording = () => {
    try {
      resumeMediaRecording()
    } catch (error) {
      console.error('Erro ao retomar gravação:', error)
    }
  }

  const stopRecording = () => {
    try {
      stopMediaRecording()
    } catch (error) {
      console.error('Erro ao parar gravação:', error)
    }
  }

  const clearBlob = () => {
    setBlob(null)
  }

  // Mapear status para estados mais amigáveis
  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const error = recorderError
    ? typeof recorderError === 'string'
      ? recorderError
      : (recorderError as Error)?.message || 'Erro na gravação'
    : null

  return {
    isRecording,
    isPaused,
    blob,
    mediaBlobUrl: mediaBlobUrl || null,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearBlob,
  }
}
