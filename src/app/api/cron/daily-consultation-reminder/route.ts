/**
 * API Route para lembrete de consultas do dia.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 5h
 * para verificar se os pacientes têm consulta agendada para hoje.
 *
 * Para testar no localhost: abra no navegador ou
 * curl http://localhost:3000/api/cron/daily-consultation-reminder
 */

import { NextResponse } from 'next/server'

import { runDailyConsultationReminder } from '@/lib/schedulers/dailyConsultationReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailyConsultationReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao executar lembrete de consultas:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
