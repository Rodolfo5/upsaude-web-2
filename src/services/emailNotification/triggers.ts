/**
 * Funções trigger para disparar notificações por e-mail.
 *
 * Cada função corresponde a um evento específico das tabelas de requisitos.
 */

import { doc, getDoc, getFirestore } from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import {
  EmailNotificationCategory,
  EmailNotificationEventType,
} from '@/types/entities/emailNotification'

import {
  generateEventHash,
  sendNotificationWithDeduplication,
} from './emailNotification'

const db = getFirestore(firebaseApp)

interface RecipientInfo {
  id: string
  email: string
  name: string
}

async function getRecipientInfo(userId: string): Promise<RecipientInfo | null> {
  const userRef = doc(db, 'users', userId)
  const userDoc = await getDoc(userRef)
  if (!userDoc.exists()) return null
  const data = userDoc.data()
  return {
    id: userDoc.id,
    email: data.email || '',
    name: data.name || 'Usuário',
  }
}

async function notifyRecipients(
  recipientIds: string[],
  eventType: EmailNotificationEventType,
  category: EmailNotificationCategory,
  title: string,
  message: string,
  eventId: string,
  metadata: Record<string, unknown>,
  additionalHashData?: string,
): Promise<void> {
  for (const recipientId of recipientIds) {
    const recipient = await getRecipientInfo(recipientId)
    if (!recipient || !recipient.email) continue

    const eventHash = generateEventHash(
      eventType,
      eventId,
      recipientId,
      additionalHashData,
    )

    await sendNotificationWithDeduplication({
      eventType,
      category,
      recipientId,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      title,
      message,
      eventId,
      eventHash,
      metadata,
    })
  }
}

export async function notifyQuestionnaireNotAnswered(
  doctorId: string,
  patientId: string,
  questionnaireId: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.QUESTIONNAIRE_NOT_ANSWERED,
    questionnaireId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.QUESTIONNAIRE_NOT_ANSWERED,
    category: EmailNotificationCategory.QUESTIONNAIRES,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Questionário pendente de resposta',
    message: 'Um questionário solicitado ao paciente está pendente de resposta.',
    eventId: questionnaireId,
    eventHash,
    metadata: { patientId, questionnaireId },
  })
}

export async function notifyPlanNotCompleted(
  doctorId: string,
  patientId: string,
  planId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.PLAN_NOT_COMPLETED,
    planId,
    doctorId,
    patientId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.PLAN_NOT_COMPLETED,
    category: EmailNotificationCategory.THERAPEUTIC_PLAN,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Paciente não cumpriu plano',
    message: `O paciente ${patientName} não cumpriu o plano terapêutico após 3 avisos.`,
    eventId: planId,
    eventHash,
    metadata: { patientId, planId, patientName },
  })
}

export async function notifyPlanReevaluationRequested(
  doctorId: string,
  patientId: string,
  planId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.PLAN_REEVALUATION_REQUESTED,
    planId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.PLAN_REEVALUATION_REQUESTED,
    category: EmailNotificationCategory.THERAPEUTIC_PLAN,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Paciente solicitou reavaliação',
    message: `O paciente ${patientName} solicitou reavaliação do plano terapêutico.`,
    eventId: planId,
    eventHash,
    metadata: { patientId, planId, patientName },
  })
}

export async function notifyAllGoalsCompleted(
  doctorId: string,
  patientId: string,
  planId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.ALL_GOALS_COMPLETED,
    planId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.ALL_GOALS_COMPLETED,
    category: EmailNotificationCategory.THERAPEUTIC_PLAN,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Paciente atingiu todas as metas',
    message: `O paciente ${patientName} atingiu todas as metas. Reavalie o Plano Terapêutico.`,
    eventId: planId,
    eventHash,
    metadata: { patientId, planId, patientName },
  })
}

export async function notifyGoalCompleted(
  doctorId: string,
  patientId: string,
  planId: string,
  goalId: string,
  patientName: string,
  goalDescription?: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.GOAL_COMPLETED,
    goalId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.GOAL_COMPLETED,
    category: EmailNotificationCategory.THERAPEUTIC_PLAN,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Paciente alcançou uma meta',
    message: `O paciente ${patientName} alcançou a meta${goalDescription ? `: ${goalDescription}` : ''}.`,
    eventId: goalId,
    eventHash,
    metadata: { patientId, planId, goalId, patientName },
  })
}

export async function notifyPlanAlteredByOtherDoctor(
  doctorIds: string[],
  planId: string,
  alteredByDoctorId: string,
  alteredByDoctorName: string,
  patientId: string,
  requiresApproval?: boolean,
): Promise<void> {
  const title = requiresApproval
    ? 'Aprove esta ação!'
    : 'Plano alterado por outro médico'
  const message = requiresApproval
    ? `O médico ${alteredByDoctorName} alterou uma meta/medicamento. Aprove esta ação!`
    : `O médico ${alteredByDoctorName} alterou uma meta/medicamento.`

  await notifyRecipients(
    doctorIds,
    EmailNotificationEventType.PLAN_ALTERED_BY_OTHER_DOCTOR,
    EmailNotificationCategory.THERAPEUTIC_PLAN,
    title,
    message,
    planId,
    {
      patientId,
      planId,
      alteredByDoctorId,
      alteredByDoctorName,
    },
    alteredByDoctorId,
  )
}

