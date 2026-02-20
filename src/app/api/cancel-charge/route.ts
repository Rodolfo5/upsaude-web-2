import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { initAdmin } from '@/config/firebase/firebaseAdmin'

const bodySchema = z.object({
  chargeId: z.string().min(1, 'chargeId é obrigatório'),
})

const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me não está configurada.')
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
    const adminApp = await initAdmin()
    const adminDb = adminApp.firestore()

    const body = await request.json().catch(() => ({}))
    const bodyValidation = bodySchema.safeParse(body)
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: 'Body inválido.', details: bodyValidation.error.flatten() },
        { status: 400 },
      )
    }

    const { chargeId } = bodyValidation.data

    const refundResponse = await axios.delete(
      `https://api.pagar.me/core/v5/charges/${chargeId}`,
      {
        headers: {
          Authorization: getPagarmeAuthHeader(),
        },
      },
    )

    // Atualiza pagamento (instantPayments) e consulta
    const paymentQuery = await adminDb
      .collection('instantPayments')
      .where('pagarmeChargeId', '==', chargeId)
      .limit(1)
      .get()

    if (!paymentQuery.empty) {
      const paymentRef = paymentQuery.docs[0].ref
      const paymentData = paymentQuery.docs[0].data()

      await paymentRef.update({
        paymentStatus: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })

      await updateConsultationByProtocol(adminDb, paymentData?.protocolNumber)
    }

    return NextResponse.json(
      {
        success: true,
        chargeId,
        pagarmeStatus: refundResponse.data?.status,
        message: 'Cancelamento solicitado com sucesso.',
      },
      { status: 200 },
    )
  } catch (error) {
    const axiosError = error as AxiosError
    console.error(
      'Erro ao cancelar/estornar cobrança:',
      axiosError.response?.data || axiosError.message,
    )

    return NextResponse.json(
      {
        error:
          axiosError.response?.data || 'Erro ao cancelar/estornar cobrança.',
      },
      { status: axiosError.response?.status || 500 },
    )
  }
}
