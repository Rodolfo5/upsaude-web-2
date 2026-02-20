/**
 * API Route para notificar médicos sobre exames com status "requested" (não realizados).
 *
 * Chamada pelo Vercel Cron todo dia às 5h. Consulta todos os exames pendentes
 * (status = requested), agrupa por médico solicitante e envia uma doctorNotification
 * com a lista de pacientes/exames pendentes.
 *
 * Para testar no localhost:
 * curl http://localhost:3000/api/cron/exam-reminder-to-doctor
 */

import { NextResponse } from 'next/server'

import { runExamReminderToDoctor } from '@/lib/schedulers/examReminderToDoctor'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runExamReminderToDoctor()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao executar lembrete de exames para médico:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
