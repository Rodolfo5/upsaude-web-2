/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse, NextRequest } from 'next/server'

import { initAdmin } from '@/config/firebase/firebaseAdmin'
import {
  getPagarmeWebhookSignatureHeader,
  verifyPagarmeWebhookSignature,
} from '@/lib/server/pagarmeWebhook'
import { notifyConsultationScheduled } from '@/services/emailNotification'

export async function POST(request: NextRequest) {
  try {
    // 1. Inicializa o Firebase Admin

    // 2. Lê o corpo da requisição como texto e a assinatura do cabeçalho
    const rawBody = await request.text()
    const signatureHeader = getPagarmeWebhookSignatureHeader(request)

    // 3. Valida se o corpo não está vazio
    if (!rawBody) {
      console.error('Webhook recebido sem dados')
      return NextResponse.json({ error: 'No data received' }, { status: 400 })
    }

    if (!signatureHeader) {
      console.error('Webhook recebido sem assinatura do Pagar.me')
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 },
      )
    }

    if (!verifyPagarmeWebhookSignature(rawBody, signatureHeader)) {
      console.error('Assinatura invalida no webhook do Pagar.me')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 },
      )
    }

    const adminApp = await initAdmin()
    const adminDb = adminApp.firestore()

    let event
    try {
      event = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // 4. Valida se o evento tem a estrutura esperada
    if (!event || !event.type || !event.data) {
      console.error('Evento inválido recebido:', event)
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 },
      )
    }

    console.log('Webhook recebido:', event.type)

    const linkId = event.data.order.code // para o pagamento instantâneo
    const chargeId = event.data.id // para o pagamento agendado
    const paymentMethod = event.data.payment_method // credit_card, pix, boleto

    // Valida se data.order existe
    if (!linkId || !chargeId) {
      console.warn('Webhook recebido sem order.id ou order.code, ignorando.')
      return NextResponse.json({ received: true })
    }

    let paymentDocRef: FirebaseFirestore.DocumentReference | null = null

    const instantDocRef = adminDb.collection('instantPayments').doc(linkId)
    const instantDoc = await instantDocRef.get()

    if (instantDoc.exists) {
      paymentDocRef = instantDocRef
      console.log(`Webhook: Documento encontrado em 'instantPayments'`)
    }

    if (!paymentDocRef) {
      console.warn('Webhook recebido sem documento de pagamento, ignorando.')
      return NextResponse.json({ received: true })
    }

    const paymentData = (await paymentDocRef.get()).data()
    const protocolNumber = paymentData?.protocolNumber

    const updateConsultationStatusByProtocol = async () => {
      if (!protocolNumber) return
      const consultationQuery = await adminDb
        .collection('consultations')
        .where('protocolNumber', '==', protocolNumber)
        .limit(1)
        .get()

      if (consultationQuery.empty) return

      await consultationQuery.docs[0].ref.update({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
    }
    // const protocolNumber = paymentData?.protocolNumber
    // const  = paymentData?.

    // 5. Processa apenas o evento de link de pagamento finalizado (pago)
    if (event.type === 'charge.paid') {
      // Webhook é a fonte da verdade - sempre atualiza se não estiver PAID
      if (paymentData && paymentData.paymentStatus !== 'PAID') {
        await paymentDocRef.update({
          paymentStatus: 'PAID',
          paidAt: new Date(),
          pagarmeChargeId: chargeId,
          paymentMethod: paymentMethod || 'unknown', // Captura o método de pagamento
        })
        // await adminDb.collection('events').doc(eventId).update({
        //   status: 'scheduled',
        //   paidAt: new Date(),
        // })
        // await adminDb.collection('chats').doc(chatId).update({
        //   status: 'SCHEDULED',
        // })
        console.log(
          `Webhook: Pagamento ${paymentDocRef.id} marcado como PAID via ${
            paymentMethod || 'método desconhecido'
          }${
            paymentData.paymentStatus === 'PROCESSING'
              ? ' (cron estava processando)'
              : ''
          }.`,
        )

        if (protocolNumber && paymentData.doctorId) {
          const consultationQuery = await adminDb
            .collection('consultations')
            .where('protocolNumber', '==', protocolNumber)
            .limit(1)
            .get()

          if (!consultationQuery.empty) {
            const consultationDoc = consultationQuery.docs[0]
            const consultationId = consultationDoc.id
            const consultationData = consultationDoc.data()
            const date = consultationData?.date?.toDate
              ? consultationData.date.toDate()
              : paymentData.date
                ? new Date(paymentData.date)
                : new Date()
            const hour = consultationData?.hour || paymentData.hour || ''
            const dateTimeStr =
              hour && date
                ? `${hour}, ${date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}`
                : date?.toLocaleDateString('pt-BR') || ''

            notifyConsultationScheduled(
              paymentData.doctorId,
              consultationId,
              dateTimeStr,
            ).catch((err: unknown) =>
              console.error(
                'Erro ao enviar notificação de consulta agendada:',
                err,
              ),
            )
          }
        }
      } else {
        console.log(
          `Webhook: Pagamento ${paymentDocRef.id} já está PAID, ignorando evento.`,
        )
      }
    } // FALHA NO PAGAMENTO
    else if (
      event.type === 'charge.antifraud_reproved' ||
      event.type === 'charge.payment_failed' ||
      event.type === 'order.payment_failed'
    ) {
      // Webhook é a fonte da verdade - sempre atualiza se não estiver FAILED
      if (paymentData && paymentData.paymentStatus !== 'FAILED') {
        await paymentDocRef.update({
          paymentStatus: 'FAILED',
          logErro: JSON.stringify(event.data),
          paymentMethod: paymentMethod || 'unknown', // Captura o método que falhou
          // NÃO incrementa retryCount aqui - apenas o cron faz isso
        })
        console.log(
          `Webhook: Pagamento ${paymentDocRef.id} via ${
            paymentMethod || 'método desconhecido'
          } marcado como FAILED${
            paymentData.paymentStatus === 'PROCESSING'
              ? ' (cron estava processando)'
              : ''
          }.`,
        )
      } else {
        console.log(
          `Webhook: Pagamento ${paymentDocRef.id} já está FAILED, ignorando evento.`,
        )
      }
    } // ESTORNO DO PAGAMENTO
    else if (
      event.type === 'charge.refunded' ||
      event.type === 'charge.canceled' ||
      event.type === 'charge.partial_canceled'
    ) {
      const status = event.type === 'charge.refunded' ? 'REFUNDED' : 'CANCELLED'

      if (paymentData && paymentData.paymentStatus !== status) {
        await paymentDocRef.update({
          paymentStatus: status,
          paymentMethod:
            paymentMethod || paymentData.paymentMethod || 'unknown',
          updatedAt: new Date(),
        })
      }

      await updateConsultationStatusByProtocol()

      console.log(
        `Webhook: Pagamento via ${paymentMethod || 'método desconhecido'} ${status}.`,
      )
    } // Evento não tratado
    else {
      console.log('Evento não tratado:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook do Pagar.me:', error)
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
