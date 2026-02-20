// app/api/create-card/route.ts
// Esta rota recebe os dados do cartão, valida-os,
// e cria um registro de Cartão na API do Pagar.me.
// Se o usuário não tiver um Customer ID no Pagar.me, ele será criado.

import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { initAdmin } from '@/config/firebase/firebaseAdmin'
// Schema de validação para os dados que chegam do mobile/frontend.
const createCardSchema = z.object({
  // Dados do endereço (usado para billing address e para criar customer se necessário)
  country: z.string().min(1, 'País é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido').max(9, 'CEP inválido'),
  state: z.string().min(1, 'Estado é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  number: z.string().optional(),
  complement: z.string().optional(),

  // Dados do Cartão
  cardNumber: z.string().min(16, 'Número do cartão inválido'),
  cardholderName: z.string().min(1, 'Nome é obrigatório'),
  expiration: z.string().min(4, 'Data de expiração inválida'), // MMYY
  cvv: z.string().min(3, 'CVV inválido').max(4, 'CVV inválido'),

  // Dados do Usuário e Contexto
  userId: z.string().min(1, 'ID do usuário é obrigatório'),

  // Dados Opcionais (podem vir do banco se não enviados)
  cpf: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(), // Caso queira forçar um email diferente do cadastro
})

// Helper para autenticação segura no Pagar.me
const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me não está configurada.')
  }
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${base64Key}`
}

export async function POST(req: Request) {
  // Inicializa o Firebase Admin
  const adminApp = await initAdmin()
  const adminDb = adminApp.firestore()

  try {
    // 1. RECEBER E VALIDAR DADOS
    const body = await req.json()
    const validation = createCardSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const data = validation.data
    const { userId } = data

    // 2. BUSCAR USUÁRIO NO FIRESTORE
    const userDocRef = adminDb.collection('users').doc(userId)
    const userDoc = await userDocRef.get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const userData = userDoc.data()
    let pagarmeCustomerId = userData?.pagarmeCustomerId

    // 3. CRIAR CUSTOMER NO PAGAR.ME SE NÃO EXISTIR
    if (!pagarmeCustomerId) {
      console.log('Usuário sem Customer ID no Pagar.me. Criando...')

      // Prioriza dados do payload, fallback para dados do banco
      const name = userData?.name || data.cardholderName
      const email = userData?.email || data.email
      const cpf = userData?.cpf || data.cpf

      // Formata telefone se existir (Exemplo simples, ideal usar lib de parsing)
      const phoneRaw = userData?.phone || data.phone || ''
      const phoneOnlyNumbers = phoneRaw.replace(/\D/g, '')

      // Pagar.me exige formato específico para telefones
      let phonesPayload = {}
      if (phoneOnlyNumbers.length >= 10) {
        phonesPayload = {
          mobile_phone: {
            country_code: '55',
            area_code: phoneOnlyNumbers.substring(0, 2),
            number: phoneOnlyNumbers.substring(2),
          },
        }
      }

      const customerPayload = {
        name,
        email,
        code: userId,
        document: cpf ? cpf.replace(/\D/g, '') : undefined,
        type: 'individual',
        phones: phonesPayload,
        address: {
          line_1: data.number
            ? `${data.number}, ${data.address}, ${data.neighborhood}`
            : `${data.address}, ${data.neighborhood}`,
          line_2: data.complement || '',
          zip_code: data.zipCode.replace(/\D/g, ''),
          city: data.city,
          state: data.state,
          country:
            data.country === 'Brasil' || data.country === 'BR'
              ? 'BR'
              : data.country, // Simplificação
        },
      }

      try {
        console.log(
          'Payload Create Customer:',
          JSON.stringify(customerPayload, null, 2),
        )
        const customerResponse = await axios.post(
          'https://api.pagar.me/core/v5/customers',
          customerPayload,
          {
            headers: {
              Authorization: getPagarmeAuthHeader(),
              'Content-Type': 'application/json',
            },
          },
        )
        pagarmeCustomerId = customerResponse.data.id
        console.log('Customer criado com sucesso:', pagarmeCustomerId)

        // Salva o ID no Firestore
        await userDocRef.update({ pagarmeCustomerId })
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = err as any
        console.error(
          'Erro ao criar Customer no Pagar.me:',
          error.response?.data || error.message,
        )
        // Tenta recuperar se o erro for "Customer already exists" ou similar,
        // mas o ideal é falhar para corrigir os dados.
        // Se o email já existe no Pagar.me, a API pode retornar erro.
        // Nesse caso, precisaríamos buscar o customer pelo email.

        // Tentativa de busca por email se falhar na criação (Opcional, mas robusto)
        if (
          error.response?.data?.errors &&
          JSON.stringify(error.response.data.errors).includes('email')
        ) {
          const getCustomerResponse = await axios.get(
            `https://api.pagar.me/core/v5/customers?email=${email}`,
            {
              headers: { Authorization: getPagarmeAuthHeader() },
            },
          )
          if (getCustomerResponse.data?.data?.length > 0) {
            pagarmeCustomerId = getCustomerResponse.data.data[0].id
            await userDocRef.update({ pagarmeCustomerId })
          } else {
            throw error // Re-throw se não achar
          }
        } else {
          throw error
        }
      }
    }

    const billingAddress = {
      line_1: data.number
        ? `${data.number}, ${data.address}, ${data.neighborhood}`
        : `${data.address}, ${data.neighborhood}`,
      line_2: data.complement,
      zip_code: data.zipCode.replace(/\D/g, ''),
      city: data.city,
      state: data.state,
      country:
        data.country === 'Brasil' || data.country === 'BR'
          ? 'BR'
          : data.country,
    }

    const cardData = {
      number: data.cardNumber.replace(/\D/g, ''),
      holder_name: data.cardholderName,
      exp_month: data.expiration.slice(0, 2),
      exp_year: data.expiration.slice(2),
      cvv: data.cvv,
    }

    // 4. CRIAR TOKEN DO CARTÃO
    let cardTokenId: string | undefined
    try {
      const tokenResponse = await axios.post(
        `https://api.pagar.me/core/v5/tokens?appId=${process.env.PAGARME_PUBLIC_KEY}`,
        {
          type: 'card',
          card: {
            ...cardData,
          },
        },
        {
          headers: {
            Authorization: getPagarmeAuthHeader(),
            'Content-Type': 'application/json',
          },
        },
      )

      cardTokenId = tokenResponse.data.id
      console.log('Token de cartão criado com sucesso:', cardTokenId)
    } catch (tokenError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosTokenError = tokenError as AxiosError<any>
      console.error(
        'Erro ao criar token do cartão:',
        axiosTokenError.response?.data || axiosTokenError.message,
      )

      return NextResponse.json(
        {
          error:
            axiosTokenError.response?.data?.errors ||
            axiosTokenError.response?.data?.message ||
            'Erro ao criar token do cartão.',
        },
        { status: axiosTokenError.response?.status || 500 },
      )
    }

    if (!cardTokenId) {
      return NextResponse.json(
        { error: 'Não foi possível gerar o token do cartão.' },
        { status: 500 },
      )
    }

    // 5. CRIAR CARTÃO ASSOCIANDO O TOKEN
    console.log(`Criando cartão para Customer ${pagarmeCustomerId}...`)

    const response = await axios.post(
      `https://api.pagar.me/core/v5/customers/${pagarmeCustomerId}/cards`,
      {
        token: cardTokenId,
        billing_address: billingAddress,
      },
      {
        headers: {
          Authorization: getPagarmeAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    )

    const pagarmeCardId = response.data.id
    const brand = response.data.brand
    const lastFourDigits = response.data.last_four_digits

    console.log('Cartão criado e validado:', pagarmeCardId)

    // Atualiza o usuário com a referência do cartão para futuros checkouts
    await userDocRef.update({
      pagarmeCardId,
    })

    // Opcional: Salvar log ou referência do cartão no Firestore do usuário,
    // embora o Pagar.me já armazene.
    // O código original salvava em 'scheduledPayments', mas isso parecia específico para uma lógica antiga.
    // Vou retornar o cardId para o front-end usar na próxima etapa (assinatura).

    return NextResponse.json(
      {
        pagarmeCardId,
        pagarmeCustomerId,
        brand,
        lastFourDigits,
        message: 'Cartão validado e adicionado com sucesso.',
      },
      { status: 201 },
    )
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as AxiosError<any>
    console.error(
      'Erro ao processar cartão/cliente:',
      axiosError.response?.data || axiosError.message,
    )
    const errorMessage = axiosError.response?.data?.errors
      ? axiosError.response.data.errors
      : axiosError.response?.data?.message || {
          message: 'Erro ao processar a solicitação de cartão.',
        }
    return NextResponse.json(
      { error: errorMessage },
      { status: axiosError.response?.status || 500 },
    )
  }
}
