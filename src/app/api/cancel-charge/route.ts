import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  findUserDocumentByAnyId,
  forbiddenRouteResponse,
  isAdminOrSamePatientRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'

const bodySchema = z
  .object({
    chargeId: z.string().min(1, 'chargeId e obrigatorio').optional(),
    protocolNumber: z.string().min(1, 'protocolNumber e obrigatorio').optional(),
  })
  .refine((data) => Boolean(data.chargeId || data.protocolNumber), {
    message: 'Informe chargeId ou protocolNumber.',
    path: ['chargeId'],
  })

const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me nao esta configurada.')
  }
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${base64Key}`
}

const updateConsultationByProtocol = async (
  adminDb: FirebaseFirestore.Firestore,
  protocolNumber?: string,
) => {
  if (!protocolNumber) return

  const consultationsQuery = await adminDb
    .collection('consultations')
    .where('protocolNumber', '==', protocolNumber)
    .limit(1)
    .get()

  if (consultationsQuery.empty) return

  const consultationRef = consultationsQuery.docs[0].ref
  await consultationRef.update({
    status: 'CANCELLED',
    updatedAt: new Date(),
  })
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user, db: adminDb } = authResult
    const body = await request.json().catch(() => ({}))
    const bodyValidation = bodySchema.safeParse(body)

    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: 'Body invalido.', details: bodyValidation.error.flatten() },
        { status: 400 },
      )
    }

    const { chargeId, protocolNumber } = bodyValidation.data

    const paymentQuery = protocolNumber
      ? await adminDb
        .collection('instantPayments')
        .where('protocolNumber', '==', protocolNumber)
        .limit(1)
        .get()
      : await adminDb
        .collection('instantPayments')
        .where('pagarmeChargeId', '==', chargeId!)
        .limit(1)
        .get()

    if (paymentQuery.empty) {
      return NextResponse.json(
        { error: 'Pagamento nao encontrado.' },
        { status: 404 },
      )
    }

    const paymentRef = paymentQuery.docs[0].ref
    const paymentData = paymentQuery.docs[0].data()
    const resolvedChargeId = paymentData?.pagarmeChargeId || chargeId
    const patientId = paymentData?.userId

    if (!patientId) {
      return NextResponse.json(
        { error: 'Pagamento sem paciente associado.' },
        { status: 400 },
      )
    }

    const patientDoc = await findUserDocumentByAnyId(adminDb, patientId)

    if (!patientDoc?.exists) {
      return NextResponse.json(
        { error: 'Paciente do pagamento nao encontrado.' },
        { status: 404 },
      )
    }

    if (patientDoc.data()?.role !== UserRole.PATIENT) {
      return forbiddenRouteResponse(
        'Apenas pagamentos de pacientes podem ser cancelados por esta rota.',
      )
    }

    if (!isAdminOrSamePatientRouteUser(user, patientId)) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para cancelar esta cobranca.',
      )
    }

    if (!resolvedChargeId) {
      return NextResponse.json(
        {
          error:
            'Esta cobranca ainda nao possui um chargeId registrado para cancelamento.',
        },
        { status: 400 },
      )
    }

    const refundResponse = await axios.delete(
      `https://api.pagar.me/core/v5/charges/${resolvedChargeId}`,
      {
        headers: {
          Authorization: getPagarmeAuthHeader(),
        },
      },
    )

    await paymentRef.update({
      paymentStatus: 'CANCELLED',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })

    await updateConsultationByProtocol(adminDb, paymentData?.protocolNumber)

    return NextResponse.json(
      {
        success: true,
        chargeId: resolvedChargeId,
        pagarmeStatus: refundResponse.data?.status,
        message: 'Cancelamento solicitado com sucesso.',
      },
      { status: 200 },
    )
  } catch (error) {
    const axiosError = error as AxiosError
    console.error(
      'Erro ao cancelar/estornar cobranca:',
      axiosError.response?.data || axiosError.message,
    )

    return NextResponse.json(
      {
        error:
          axiosError.response?.data || 'Erro ao cancelar/estornar cobranca.',
      },
      { status: axiosError.response?.status || 500 },
    )
  }
}
