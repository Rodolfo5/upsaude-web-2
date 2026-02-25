/**
 * 🤖 API DE GERAÇÃO DE PLANO TERAPÊUTICO COM IA
 *
 * Endpoint para gerar plano terapêutico completo a partir do checkup digital.
 * Utiliza Vertex AI (Gemini) para análise e geração de metas, atividades e orientações.
 *
 * Fluxo:
 * 1. Recebe checkupId, patientId, doctorId
 * 2. Busca checkup completo no Firestore
 * 3. Chama Vertex AI para gerar plano estruturado
 * 4. Cria plano terapêutico e health pillars
 * 5. Cria metas, atividades e orientações para cada pilar
 * 6. Retorna plano criado
 *
 * ⚠️ IMPORTANTE:
 * - Requer biblioteca @google-cloud/vertexai instalada
 * - Requer credenciais do Google Cloud configuradas
 * - Só funciona para checkups que estão COMPLETED
 */

import admin from 'firebase-admin'
import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import { generateHealthPlan } from '@/services/aiHealthPlan'
import type { HealthCheckupEntity } from '@/types/entities/healthCheckup'
import { isCheckupCompleted } from '@/utils/checkup/checkupStatus'

// ====================================================================
// 📋 TIPOS
// ====================================================================

/**
 * Dados de entrada para geração de plano
 */
interface GeneratePlanRequest {
  checkupId: string
  patientId: string
  doctorId: string
  doctorName?: string
}

/**
 * Resposta da API
 */
interface GeneratePlanResponse {
  success: boolean
  error?: string
  planId?: string
  aiModel?: string
  itemsCreated?: {
    goals: number
    activities: number
    orientations: number
    categories: number
  }
}

// ====================================================================
// 🚀 HANDLER POST
// ====================================================================

