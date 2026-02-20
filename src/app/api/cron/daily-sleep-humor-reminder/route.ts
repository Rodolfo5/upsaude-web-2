/**
 * API Route para lembrete de sono e humor.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 10h
 * para verificar se os pacientes informaram o sono e humor de hoje.
 *
 * Para testar no localhost: abra no navegador ou
 * curl http://localhost:3000/api/cron/daily-sleep-humor-reminder
 */

import { NextResponse } from 'next/server'

import { runDailySleepHumorReminder } from '@/lib/schedulers/dailySleepHumorReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailySleepHumorReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao executar lembrete de sono e humor:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
