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

const cancelRecurrencySchema = z.object({
  subscriptionId: z.string().min(1, 'subscriptionId e obrigatorio'),
})

const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me nao esta configurada.')
  }
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${base64Key}`
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(req)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user, db: adminDb } = authResult
    const body = await req.json()
    const validation = cancelRecurrencySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados invalidos.', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { subscriptionId } = validation.data

    const subscriptionRef = adminDb
      .collection('subscriptions')
      .doc(subscriptionId)
    const subscriptionDoc = await subscriptionRef.get()

    if (!subscriptionDoc.exists) {
      return NextResponse.json(
        { error: 'Assinatura nao encontrada no Firestore.' },
        { status: 404 },
      )
    }

    const subscriptionData = subscriptionDoc.data()
    const userId = subscriptionData?.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'Assinatura sem paciente associado.' },
        { status: 400 },
      )
    }

    const userDoc = await findUserDocumentByAnyId(adminDb, userId)

    if (!userDoc?.exists) {
      return NextResponse.json(
        { error: 'Paciente da assinatura nao encontrado.' },
        { status: 404 },
      )
    }

    if (userDoc.data()?.role !== UserRole.PATIENT) {
      return forbiddenRouteResponse(
        'Apenas assinaturas de pacientes podem ser canceladas por esta rota.',
      )
    }

    if (!isAdminOrSamePatientRouteUser(user, userId)) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para cancelar esta assinatura.',
      )
    }

    const cancelResponse = await axios.post(
      `https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/cancel`,
      {},
      {
        headers: {
          Authorization: getPagarmeAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    )

    if (cancelResponse.data?.status !== 'canceled') {
      return NextResponse.json(
        {
          error: 'Falha ao cancelar assinatura no Pagar.me.',
          details: cancelResponse.data,
        },
        { status: 400 },
      )
    }

    await subscriptionRef.update({
      status: 'cancelled',
      updatedAt: new Date(),
    })

    await userDoc.ref.update({
      hasActiveSubscription: false,
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        subscriptionId,
        message: 'Assinatura cancelada com sucesso.',
      },
      { status: 200 },
    )
  } catch (error) {
    const axiosError = error as AxiosError
    console.error(
      'Erro ao cancelar assinatura:',
      axiosError.response?.data || axiosError.message,
    )

    return NextResponse.json(
      { error: axiosError.response?.data || 'Erro ao cancelar assinatura.' },
      { status: axiosError.response?.status || 500 },
    )
  }
}
