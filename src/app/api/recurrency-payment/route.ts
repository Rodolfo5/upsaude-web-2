// app/api/recurrency-payment/route.ts
import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { initAdmin } from '@/config/firebase/firebaseAdmin'

const recurrencySchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  cardId: z.string().min(1, 'ID do cartão é obrigatório'),
  amountInCents: z.number().min(100, 'Valor mínimo de 1 real').optional(), // Valor MENSAL (opcional se planId for fornecido)
  planName: z.string().optional().default('Plano Mensal'),
  planId: z.string().optional(), // ID do plano fixo (prioridade sobre criação dinâmica)
})

const getPagarmeAuthHeader = (): string => {
  const secretKey = process.env.PAGARME_SECRET_KEY
  if (!secretKey) {
    throw new Error('A chave secreta do Pagar.me não está configurada.')
  }
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${base64Key}`
}

// Helper para buscar um plano existente no Pagar.me
async function getPlan(planId: string) {
  const response = await axios.get(
    `https://api.pagar.me/core/v5/plans/${planId}`,
    {
      headers: {
        Authorization: getPagarmeAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  )
  return response.data
}

// Helper para criar um plano mensal simples no Pagar.me
async function createMonthlyPlan(name: string, amountInCents: number) {
  const payload = {
    name: `${name} - ${amountInCents}`,
    interval: 'month',
    interval_count: 1,
    billing_type: 'prepaid',
    payment_methods: ['credit_card'],
    items: [
      {
        name: 'Mensalidade',
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: amountInCents,
        },
      },
    ],
  }

  const response = await axios.post(
    'https://api.pagar.me/core/v5/plans',
    payload,
    {
      headers: {
        Authorization: getPagarmeAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  )
  return response.data
}

export async function POST(req: Request) {
  const adminApp = await initAdmin()
  const adminDb = adminApp.firestore()

  try {
    const body = await req.json()
    const validation = recurrencySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const {
      userId,
      cardId,
      amountInCents,
      planName,
      planId: providedPlanId,
    } = validation.data

    // 1. Buscar usuário
    const userRef = adminDb.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 },
      )
    }

    const userData = userDoc.data()
    const pagarmeCustomerId = userData?.pagarmeCustomerId
    const hasFirstSubscription = userData?.hasFirstSubscription || false

    if (!pagarmeCustomerId) {
      return NextResponse.json(
        {
          error:
            'Usuário não possui Customer ID no Pagar.me. Cadastre o cartão primeiro.',
        },
        { status: 400 },
      )
    }

    // 2. Obter planId e amountInCents (prioridade: parâmetro > env var > criar dinamicamente)
    let planId = providedPlanId || process.env.PAGARME_PLAN_ID
    let monthlyAmount: number

    if (!planId) {
      // Fallback: criar plano dinamicamente se não foi fornecido
      if (!amountInCents) {
        return NextResponse.json(
          {
            error:
              'É necessário fornecer planId ou amountInCents para criar um plano.',
          },
          { status: 400 },
        )
      }

      monthlyAmount = amountInCents
      console.log('Plano não fornecido. Criando plano dinamicamente...')
      try {
        const plan = await createMonthlyPlan(planName, amountInCents)
        planId = plan.id
        console.log('Plano criado dinamicamente:', planId)
      } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any
        console.error('Erro ao criar plano:', err.response?.data)
        return NextResponse.json(
          { error: 'Erro ao criar plano de assinatura.' },
          { status: 500 },
        )
      }
    } else {
      console.log('Usando plano fixo:', planId)
      // Se planId foi fornecido mas não amountInCents, buscar do plano
      if (amountInCents) {
        monthlyAmount = amountInCents
      } else {
        try {
          const plan = await getPlan(planId)
          // Extrair o valor do primeiro item do plano
          monthlyAmount =
            plan.items?.[0]?.pricing_scheme?.price ||
            plan.items?.[0]?.cycles?.[0]?.price ||
            0
          if (!monthlyAmount || monthlyAmount === 0) {
            return NextResponse.json(
              {
                error:
                  'Não foi possível obter o valor do plano. Forneça amountInCents.',
              },
              { status: 400 },
            )
          }
          console.log('Valor mensal obtido do plano:', monthlyAmount)
        } catch (error: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const err = error as any
          console.error('Erro ao buscar plano:', err.response?.data)
          return NextResponse.json(
            {
              error:
                'Erro ao buscar plano. Verifique se o planId está correto ou forneça amountInCents.',
            },
            { status: 400 },
          )
        }
      }
    }

    // Garantir que planId existe (já validado acima)
    if (!planId) {
      return NextResponse.json(
        { error: 'PlanId é obrigatório' },
        { status: 400 },
      )
    }

    // 3. Lógica de Cobrança (assinatura mensal padrão)
    console.log('Criando assinatura mensal recorrente.')

    const subscriptionPayload = {
      plan_id: planId,
      customer_id: pagarmeCustomerId,
      card_id: cardId,
      payment_method: 'credit_card',
      // start_at não é enviado, começa agora
    }

    const subscriptionResponse = await axios.post(
      'https://api.pagar.me/core/v5/subscriptions',
      subscriptionPayload,
      {
        headers: {
          Authorization: getPagarmeAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    )

    // Atualizar flags no usuário
    await userRef.update({
      hasFirstSubscription: true,
      hasActiveSubscription: true,
    })

    // 4. Salvar assinatura na collection subscriptions
    const subscriptionId = subscriptionResponse.data.id

    // Criar objeto base (campos obrigatórios)
    const subscriptionData: {
      id: string
      userId: string
      pagarmeCustomerId: string
      pagarmeCardId: string
      pagarmeSubscriptionId: string
      pagarmePlanId: string
      monthlyAmountInCents: number
      status: 'active'
      isFirstSubscription: boolean
      startDate: Date
      createdAt: Date
      updatedAt: Date
      pagarmeInitialOrderId?: string
      upfrontAmountInCents?: number
      nextBillingDate?: Date
    } = {
      id: subscriptionId,
      userId,
      pagarmeCustomerId,
      pagarmeCardId: cardId,
      pagarmeSubscriptionId: subscriptionResponse.data.id,
      pagarmePlanId: planId,
      monthlyAmountInCents: monthlyAmount,
      status: 'active',
      isFirstSubscription: !hasFirstSubscription,
      startDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      await adminDb
        .collection('subscriptions')
        .doc(subscriptionId)
        .set(subscriptionData)
      console.log('Assinatura salva no Firestore:', subscriptionId)
    } catch (dbError) {
      console.error('Erro ao salvar assinatura no Firestore:', dbError)
      // Não falha a requisição se houver erro ao salvar no Firestore
      // A assinatura já foi criada no Pagar.me
    }

    return NextResponse.json(
      {
        success: true,
        subscriptionId: subscriptionResponse.data.id,
        message: hasFirstSubscription
          ? 'Assinatura mensal criada com sucesso.'
          : 'Assinatura mensal criada com sucesso.',
      },
      { status: 201 },
    )
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as AxiosError<any>
    console.error(
      'Erro ao processar assinatura:',
      axiosError.response?.data || axiosError.message,
    )

    return NextResponse.json(
      {
        error:
          axiosError.response?.data?.errors || 'Erro ao processar assinatura.',
      },
      { status: axiosError.response?.status || 500 },
    )
  }
}
