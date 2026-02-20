/**
 * API de dar alta ao paciente do plano terapêutico
 *
 * Endpoint para dar alta ao paciente, marcando o plano como concluído
 * e criando automaticamente um novo checkup para o paciente preencher.
 *
 * Fluxo:
 * 1. Valida se o médico é o médico do paciente (patient.doctorId === doctorId)
 * 2. Verifica se o plano existe e não foi dado alta anteriormente
 * 3. Marca o plano com dischargedAt
 * 4. Cria novo checkup com status REQUESTED
 * 5. Retorna sucesso
 */

import admin from 'firebase-admin'
import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import { dischargeTherapeuticPlan } from '@/services/therapeuticPlan'
import { CheckupStatus } from '@/types/entities/healthCheckup'

interface DischargePlanRequest {
  patientId: string
  planId: string
  doctorId: string
}

interface DischargePlanResponse {
  success: boolean
  error?: string
  planId?: string
  checkupId?: string
}

export async function POST(
  request: Request,
): Promise<NextResponse<DischargePlanResponse>> {
  try {
    const body = (await request.json()) as DischargePlanRequest

    const { patientId, planId, doctorId } = body

    // Validação
    if (!patientId || !planId || !doctorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'patientId, planId e doctorId são obrigatórios',
        },
        { status: 400 },
      )
    }

    console.log(
      `Iniciando processo de dar alta ao paciente ${patientId} do plano ${planId}`,
    )

    // Inicializar Admin SDK
    await getAdminApp()
    const db = adminFirestore()

    // Buscar paciente e verificar se o médico é o médico do paciente
    const patientRef = db.collection('users').doc(patientId)
    const patientDoc = await patientRef.get()

    if (!patientDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paciente não encontrado',
        },
        { status: 404 },
      )
    }

    const patientDoctorId = patientDoc.data()?.doctorId

    if (patientDoctorId !== doctorId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas o médico do paciente pode dar alta',
        },
        { status: 403 },
      )
    }

    // Dar alta no plano
    const dischargedPlan = await dischargeTherapeuticPlan(
      patientId,
      planId,
      doctorId,
    )

    console.log(`Plano ${planId} dado alta com sucesso`)

    // Criar novo checkup automaticamente usando Admin SDK
    const checkupRef = db
      .collection('users')
      .doc(patientId)
      .collection('healthCheckups')
      .doc()
    const checkupId = checkupRef.id
    const now = admin.firestore.Timestamp.now()

    await checkupRef.set({
      id: checkupId,
      userId: patientId,
      doctorId,
      status: CheckupStatus.REQUESTED,
      createdAt: now,
      updatedAt: now,
    })

    console.log(
      `Novo checkup ${checkupId} criado para o paciente ${patientId}`,
    )

    return NextResponse.json({
      success: true,
      planId: dischargedPlan.id,
      checkupId,
    })
  } catch (error) {
    console.error('Erro ao dar alta ao paciente:', error)

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro ao dar alta ao paciente. Tente novamente.'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
