/* eslint-disable prettier/prettier */
/**
 * 🎥 API DE GERAÇÃO DE TOKEN RTC (AGORA)
 *
 * Fluxo suportado:
 * - Host solicita token para iniciar a chamada
 * - Convidados solicitam token após terem o pedido aprovado
 *
 * Validações principais:
 * - Verifica presença das variáveis de ambiente
 * - Confirma existência da chamada no Firestore
 * - Garante que apenas o host ou convidados aprovados recebam token
 */

import { RtcRole, RtcTokenBuilder } from 'agora-token'
import { NextResponse } from 'next/server'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'

// ====================================================================
// ⚙️ CONFIGURAÇÃO
// ====================================================================

const rawAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID
const rawAppCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE

if (!rawAppId || !rawAppCertificate) {
  throw new Error(
    '🚨 Variáveis de ambiente do Agora faltando: NEXT_PUBLIC_AGORA_APP_ID e NEXT_PUBLIC_AGORA_APP_CERTIFICATE',
  )
}

const AGORA_APP_ID: string = rawAppId
const AGORA_APP_CERTIFICATE: string = rawAppCertificate

// Tempo padrão (1h) para expiração do token e privilégios
const TOKEN_EXPIRATION_SECONDS = 60 * 60

// ====================================================================
// 📋 TIPOS
// ====================================================================

type TokenRole = 'host' | 'guest'

interface GenerateTokenPayload {
  callId: string
  channelName: string
  uid: string | number // Aceita string ou número para compatibilidade
  userId: string
  role: TokenRole
  requestId?: string
  consultationId?: string // Se presente, usa subcollection de consultas
}

interface TokenResponse {
  token: string | null
  error: string | null
}

// ====================================================================
// 🔎 VALIDAÇÃO AUXILIAR
// ====================================================================

function isTokenRole(value: unknown): value is TokenRole {
  return value === 'host' || value === 'guest'
}

// Função auxiliar para adicionar headers CORS
function addCorsHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

// ====================================================================
// 🚀 HANDLER PRINCIPAL
// ====================================================================

export async function POST(
  request: Request,
): Promise<NextResponse<TokenResponse>> {
  try {
    const payload = (await request.json()) as Partial<GenerateTokenPayload>

    const { callId, channelName, uid, userId, role, requestId } = payload

    if (
      !callId ||
      !channelName ||
      !uid ||
      !userId ||
      !role ||
      !isTokenRole(role)
    ) {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error:
              'Dados inválidos. Informe callId, channelName, userId, uid e role (host ou guest).',
          },
          { status: 400 },
        ),
      )
    }

    await getAdminApp()
    const db = adminFirestore()

    // Determinar se é uma chamada de consulta ou teste
    const isConsultationCall = !!payload.consultationId
    const callDocRef = isConsultationCall
      ? db
        .collection('consultations')
        .doc(payload.consultationId!)
        .collection('videoCalls')
        .doc(callId)
      : db.collection('testVideoCalls').doc(callId)

    const callSnapshot = await callDocRef.get()

    if (!callSnapshot.exists) {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'Chamada não encontrada ou já encerrada.',
          },
          { status: 404 },
        ),
      )
    }

    const callData = callSnapshot.data() as {
      hostId: string
      patientId?: string
      status?: string
    }

    if (callData.status === 'ended') {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'Chamada já encerrada.',
          },
          { status: 409 },
        ),
      )
    }

    if (role === 'host') {
      if (callData.hostId !== userId) {
        return addCorsHeaders(
          NextResponse.json(
            {
              token: null,
              error: 'Apenas o host pode solicitar token com role=host.',
            },
            { status: 403 },
          ),
        )
      }
    } else {
      // Para chamadas de consulta, o paciente precisa ter request aprovado
      if (isConsultationCall) {
        if (!requestId) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'requestId é obrigatório para convidados.',
              },
              { status: 400 },
            ),
          )
        }

        const requestDoc = await callDocRef
          .collection('requests')
          .doc(requestId)
          .get()

        if (!requestDoc.exists) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'Solicitação de entrada não encontrada.',
              },
              { status: 404 },
            ),
          )
        }

        const requestData = requestDoc.data() as {
          patientId: string
          status: 'pending' | 'accepted' | 'denied'
        }

        if (requestData.patientId !== userId) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'Solicitante não autorizado.',
              },
              { status: 403 },
            ),
          )
        }

        if (requestData.status !== 'accepted') {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error:
                  'Sua solicitação ainda não foi aprovada pelo médico responsável.',
              },
              { status: 409 },
            ),
          )
        }
      } else {
        // Para testVideoCalls, ainda usa o sistema de requests
        if (!requestId) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'requestId é obrigatório para convidados.',
              },
              { status: 400 },
            ),
          )
        }

        const requestDoc = await callDocRef
          .collection('requests')
          .doc(requestId)
          .get()

        if (!requestDoc.exists) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'Solicitação de entrada não encontrada.',
              },
              { status: 404 },
            ),
          )
        }

        const requestData = requestDoc.data() as {
          doctorId: string
          status: 'pending' | 'accepted' | 'denied'
        }

        if (requestData.doctorId !== userId) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'Solicitante não autorizado.',
              },
              { status: 403 },
            ),
          )
        }

        if (requestData.status !== 'accepted') {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error:
                  'Sua solicitação ainda não foi aprovada pelo médico responsável.',
              },
              { status: 409 },
            ),
          )
        }
      }
    }

    const currentTimestamp = Math.floor(Date.now() / 1000)
    const expirationTimestamp = currentTimestamp + TOKEN_EXPIRATION_SECONDS

    const agoraRole = RtcRole.PUBLISHER

    // Converter UID para número se for string numérica ou usar diretamente se já for número
    let numericUid: number
    if (typeof uid === 'string') {
      // Se for string numérica, converter para número
      const parsed = parseInt(uid, 10)
      if (!isNaN(parsed) && parsed.toString() === uid) {
        numericUid = parsed
      } else {
        // Se for string não numérica, gerar hash numérico
        let hash = 0
        for (let i = 0; i < uid.length; i++) {
          const char = uid.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash // Convert to 32-bit integer
        }
        numericUid = Math.max(10000, Math.abs(hash) % 2147483647)
      }
    } else {
      numericUid = uid
    }

    // Usar buildTokenWithUid para UIDs numéricos (recomendado pelo Agora)
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      numericUid,
      agoraRole,
      TOKEN_EXPIRATION_SECONDS,
      expirationTimestamp,
    )

    return addCorsHeaders(
      NextResponse.json(
        {
          token,
          error: null,
        },
        { status: 200 },
      ),
    )
  } catch (error) {
    console.error('Erro ao gerar token:', error)
    return addCorsHeaders(
      NextResponse.json(
        {
          token: null,
          error: 'Erro interno ao gerar token. Tente novamente.',
        },
        { status: 500 },
      ),
    )
  }
}

// Handler OPTIONS para CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