export async function POST(
  request: Request,
): Promise<NextResponse<GeneratePlanResponse>> {
  try {
    const body = (await request.json()) as GeneratePlanRequest

    const { checkupId, patientId, doctorId, doctorName } = body

    // Validação
    if (!checkupId || !patientId || !doctorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'checkupId, patientId e doctorId são obrigatórios',
        },
        { status: 400 },
      )
    }

    console.log(
      `Iniciando geração de plano terapêutico para checkup ${checkupId}`,
    )

    // Buscar checkup no Firestore
    await getAdminApp()
    const db = adminFirestore()
    const checkupRef = db
      .collection('users')
      .doc(patientId)
      .collection('healthCheckups')
      .doc(checkupId)
    const checkupSnap = await checkupRef.get()

    if (!checkupSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Checkup não encontrado',
        },
        { status: 404 },
      )
    }

    const checkupData = checkupSnap.data() as any
    const checkup: HealthCheckupEntity = {
      ...checkupData,
      id: checkupSnap.id,
      createdAt: checkupData.createdAt?.toDate
        ? checkupData.createdAt.toDate()
        : checkupData.createdAt,
      updatedAt: checkupData.updatedAt?.toDate
        ? checkupData.updatedAt.toDate()
        : checkupData.updatedAt,
      completedAt: checkupData.completedAt?.toDate
        ? checkupData.completedAt.toDate()
        : checkupData.completedAt,
    }

    // Verificar se checkup está completo (suporta integrações legadas)
    if (!isCheckupCompleted(checkupData)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Checkup não está completo. Complete o checkup antes de gerar o plano.',
        },
        { status: 400 },
      )
    }

    console.log(
      `Checkup encontrado (${checkup.status}). Gerando plano com IA...`,
    )

    // Gerar plano com IA
    const aiResult = await generateHealthPlan(checkup)

    if (aiResult.error || !aiResult.plan) {
      console.error(`Erro ao gerar plano: ${aiResult.error}`)

      return NextResponse.json(
        {
          success: false,
          error:
            aiResult.error ??
            'Não foi possível gerar o plano terapêutico com IA',
        },
        { status: 500 },
      )
    }

    const aiPlan = aiResult.plan
    const aiModel = process.env.VERTEX_MODEL || 'gemini-2.5-flash-lite'
    const now = admin.firestore.Timestamp.now()

    console.log(
      `Plano gerado pela IA. Criando estrutura no Firestore com Admin SDK...`,
    )

    // Criar plano terapêutico
    const planRef = db
      .collection('users')
      .doc(patientId)
      .collection('therapeuticPlans')
      .doc()
    const planId = planRef.id

    await planRef.set({
      id: planId,
      patientId,
      doctorId,
      objective: `Plano terapêutico gerado automaticamente pela IA baseado no checkup digital de ${new Date(checkup.completedAt || now.toDate()).toLocaleDateString('pt-BR')}`,
      reevaluationPeriod: 6,
      reevaluationPeriodUnit: 'Meses',
      status: 'draft',
      createdBy: doctorName || 'Sistema',
      sourceCheckupId: checkupId,
      aiGeneratedPlan: true,
      aiGeneratedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    // Criar health pillars
    const mentalHealthPillarRef = db
      .collection('users')
      .doc(patientId)
      .collection('therapeuticPlans')
      .doc(planId)
      .collection('healthPillars')
      .doc()
    const mentalHealthPillarId = mentalHealthPillarRef.id

    await mentalHealthPillarRef.set({
      id: mentalHealthPillarId,
      patientId,
      planId,
      type: 'Saúde Mental',
      createdAt: now,
      updatedAt: now,
    })

    const biomarkersPillarRef = db
      .collection('users')
      .doc(patientId)
      .collection('therapeuticPlans')
      .doc(planId)
      .collection('healthPillars')
      .doc()
    const biomarkersPillarId = biomarkersPillarRef.id

    await biomarkersPillarRef.set({
      id: biomarkersPillarId,
      patientId,
      planId,
      type: 'Biomarcadores de Saúde',
      createdAt: now,
      updatedAt: now,
    })

    const lifestylePillarRef = db
      .collection('users')
      .doc(patientId)
      .collection('therapeuticPlans')
      .doc(planId)
      .collection('healthPillars')
      .doc()
    const lifestylePillarId = lifestylePillarRef.id

    await lifestylePillarRef.set({
      id: lifestylePillarId,
      patientId,
      planId,
      type: 'Estilo de Vida',
      createdAt: now,
      updatedAt: now,
    })

    let totalGoals = 0
    let totalActivities = 0
    let totalOrientations = 0
    let totalCategories = 0

    // Criar biomarcadores baseados em dados do checkup
    const bloodPressureValue =
      checkup.initialData?.bloodPressureValues ||
      checkup.hypertensionScreening?.bloodPressureValues
    const hasBloodPressure =
      (bloodPressureValue && bloodPressureValue !== 'Não sei') ||
      checkup.hypertensionScreening?.previousDiagnosis === 'Sim' ||
      (checkup.activeProblemsList?.conditions || []).some((condition) =>
        condition.toLowerCase().includes('hipertensão'),
      )

    const bloodGlucoseValue = checkup.initialData?.bloodGlucoseValues
    const hasBloodGlucose =
      (bloodGlucoseValue && bloodGlucoseValue !== 'Não sei') ||
      checkup.diabetesScreening?.previousHighGlucose === 'Sim'

    const biomarkersToCreate: Array<{
      type: 'bloodPressure' | 'bloodGlucose'
      minValue: string
      maxValue: string
    }> = []

    if (hasBloodPressure) {
      biomarkersToCreate.push({
        type: 'bloodPressure',
        minValue: '90/60',
        maxValue: '120/80',
      })
    }

    if (hasBloodGlucose) {
      biomarkersToCreate.push({
        type: 'bloodGlucose',
        minValue: '79',
        maxValue: '99',
      })
    }

    for (const biomarker of biomarkersToCreate) {
      const biomarkerRef = db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .doc(planId)
        .collection('healthPillars')
        .doc(biomarkersPillarId)
        .collection('biomarkers')
        .doc()

      await biomarkerRef.set({
        id: biomarkerRef.id,
        pillarId: biomarkersPillarId,
        type: biomarker.type,
        minValue: biomarker.minValue,
        maxValue: biomarker.maxValue,
        status: 'pending',
        createdBy: doctorName || 'IA',
        createdAt: now,
        updatedAt: now,
      })
    }

    // Criar metas, atividades e orientações de Saúde Mental
    for (const goalData of aiPlan.mentalHealth.goals) {
      const goalRef = db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .doc(planId)
        .collection('healthPillars')
        .doc(mentalHealthPillarId)
        .collection('goals')
        .doc()
      const goalId = goalRef.id

      await goalRef.set({
        id: goalId,
        pillarId: mentalHealthPillarId,
        type: goalData.type,
        desiredParameter: goalData.desiredParameter,
        status: 'Ativa',
        doctorId,
        aiGenerated: true,
        aiGeneratedAt: now,
        aiModel,
        approvalStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      totalGoals++

      // Criar atividades da meta
      for (const activityData of goalData.activities) {
        const activityRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(planId)
          .collection('healthPillars')
          .doc(mentalHealthPillarId)
          .collection('activities')
          .doc()

        await activityRef.set({
          id: activityRef.id,
          pillarId: mentalHealthPillarId,
          goalId,
          name: activityData.name,
          description: activityData.description || '',
          frequency: activityData.frequency || '',
          deadlineValue: activityData.deadlineValue || '',
          deadlineUnit: activityData.deadlineUnit || '',
          status: 'Ativa',
          doctorId,
          aiGenerated: true,
          aiGeneratedAt: now,
          aiModel,
          createdAt: now,
          updatedAt: now,
        })
        totalActivities++
      }

      // Criar orientações da meta
      for (const orientationData of goalData.orientations) {
        const orientationRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(planId)
          .collection('healthPillars')
          .doc(mentalHealthPillarId)
          .collection('orientations')
          .doc()

        await orientationRef.set({
          id: orientationRef.id,
          pillarId: mentalHealthPillarId,
          goalId,
          title: orientationData.title,
          description: orientationData.description || '',
          isRead: false,
          status: 'Ativa',
          doctorId,
          aiGenerated: true,
          aiGeneratedAt: now,
          aiModel,
          createdAt: now,
          updatedAt: now,
        })
        totalOrientations++
      }
    }

    // Criar metas, atividades e orientações de Biomarcadores
    for (const goalData of aiPlan.biomarkers.goals) {
      const goalRef = db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .doc(planId)
        .collection('healthPillars')
        .doc(biomarkersPillarId)
        .collection('goals')
        .doc()
      const goalId = goalRef.id

      await goalRef.set({
        id: goalId,
        pillarId: biomarkersPillarId,
        name: goalData.name,
        desiredParameter: goalData.desiredParameter,
        status: 'Ativa',
        doctorId,
        aiGenerated: true,
        aiGeneratedAt: now,
        aiModel,
        approvalStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      totalGoals++

      // Criar atividades da meta
      for (const activityData of goalData.activities) {
        const activityRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(planId)
          .collection('healthPillars')
          .doc(biomarkersPillarId)
          .collection('activities')
          .doc()

        // Montar frequência combinada para compatibilidade com a interface (ex: "3x Semana")
        const frequencyValue = (activityData as any).frequencyValue || ''
        const frequencyUnit = (activityData as any).frequencyUnit || ''
        const combinedFrequency =
          frequencyValue && frequencyUnit
            ? `${frequencyValue}x ${frequencyUnit}`
            : (activityData as any).frequency || ''

        await activityRef.set({
          id: activityRef.id,
          pillarId: biomarkersPillarId,
          goalId,
          name: activityData.name,
          description: activityData.description || '',
          frequency: combinedFrequency,
          frequencyValue,
          frequencyUnit,
          deadlineValue: activityData.deadlineValue || '',
          deadlineUnit: activityData.deadlineUnit || '',
          status: 'Ativa',
          doctorId,
          aiGenerated: true,
          aiGeneratedAt: now,
          aiModel,
          createdAt: now,
          updatedAt: now,
        })
        totalActivities++
      }

      // Criar orientações da meta
      for (const orientationData of goalData.orientations) {
        const orientationRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(planId)
          .collection('healthPillars')
          .doc(biomarkersPillarId)
          .collection('orientations')
          .doc()

        await orientationRef.set({
          id: orientationRef.id,
          pillarId: biomarkersPillarId,
          goalId,
          title: orientationData.title,
          description: orientationData.description || '',
          isRead: false,
          status: 'Ativa',
          doctorId,
          aiGenerated: true,
          aiGeneratedAt: now,
          aiModel,
          createdAt: now,
          updatedAt: now,
        })
        totalOrientations++
      }
    }

    // Criar categorias, atividades e orientações de Estilo de Vida
    for (const categoryData of aiPlan.lifestyle.categories) {
      const categoryRef = db
        .collection('users')
        .doc(patientId)
        .collection('therapeuticPlans')
        .doc(planId)
        .collection('healthPillars')
        .doc(lifestylePillarId)
        .collection('categories')
        .doc()
      const categoryId = categoryRef.id

      // Converter desiredParameter para formato objeto quando necessário
      let desiredParam: number | string | object | undefined =
        categoryData.desiredParameter
      if (
        categoryData.type === 'Movimentos - Passos' &&
        typeof categoryData.desiredParameter === 'number'
      ) {
        desiredParam = {
          quantity: categoryData.desiredParameter,
          unit: 'Passos',
        }
      }
      await categoryRef.set({
        id: categoryId,
        pillarId: lifestylePillarId,
        type: categoryData.type,
        desiredParameter: desiredParam,
        status: 'Ativa',
        doctorId,
        aiGenerated: true,
        aiGeneratedAt: now,
        aiModel,
        approvalStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      totalCategories++

      // Criar atividades da categoria (goalId vazio para estilo de vida)
      for (const activityData of categoryData.activities) {
        const activityRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(planId)
          .collection('healthPillars')
          .doc(lifestylePillarId)
          .collection('activities')
          .doc()

        await activityRef.set({
          id: activityRef.id,
          pillarId: lifestylePillarId,
          goalId: categoryId, // Para estilo de vida, goalId é o ID da categoria
          name: activityData.name,
          description: activityData.description || '',
          frequency: activityData.frequency || '',
          status: 'Ativa',
          doctorId,
          aiGenerated: true,
          aiGeneratedAt: now,
          aiModel,
          createdAt: now,
          updatedAt: now,
        })
        totalActivities++
      }

      // Criar orientações da categoria
      for (const orientationData of categoryData.orientations) {
        const orientationRef = db
          .collection('users')
          .doc(patientId)
          .collection('therapeuticPlans')
          .doc(planId)
          .collection('healthPillars')
          .doc(lifestylePillarId)
          .collection('orientations')
          .doc()

        await orientationRef.set({
          id: orientationRef.id,
          pillarId: lifestylePillarId,
          goalId: categoryId, // Para estilo de vida, goalId é o ID da categoria
          area: orientationData.area || '',
          title: orientationData.title,
          description: orientationData.description || '',
          isRead: false,
          status: 'Ativa',
          doctorId,
          aiGenerated: true,
          aiGeneratedAt: now,
          aiModel,
          createdAt: now,
          updatedAt: now,
        })
        totalOrientations++
      }
    }

    // Atualizar contadores no plano usando admin SDK
    await db
      .collection('users')
      .doc(patientId)
      .collection('therapeuticPlans')
      .doc(planId)
      .set(
        {
          aiGeneratedItems: {
            total:
              totalGoals +
              totalActivities +
              totalOrientations +
              totalCategories,
            pending:
              totalGoals +
              totalActivities +
              totalOrientations +
              totalCategories,
            approved: 0,
            rejected: 0,
          },
        },
        { merge: true },
      )

    console.log(
      `Plano criado com sucesso: ${totalGoals} metas, ${totalActivities} atividades, ${totalOrientations} orientações, ${totalCategories} categorias`,
    )

    return NextResponse.json({
      success: true,
      planId,
      aiModel,
      itemsCreated: {
        goals: totalGoals,
        activities: totalActivities,
        orientations: totalOrientations,
        categories: totalCategories,
      },
    })
  } catch (error) {
    console.error('Erro na API de geração de plano:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao processar geração de plano terapêutico',
      },
      { status: 500 },
    )
  }
}
