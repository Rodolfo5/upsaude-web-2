/**
 * Tipos e entidades para notificações por e-mail de profissionais de saúde.
 */

export enum EmailNotificationEventType {
  QUESTIONNAIRE_NOT_ANSWERED = 'questionnaire_not_answered',
  PLAN_NOT_COMPLETED = 'plan_not_completed',
  PLAN_REEVALUATION_REQUESTED = 'plan_reevaluation_requested',
  ALL_GOALS_COMPLETED = 'all_goals_completed',
  GOAL_COMPLETED = 'goal_completed',
  PLAN_ALTERED_BY_OTHER_DOCTOR = 'plan_altered_by_other_doctor',
  EXAM_PENDING = 'exam_pending',
  EXAM_COMPLETED = 'exam_completed',
  MEDICATION_NOT_FOLLOWED = 'medication_not_followed',
  CONSULTATION_SCHEDULED = 'consultation_scheduled',
  CONSULTATION_REMINDER = 'consultation_reminder',
  CONSULTATION_CANCELED = 'consultation_canceled',
  CHECKUP_PENDING = 'checkup_pending',
  CHECKUP_NOT_RESPONDED = 'checkup_not_responded',
  NEW_MESSAGE = 'new_message',
  DOCTOR_LEFT_PLATFORM = 'doctor_left_platform',
}

export enum EmailNotificationCategory {
  QUESTIONNAIRES = 'Questionários de Saúde',
  THERAPEUTIC_PLAN = 'Plano Terapêutico',
  PRESCRIPTIONS = 'Prescrições',
  CONSULTATIONS = 'Consultas',
  CHECKUP = 'Check-Up',
  CHAT = 'Chat',
  TRIAGE = 'Triagem Digital',
}

export enum EmailNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export interface EmailNotificationEntity {
  id: string
  eventType: EmailNotificationEventType | string
  category: EmailNotificationCategory | string
  recipientId: string
  recipientEmail: string
  recipientName: string
  title: string
  message: string
  eventId: string
  eventHash: string
  status: EmailNotificationStatus
  sentAt: Date | null
  createdAt: Date
  metadata: Record<string, unknown>
  error: string | null
  isRead: boolean
  readAt: Date | null
}

export interface CreateEmailNotificationInput {
  eventType: EmailNotificationEventType | string
  category: EmailNotificationCategory | string
  recipientId: string
  recipientEmail: string
  recipientName: string
  title: string
  message: string
  eventId: string
  eventHash: string
  metadata?: Record<string, unknown>
}
