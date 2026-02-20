/**
 * API Route para lembrete de atividades não realizadas no dia.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 17h
 * para verificar se os pacientes deixaram de fazer alguma atividade
 * que era para hoje e enviar notificações push.
 *
 * Para testar no localhost: abra no navegador ou
 * curl http://localhost:3000/api/cron/daily-activities-missed-reminder
 */

import { NextResponse } from 'next/server'

import { runDailyActivitiesMissedReminder } from '@/lib/schedulers/dailyActivitiesMissedReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailyActivitiesMissedReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Erro ao executar lembrete de atividades não realizadas:',
      error,
    )
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
