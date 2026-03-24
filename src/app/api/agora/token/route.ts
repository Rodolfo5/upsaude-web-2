/* eslint-disable prettier/prettier */
/**
 * API de geração de token RTC (Agora).
 *
 * Fluxo suportado:
 * - Host solicita token para iniciar a chamada
 * - Convidados solicitam token após terem o pedido aprovado
 *
 * Validações principais:
 * - Verifica presença das variáveis de ambiente
 * - Confirma existência da chamada no Firestore
 * - Confirma a identidade real do usuário via Firebase ID token
 * - Garante que apenas o médico host ou o paciente aprovado recebam token
 */

import { RtcRole, RtcTokenBuilder } from 'agora-token'
import { NextResponse } from 'next/server'

import {
  AgoraTokenRole,
  generateAgoraNumericUid,
} from '@/lib/agora/generateUid'
import {
  hasRouteUserRole,
  isSameRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'

const rawAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID
const rawAppCertificate = process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE

if (false && (!rawAppId || !rawAppCertificate)) {
  throw new Error(
    'Variáveis de ambiente do Agora faltando: NEXT_PUBLIC_AGORA_APP_ID e NEXT_PUBLIC_AGORA_APP_CERTIFICATE',
  )
}

const AGORA_APP_ID = rawAppId ?? ''
const AGORA_APP_CERTIFICATE = rawAppCertificate ?? ''
const TOKEN_EXPIRATION_SECONDS = 60 * 60

interface GenerateTokenPayload {
  callId: string
  channelName?: string
  uid?: string | number
  userId?: string
  role: AgoraTokenRole
  requestId?: string
  consultationId?: string
}

interface TokenResponse {
  token: string | null
  error: string | null
  uid?: number | null
  channelName?: string | null
}

function isTokenRole(value: unknown): value is AgoraTokenRole {
  return value === 'host' || value === 'guest'
}

function addCorsHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  )
  return response
}

function normalizeRequestedUid(uid: string | number | undefined) {
  if (uid === undefined || uid === null) {
    return null
  }

  const parsedUid =
    typeof uid === 'number' ? uid : Number.parseInt(String(uid), 10)

  return Number.isFinite(parsedUid) ? parsedUid : null
}

export async function POST(
  request: Request,
): Promise<NextResponse<TokenResponse>> {
  try {
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error(
        'Variaveis de ambiente do Agora faltando: NEXT_PUBLIC_AGORA_APP_ID e NEXT_PUBLIC_AGORA_APP_CERTIFICATE',
      )

      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'Configuracao do Agora indisponivel no servidor.',
          },
          { status: 500 },
        ),
      )
    }

    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return addCorsHeaders(
        authResult.response as NextResponse<TokenResponse>,
      )
    }

    const { user, db } = authResult
    const payload = (await request.json()) as Partial<GenerateTokenPayload>

    const {
      callId,
      channelName,
      uid,
      userId,
      role,
      requestId,
      consultationId,
    } = payload

    if (!callId || !role || !isTokenRole(role)) {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'Dados inválidos. Informe callId e role (host ou guest).',
          },
          { status: 400 },
        ),
      )
    }

    const isConsultationCall = Boolean(consultationId)
    const callDocRef = isConsultationCall
      ? db
        .collection('consultations')
        .doc(consultationId!)
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
      channelName: string
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

    if (channelName && channelName !== callData.channelName) {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'O channelName informado não corresponde à chamada ativa.',
          },
          { status: 400 },
        ),
      )
    }

    let resolvedIdentityId: string

    if (role === 'host') {
      if (
        !hasRouteUserRole(user, [UserRole.DOCTOR]) ||
        !isSameRouteUser(user, callData.hostId)
      ) {
        return addCorsHeaders(
          NextResponse.json(
            {
              token: null,
              error: 'Apenas o médico host pode solicitar token com role=host.',
            },
            { status: 403 },
          ),
        )
      }

      resolvedIdentityId = callData.hostId
    } else {
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

      const requestDoc = await callDocRef.collection('requests').doc(requestId).get()

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

      if (isConsultationCall) {
        const requestData = requestDoc.data() as {
          patientId: string
          status: 'pending' | 'accepted' | 'denied'
        }

        if (
          requestData.patientId !== callData.patientId ||
          !hasRouteUserRole(user, [UserRole.PATIENT]) ||
          !isSameRouteUser(user, requestData.patientId)
        ) {
          return addCorsHeaders(
            NextResponse.json(
              {
                token: null,
                error: 'Paciente não autorizado para esta chamada.',
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

        resolvedIdentityId = requestData.patientId
      } else {
        const requestData = requestDoc.data() as {
          doctorId: string
          status: 'pending' | 'accepted' | 'denied'
        }

        if (
          !hasRouteUserRole(user, [UserRole.DOCTOR]) ||
          !isSameRouteUser(user, requestData.doctorId)
        ) {
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

        resolvedIdentityId = requestData.doctorId
      }
    }

    if (userId && userId !== resolvedIdentityId) {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'O userId informado não corresponde ao usuário autenticado.',
          },
          { status: 400 },
        ),
      )
    }

    const numericUid = generateAgoraNumericUid({
      userId: resolvedIdentityId,
      consultationId,
      callId,
      role,
      requestId: role === 'guest' ? requestId : undefined,
    })

    const requestedUid = normalizeRequestedUid(uid)

    if (requestedUid !== null && requestedUid !== numericUid) {
      return addCorsHeaders(
        NextResponse.json(
          {
            token: null,
            error: 'O uid informado não corresponde à identidade autenticada.',
          },
          { status: 400 },
        ),
      )
    }

    const currentTimestamp = Math.floor(Date.now() / 1000)
    const expirationTimestamp = currentTimestamp + TOKEN_EXPIRATION_SECONDS

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      callData.channelName,
      numericUid,
      RtcRole.PUBLISHER,
      TOKEN_EXPIRATION_SECONDS,
      expirationTimestamp,
    )

    return addCorsHeaders(
      NextResponse.json(
        {
          token,
          error: null,
          uid: numericUid,
          channelName: callData.channelName,
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

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
