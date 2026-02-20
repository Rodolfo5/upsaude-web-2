/**
 * API Route para notificar médicos quando pacientes não estão aderindo
 * ao plano medicamentoso.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 5h,
 * junto com o lembrete de medicamentos para o paciente.
 *
 * Para testar no localhost:
 * curl http://localhost:3000/api/cron/daily-medication-adherence-doctor
 */

import { NextResponse } from 'next/server'

import { runDailyMedicationAdherenceDoctorReminder } from '@/lib/schedulers/dailyMedicationAdherenceDoctorReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailyMedicationAdherenceDoctorReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Erro ao executar lembrete de adesão à medicação (médico):',
      error,
    )
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

