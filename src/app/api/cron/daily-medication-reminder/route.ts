/**
 * API Route para lembrete de medicamentos do dia.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 5h
 * para verificar se os pacientes têm medicamentos para tomar hoje.
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
