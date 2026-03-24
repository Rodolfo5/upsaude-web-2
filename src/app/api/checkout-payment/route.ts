import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'

import {
  findUserDocumentByAnyId,
  forbiddenRouteResponse,
  isAdminOrSamePatientRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'

const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me nao esta configurada.')
  }
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${base64Key}`
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    const { user, db: adminDb } = authResult
    const body = await request.json()
    const {
      email,
      phone,
      documentType,
      documentNumber,
      userName,
      userId,
      pagarmeCustomerId,
      budgetTotal,
      protocolNumber,
      doctorId,
      date,
      hour,
      format,
    } = body as {
      email?: string
      phone?: string
      documentType?: string
      documentNumber?: string
      userName?: string
      userId?: string
      pagarmeCustomerId?: string
      budgetTotal?: number
      protocolNumber?: string
      doctorId?: string
      date?: string | Date
      hour?: string
      format?: string
    }

    if (
      !email ||
      !phone ||
      !documentType ||
      !documentNumber ||
      !userName ||
      !userId ||
      !budgetTotal ||
      !protocolNumber ||
      !doctorId ||
      !date ||
      !hour ||
      !format
    ) {
      return NextResponse.json(
        { success: false, message: 'Dados obrigatorios ausentes.' },
        { status: 400 },
      )
    }

    const consultationQuery = await adminDb
      .collection('consultations')
      .where('protocolNumber', '==', protocolNumber)
      .limit(1)
      .get()

    if (consultationQuery.empty) {
      return NextResponse.json(
        { success: false, message: 'Consulta nao encontrada.' },
        { status: 404 },
      )
    }

    const consultationData = consultationQuery.docs[0].data()
    const resolvedUserId = consultationData?.patientId || userId
    const resolvedDoctorId = consultationData?.doctorId || doctorId
    const resolvedDate = consultationData?.date?.toDate
      ? consultationData.date.toDate()
      : consultationData?.date || date
    const resolvedHour = consultationData?.hour || hour
    const resolvedFormat = consultationData?.format || format

    if (userId !== resolvedUserId) {
      return NextResponse.json(
        {
          success: false,
          message: 'O usuario informado nao corresponde ao dono da consulta.',
        },
        { status: 400 },
      )
    }

    if (doctorId !== resolvedDoctorId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'O profissional informado nao corresponde ao profissional da consulta.',
        },
        { status: 400 },
      )
    }

    if (!isAdminOrSamePatientRouteUser(user, resolvedUserId)) {
      return forbiddenRouteResponse(
        'Voce nao tem permissao para criar o pagamento desta consulta.',
      )
    }

    const userDoc = await findUserDocumentByAnyId(adminDb, resolvedUserId)

    if (!userDoc?.exists) {
      return NextResponse.json(
        { success: false, message: 'Usuario nao encontrado.' },
        { status: 404 },
      )
    }

    const userData = userDoc.data()

    if (userData?.role !== UserRole.PATIENT) {
      return forbiddenRouteResponse(
        'Apenas pacientes podem gerar pagamentos por esta rota.',
      )
    }

    const resolvedPagarmeCustomerId =
      userData?.pagarmeCustomerId || pagarmeCustomerId

    if (!resolvedPagarmeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Usuario nao possui customerId cadastrado para gerar pagamento.',
        },
        { status: 400 },
      )
    }

    const budgetTotalInCents = Math.floor(Number(budgetTotal) * 100)
    const payload = {
      is_building: false,
      payment_settings: {
        credit_card_settings: {
          operation_type: 'auth_and_capture',
          statement_descriptor: 'Up Saude',
          installments: [
            { number: 1, total: budgetTotalInCents },
            { number: 2, total: budgetTotalInCents },
            { number: 3, total: budgetTotalInCents },
            { number: 4, total: budgetTotalInCents },
            { number: 5, total: budgetTotalInCents },
            { number: 6, total: budgetTotalInCents },
          ],
        },
        boleto_settings: {
          due_in: 3,
          instructions:
            'Pague ate a data de vencimento. Apos o vencimento, reemitir o boleto.',
        },
        pix_settings: { expires_in: 1800 },
        accepted_payment_methods: ['credit_card', 'pix', 'boleto'],
        statement_descriptor: 'Up Saude',
      },
      cart_settings: {
        items: [
          {
            name: 'Pagamento Consulta',
            amount: budgetTotalInCents,
            default_quantity: 1,
          },
        ],
      },
      type: 'order',
      name: `Pagamento Consulta ${protocolNumber}`,
      customer_settings: {
        customer_id: resolvedPagarmeCustomerId,
      },
    }

    let paymentLink: { id: string; url: string; customer_settings: { customer_id: string } }

    try {
      const response = await axios.request({
        method: 'POST',
        url: 'https://api.pagar.me/core/v5/paymentlinks',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: getPagarmeAuthHeader(),
        },
        data: payload,
      })

      paymentLink = response.data as {
        id: string
        url: string
        customer_settings: { customer_id: string }
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{
        message?: string
        errors?: Array<{ message?: string }>
      }>

      if (axios.isAxiosError(axiosError)) {
        const message =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.errors?.[0]?.message ||
          `Erro ${axiosError.response?.status}: ${axiosError.response?.statusText}`

        return NextResponse.json(
          { success: false, message, debug: axiosError.response?.data },
          { status: 502 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Erro desconhecido ao criar link de pagamento.',
        },
        { status: 502 },
      )
    }

    const linkId = paymentLink.id
    const customerId = paymentLink.customer_settings.customer_id

    try {
      await adminDb.collection('instantPayments').doc(linkId).set({
        id: linkId,
        protocolNumber,
        pagarmeLinkId: linkId,
        userId: resolvedUserId,
        pagarmeCustomerId: customerId,
        paymentStatus: 'PENDING',
        valueInCents: budgetTotalInCents,
        doctorId: resolvedDoctorId,
        date: resolvedDate,
        hour: resolvedHour,
        format: resolvedFormat,
        createdAt: new Date(),
      })
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao salvar pagamento no banco de dados.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      paymentLinkId: linkId,
      checkoutUrl: paymentLink.url,
      customerId,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
