/**
 * API Route para notificar médicos sobre questionários com respostas pendentes.
 *
 * Chamada pelo Vercel Cron todo dia às 5h. Verifica a coleção requestQuestionnaires,
 * identifica pacientes que ainda não responderam (patientIds \ patientsWhoResponded)
 * e envia uma notificação ao médico que enviou cada questionário.
 *
 * Para testar no localhost:
 * curl http://localhost:3000/api/cron/questionnaire-reminder-to-doctor
 */

import { NextResponse } from 'next/server'

import { runQuestionnaireReminderToDoctor } from '@/lib/schedulers/questionnaireReminderToDoctor'

export const maxDuration = 120

export async function GET() {
  try {
    const results = await runQuestionnaireReminderToDoctor()

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Erro ao executar lembrete de questionários para médico:',
      error,
    )
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
