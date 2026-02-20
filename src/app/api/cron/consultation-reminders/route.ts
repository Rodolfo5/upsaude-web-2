/**
 * API Route para executar lembretes de consulta.
 *
 * Deve ser chamada por um cron job (ex: Vercel Cron) para enviar
 * lembretes 24h, 12h e 3h antes das consultas.
 *
 * Configurar no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/consultation-reminders",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server'

import { runAllConsultationReminders } from '@/lib/schedulers/consultationReminders'

export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await runAllConsultationReminders()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao executar lembretes de consulta:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
