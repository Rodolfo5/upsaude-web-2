/**
 * API Route para lembrete diário de atividades do plano terapêutico.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) todo dia às 8h da manhã
 * para verificar se os pacientes têm atividades para hoje e enviar notificações push.
 *
 * Configurar no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-activities-reminder",
 *     "schedule": "0 8 * * *"
 *   }]
 * }
 *
 * Para testar no localhost: abra no navegador ou
 * curl http://localhost:3000/api/cron/daily-activities-reminder
 */

import { NextResponse } from 'next/server'

import { runDailyActivitiesReminder } from '@/lib/schedulers/dailyActivitiesReminder'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runDailyActivitiesReminder()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao executar lembrete de atividades diárias:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
