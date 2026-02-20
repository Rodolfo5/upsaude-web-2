/**
 * 🎤 SERVIÇO DE TRANSCRIÇÃO DE ÁUDIO
 *
 * Este serviço é responsável por transcrever áudios usando Google Speech-to-Text API.
 * Utiliza as credenciais do Firebase Admin para autenticação.
 *
 * Funcionalidades:
 * - Transcrever áudio a partir de URL do Firebase Storage
 * - Suporte para Português (Brasil) - pt-BR
 * - Tratamento de erros robusto
 * - Suporte para formato WebM
 *
 * ⚠️ IMPORTANTE:
 * - Requer variáveis de ambiente do Google Cloud configuradas
 * - Usar apenas em API Routes ou Server Components
 */

import { SpeechClient } from '@google-cloud/speech'

import { getAdminApp, adminStorage } from '@/config/firebase/firebaseAdmin'

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

/**
 * Resultado da transcrição
 */
export interface TranscriptionResult {
  transcription: string | null
  error: string | null
}

/**
 * Configura o cliente do Speech-to-Text usando credenciais do Firebase Admin
 */
async function getSpeechClient(): Promise<SpeechClient> {
  const adminApp = await getAdminApp()
  const projectId = adminApp.options.projectId

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY)

  const hasServiceAccountCredentials = clientEmail && privateKey

  const client = new SpeechClient(
    hasServiceAccountCredentials
      ? {
          projectId,
          credentials: {
            client_email: clientEmail,
            private_key: privateKey!,
          },
        }
      : {
          projectId,
        },
  )

  return client
}

/**
 * Baixa o arquivo de áudio do Firebase Storage
 */
async function downloadAudioFromStorage(
  audioUrl: string,
): Promise<Buffer | null> {
  try {
    await getAdminApp() // Garantir que Admin está inicializado
    const storage = adminStorage()
    const bucket = storage.bucket()

    // Extrair o caminho do arquivo da URL
    // Formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const urlObj = new URL(audioUrl)
    const encodedPath = urlObj.pathname.split('/o/')[1]

    if (!encodedPath) {
      throw new Error('URL do Storage inválida')
    }

    // Decodificar o caminho (pode estar codificado com %2F)
    const filePath = decodeURIComponent(encodedPath)
    const file = bucket.file(filePath)

    // Verificar se o arquivo existe
    const [exists] = await file.exists()
    if (!exists) {
      throw new Error('Arquivo de áudio não encontrado no Storage')
    }

    // Baixar o arquivo
    const [buffer] = await file.download()
    return buffer
  } catch (error) {
    console.error('Erro ao baixar áudio do Storage:', error)
    return null
  }
}

/**
 * Transcreve áudio a partir de uma URL do Firebase Storage
 *
 * @param audioUrl - URL do arquivo de áudio no Firebase Storage
 * @returns Texto transcrito ou erro
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  options?: { audioChannelCount?: number },
): Promise<TranscriptionResult> {
  try {
    if (!audioUrl) {
      return {
        transcription: null,
        error: 'URL do áudio é obrigatória',
      }
    }

    // Baixar áudio do Storage
    const audioBuffer = await downloadAudioFromStorage(audioUrl)
    if (!audioBuffer) {
      return {
        transcription: null,
        error: 'Erro ao baixar áudio do Storage',
      }
    }

    // Configurar cliente do Speech-to-Text
    const client = await getSpeechClient()

    // Configuração para reconhecimento de fala
    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000, // Taxa de amostragem comum para WebM
      languageCode: 'pt-BR', // Português (Brasil)
      alternativeLanguageCodes: ['pt-PT'], // Português alternativo
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
      model: 'latest_long', // Modelo otimizado para áudios longos
    }

    if (options?.audioChannelCount) {
      ;(config as { audioChannelCount?: number }).audioChannelCount =
        options.audioChannelCount
    }

    const audio = {
      content: audioBuffer.toString('base64'),
    }

    const request = {
      config,
      audio,
    }

    // Fazer a transcrição (long running para suportar áudios maiores)
    const [operation] = await client.longRunningRecognize(request)
    const [response] = await operation.promise()

    if (!response.results || response.results.length === 0) {
      return {
        transcription: null,
        error: 'Nenhum resultado de transcrição encontrado',
      }
    }

    // Combinar todos os resultados em um único texto
    const transcription = response.results
      .map((result) => {
        if (result.alternatives && result.alternatives.length > 0) {
          return result.alternatives[0].transcript
        }
        return ''
      })
      .join(' ')
      .trim()

    if (!transcription) {
      return {
        transcription: null,
        error: 'Transcrição vazia',
      }
    }

    return {
      transcription,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido na transcrição'
    return {
      transcription: null,
      error: errorMessage,
    }
  }
}
