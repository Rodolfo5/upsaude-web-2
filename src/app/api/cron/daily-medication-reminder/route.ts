/**
 * API Route para lembrete de medicamento 30 min antes da dose.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) em frequência curta
 * (ex: a cada 5 min) para encontrar doses na janela de 30 min.
 *
 * Para testar no localhost: abra no navegador ou
 * curl http://localhost:3000/api/cron/daily-medication-reminder
 */

import { NextResponse } from 'next/server'

import { runDailyMedicationReminder } from '@/lib/schedulers/dailyMedicationReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailyMedicationReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao executar lembrete de medicamentos:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
