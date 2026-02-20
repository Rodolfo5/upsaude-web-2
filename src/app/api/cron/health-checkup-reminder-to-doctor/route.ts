/**
 * API Route para notificar médicos sobre check-ups digitais com status "REQUESTED" (pendentes).
 *
 * Chamada pelo Vercel Cron todo dia às 5h. Consulta users/{id}/healthCheckups com status REQUESTED,
 * agrupa por médico e envia uma doctorNotification por (médico, paciente).
 *
 * Para testar no localhost:
 * curl http://localhost:3000/api/cron/health-checkup-reminder-to-doctor
 */

import { NextResponse } from 'next/server'

import { runHealthCheckupReminderToDoctor } from '@/lib/schedulers/healthCheckupReminderToDoctor'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runHealthCheckupReminderToDoctor()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Erro ao executar lembrete de check-up digital para médico:',
      error,
    )
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
