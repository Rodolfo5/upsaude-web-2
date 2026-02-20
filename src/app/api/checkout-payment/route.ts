import axios from 'axios' // Importando o axios
// A importação do firestore está aqui conforme seu código, mas a lógica está comentada.
import { NextResponse } from 'next/server'

import { initAdmin } from '@/config/firebase/firebaseAdmin'

export async function POST(request: Request) {
  try {
    const adminApp = await initAdmin()
    const adminDb = adminApp.firestore()

    // Validação básica dos dados recebidos
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
    } = await request.json()

    if (
      !email ||
      !phone ||
      !documentType ||
      !documentNumber ||
      !userName ||
      !userId ||
      !pagarmeCustomerId ||
      !budgetTotal ||
      !protocolNumber ||
      !doctorId ||
      !date ||
      !hour ||
      !format
    ) {
      return NextResponse.json(
        { success: false, message: 'Dados obrigatórios ausentes.' },
        { status: 400 },
      )
    }

    // Validação do telefone
    // const cleanPhone = phone.replace(/\D/g, "");
    // if (
    //   cleanPhone.length < 10 ||
    //   cleanPhone === "00000000000" ||
    //   /^0+$/.test(cleanPhone)
    // ) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "Telefone inválido. Por favor, insira um número válido."
    //     },
    //     { status: 400 }
    //   );
    // }

    // Busca a chave secreta do Pagar.me
    // Helper para autenticação segura no Pagar.me
    const getPagarmeAuthHeader = (): string => {
      const secretKey = process.env.PAGARME_SECRET_KEY
      if (!secretKey) {
        throw new Error(
          'A chave secreta do Pagar.me (sk_test_...) não está configurada.',
        )
      }
      const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
      return `Basic ${base64Key}`
    }

    // Codifica a chave para autenticação Basic
    const encodedKey = getPagarmeAuthHeader()

    const budgetTotalInCents = Math.floor(budgetTotal * 100)
    // Monta o payload para o Pagar.me
    const payload = {
      is_building: false,
      payment_settings: {
        credit_card_settings: {
          operation_type: 'auth_and_capture',
          statement_descriptor: 'Up Saúde',
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
            'Pague até a data de vencimento. Após o vencimento, reemitir o boleto.',
        },
        pix_settings: { expires_in: 1800 },
        accepted_payment_methods: ['credit_card', 'pix', 'boleto'],
        statement_descriptor: 'Up Saúde',
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
        customer_id: pagarmeCustomerId,
      },
    }

    // Faz a requisição para criar o link de pagamento
    const options = {
      method: 'POST',
      url: 'https://api.pagar.me/core/v5/paymentlinks',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: encodedKey,
      },
      data: payload,
    }

    let paymentLink
    try {
      const response = await axios.request(options)

      paymentLink = response.data
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorTyped = err as any

      const msg =
        axios.isAxiosError && axios.isAxiosError(errorTyped)
          ? errorTyped.response?.data?.message ||
            errorTyped.response?.data?.errors?.[0]?.message ||
            `Erro ${errorTyped.response?.status}: ${errorTyped.response?.statusText}`
          : 'Erro desconhecido ao criar link de pagamento.'
      return NextResponse.json(
        { success: false, message: msg, debug: errorTyped.response?.data },
        { status: 502 },
      )
    }

    const linkId = paymentLink.id
    const customerId = paymentLink.customer_settings.customer_id

    // Salva o pagamento no Firestore
    try {
      await adminDb.collection('instantPayments').doc(linkId).set({
        id: linkId,
        protocolNumber,
        pagarmeLinkId: linkId,
        userId,
        pagarmeCustomerId: customerId,
        paymentStatus: 'PENDING',
        valueInCents: budgetTotalInCents,
        doctorId,
        date,
        hour,
        format,
        createdAt: new Date(),
      })
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao salvar pagamento no banco de dados.',
        },
        { status: 500 },
      )
    }

    // Retorna a URL de checkout para o frontend
    return NextResponse.json({
      success: true,
      paymentLinkId: linkId,
      checkoutUrl: paymentLink.url,

      customerId,
    })
  } catch (error) {
    // Erro inesperado
    const message =
      error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