export async function notifyExamPending(
  doctorId: string,
  patientId: string,
  examId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.EXAM_PENDING,
    examId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.EXAM_PENDING,
    category: EmailNotificationCategory.PRESCRIPTIONS,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Exame pendente',
    message: `O paciente ${patientName} está pendente de realização de exame.`,
    eventId: examId,
    eventHash,
    metadata: { patientId, examId, patientName },
  })
}

export async function notifyExamCompleted(
  doctorId: string,
  patientId: string,
  examId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.EXAM_COMPLETED,
    examId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.EXAM_COMPLETED,
    category: EmailNotificationCategory.PRESCRIPTIONS,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Exame realizado',
    message: `O paciente ${patientName} realizou o exame solicitado.`,
    eventId: examId,
    eventHash,
    metadata: { patientId, examId, patientName },
  })
}

export async function notifyMedicationNotFollowed(
  doctorId: string,
  patientId: string,
  medicationId: string,
  patientName: string,
  medicationName?: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.MEDICATION_NOT_FOLLOWED,
    medicationId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.MEDICATION_NOT_FOLLOWED,
    category: EmailNotificationCategory.PRESCRIPTIONS,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Paciente não está aderindo ao plano medicamentoso',
    message: `O paciente ${patientName} não está seguindo o plano medicamentoso${medicationName ? ` (${medicationName})` : ''}.`,
    eventId: medicationId,
    eventHash,
    metadata: { patientId, medicationId, patientName, medicationName },
  })
}

export async function notifyConsultationScheduled(
  doctorId: string,
  consultationId: string,
  dateTime?: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.CONSULTATION_SCHEDULED,
    consultationId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.CONSULTATION_SCHEDULED,
    category: EmailNotificationCategory.CONSULTATIONS,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Nova consulta agendada',
    message: dateTime
      ? `Uma nova consulta foi agendada para ${dateTime}.`
      : 'Uma nova consulta foi agendada.',
    eventId: consultationId,
    eventHash,
    metadata: { consultationId, dateTime },
  })
}

export async function notifyConsultationReminder(
  doctorId: string,
  consultationId: string,
  dateTime: string,
  timeframe: '24h' | '12h' | '3h',
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.CONSULTATION_REMINDER,
    consultationId,
    doctorId,
    timeframe,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.CONSULTATION_REMINDER,
    category: EmailNotificationCategory.CONSULTATIONS,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Sua próxima consulta está se aproximando!',
    message: `Sua consulta está agendada para ${dateTime} (em ${timeframe}).`,
    eventId: consultationId,
    eventHash,
    metadata: { consultationId, dateTime, timeframe },
  })
}

export async function notifyConsultationCanceled(
  doctorId: string,
  consultationId: string,
  dateTime: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.CONSULTATION_CANCELED,
    consultationId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.CONSULTATION_CANCELED,
    category: EmailNotificationCategory.CONSULTATIONS,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Consulta cancelada',
    message: `A consulta de ${dateTime} foi cancelada. Agende um novo horário.`,
    eventId: consultationId,
    eventHash,
    metadata: { consultationId, dateTime },
  })
}

export async function notifyCheckupPending(
  doctorId: string,
  patientId: string,
  checkupId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.CHECKUP_PENDING,
    checkupId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.CHECKUP_PENDING,
    category: EmailNotificationCategory.CHECKUP,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Check-up pendente',
    message: `O check-up do paciente ${patientName} está pendente de resposta.`,
    eventId: checkupId,
    eventHash,
    metadata: { patientId, checkupId, patientName },
  })
}

export async function notifyCheckupNotResponded(
  doctorId: string,
  patientId: string,
  checkupId: string,
  patientName: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.CHECKUP_NOT_RESPONDED,
    checkupId,
    doctorId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.CHECKUP_NOT_RESPONDED,
    category: EmailNotificationCategory.CHECKUP,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Check-up não respondido',
    message: `O check-up do paciente ${patientName} ainda não foi respondido.`,
    eventId: checkupId,
    eventHash,
    metadata: { patientId, checkupId, patientName },
  })
}

export async function notifyNewMessage(
  doctorId: string,
  chatId: string,
  senderId: string,
): Promise<void> {
  const recipient = await getRecipientInfo(doctorId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.NEW_MESSAGE,
    chatId,
    doctorId,
    senderId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.NEW_MESSAGE,
    category: EmailNotificationCategory.CHAT,
    recipientId: doctorId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Nova mensagem',
    message: 'Você tem uma nova mensagem no chat!',
    eventId: chatId,
    eventHash,
    metadata: { chatId, senderId },
  })
}

export async function notifyDoctorLeftPlatform(
  patientId: string,
  doctorId: string,
): Promise<void> {
  const recipient = await getRecipientInfo(patientId)
  if (!recipient?.email) return

  const eventHash = generateEventHash(
    EmailNotificationEventType.DOCTOR_LEFT_PLATFORM,
    doctorId,
    patientId,
  )

  await sendNotificationWithDeduplication({
    eventType: EmailNotificationEventType.DOCTOR_LEFT_PLATFORM,
    category: EmailNotificationCategory.TRIAGE,
    recipientId: patientId,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    title: 'Médico saiu da plataforma',
    message:
      'Médico saiu da plataforma. Faça um novo check-up para ter um novo coordenador do cuidado.',
    eventId: doctorId,
    eventHash,
    metadata: { patientId, doctorId },
  })
}
