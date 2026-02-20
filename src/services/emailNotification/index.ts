/**
 * Módulo de notificações por e-mail para profissionais de saúde.
 */

export {
  checkDuplicateNotification,
  createEmailNotification,
  generateEventHash,
  sendEmailNotification,
  sendNotificationWithDeduplication,
  updateNotificationStatus,
} from './emailNotification'

export { getNotificationTemplate } from './templates'

export {
  notifyAllGoalsCompleted,
  notifyCheckupNotResponded,
  notifyCheckupPending,
  notifyConsultationCanceled,
  notifyConsultationReminder,
  notifyConsultationScheduled,
  notifyDoctorLeftPlatform,
  notifyExamCompleted,
  notifyExamPending,
  notifyMedicationNotFollowed,
  notifyNewMessage,
  notifyPlanAlteredByOtherDoctor,
  notifyPlanNotCompleted,
  notifyPlanReevaluationRequested,
  notifyGoalCompleted,
  notifyQuestionnaireNotAnswered,
} from './triggers'
