import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { initAdmin } from '@/config/firebase/firebaseAdmin'

const cancelRecurrencySchema = z.object({
  subscriptionId: z.string().min(1, 'subscriptionId é obrigatório'),
})

const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me não está configurada.')
  }
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${base64Key}`
}
export async function POST(req: Request) {
  const adminApp = await initAdmin()
  const adminDb = adminApp.firestore()

  try {
    const body = await req.json()
    const validation = cancelRecurrencySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { subscriptionId } = validation.data

    // 1. Cancelar assinatura no Pagar.me
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

    // 2. Atualizar assinatura no Firestore
    const subscriptionRef = adminDb
      .collection('subscriptions')
      .doc(subscriptionId)
    const subscriptionDoc = await subscriptionRef.get()

    if (!subscriptionDoc.exists) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada no Firestore.' },
        { status: 404 },
      )
    }

    const subscriptionData = subscriptionDoc.data()
    const userId = subscriptionData?.userId

    await subscriptionRef.update({
      status: 'cancelled',
      updatedAt: new Date(),
    })

    // 3. Atualizar usuário
    if (userId) {
      await adminDb.collection('users').doc(userId).update({
        hasActiveSubscription: false,
        updatedAt: new Date(),
      })
    }

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
