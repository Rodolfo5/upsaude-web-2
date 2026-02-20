/**
 * API Route para notificar médicos quando pacientes não estão aderindo
 * ao plano terapêutico (atividades pendentes no dia).
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 17h,
 * após o horário esperado de realização das atividades.
 *
 * Para testar no localhost:
 * curl http://localhost:3000/api/cron/daily-therapeutic-plan-adherence-doctor
 */

import { NextResponse } from 'next/server'

import { runDailyTherapeuticPlanAdherenceDoctorReminder } from '@/lib/schedulers/dailyTherapeuticPlanAdherenceDoctorReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailyTherapeuticPlanAdherenceDoctorReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Erro ao executar lembrete de adesão ao plano (médico):',
      error,
    )
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

