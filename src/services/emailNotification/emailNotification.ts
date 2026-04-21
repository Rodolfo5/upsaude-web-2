/**
 * Serviço principal de notificações por e-mail para profissionais de saúde.
 *
 * Gerencia: geração de hash, deduplicação, registro no Firestore e envio via SendPulse.
 */

import crypto from 'crypto'

import {
  collection,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { createSendPulseClient } from '@/lib/sendpulse'
import type {
  CreateEmailNotificationInput,
  EmailNotificationEntity,
} from '@/types/entities/emailNotification'
import { EmailNotificationStatus } from '@/types/entities/emailNotification'

import { getNotificationTemplate } from './templates'

const db = getFirestore(firebaseApp)
const COLLECTION_NAME = 'emailNotifications'

/**
 * Gera hash único para deduplicação de notificações.
 * Usa os parâmetros do evento para criar identificador único.
 */
export function generateEventHash(
  eventType: string,
  eventId: string,
  recipientId: string,
  additionalData?: string,
): string {
  const payload = `${eventType}_${eventId}_${recipientId}_${additionalData || ''}`
  return crypto.createHash('md5').update(payload).digest('hex')
}

/**
 * Verifica se já existe notificação com o mesmo hash (não falha).
 * Retorna true se já existe notificação pendente ou enviada.
 */
export async function checkDuplicateNotification(
  eventHash: string,
): Promise<boolean> {
  const collectionRef = collection(db, COLLECTION_NAME)
  const q = query(
    collectionRef,
    where('eventHash', '==', eventHash),
    where('status', 'in', ['pending', 'sent']),
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

/**
 * Cria documento de notificação no Firestore.
 * Retorna o ID do documento criado.
 */
export async function createEmailNotification(
  input: CreateEmailNotificationInput,
): Promise<{ id: string; error: string | null }> {
  try {
    const docRef = doc(collection(db, COLLECTION_NAME))
    const now = new Date()

    const notification: Omit<EmailNotificationEntity, 'id'> = {
      ...input,
      status: EmailNotificationStatus.PENDING,
      sentAt: null,
      createdAt: now,
      metadata: input.metadata || {},
      error: null,
      isRead: false,
      readAt: null,
    }

    await setDoc(docRef, notification)
    return { id: docRef.id, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return { id: '', error: message }
  }
}

/**
 * Atualiza status da notificação no Firestore.
 */
export async function updateNotificationStatus(
  notificationId: string,
  status: EmailNotificationStatus,
  error?: string | null,
): Promise<{ error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificationId)
    const updates: Partial<EmailNotificationEntity> = {
      status,
      error: error || null,
    }
    if (status === EmailNotificationStatus.SENT) {
      updates.sentAt = new Date()
    }
    await updateDoc(
      docRef,
      updates as { [x: string]: FieldValue | Partial<unknown> },
    )
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: message }
  }
}

/**
 * Envia notificação por e-mail via SendPulse.
 */
export async function sendEmailNotification(
  notificationId: string,
  htmlContent: string,
): Promise<{ success: boolean; error: string | null }> {
  const docRef = doc(db, COLLECTION_NAME, notificationId)
  const docSnapshot = await getDoc(docRef)

  if (!docSnapshot.exists()) {
    return { success: false, error: 'Notificação não encontrada' }
  }

  const notificationData = docSnapshot.data() as EmailNotificationEntity

  try {
    const client = createSendPulseClient()
    await client.sendEmail({
      to: [
        {
          email: notificationData.recipientEmail,
          name: notificationData.recipientName,
        },
      ],
      subject: notificationData.title,
      html: htmlContent,
    })

    await updateNotificationStatus(
      notificationId,
      EmailNotificationStatus.SENT,
      null,
    )
    return { success: true, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar'
    await updateNotificationStatus(
      notificationId,
      EmailNotificationStatus.FAILED,
      message,
    )
    return { success: false, error: message }
  }
}

/**
 * Fluxo completo: verifica duplicação, cria no Firestore, envia via SendPulse.
 * Retorna o ID da notificação criada ou null se duplicada.
 */
export async function sendNotificationWithDeduplication(
  input: CreateEmailNotificationInput,
): Promise<{
  success: boolean
  notificationId: string | null
  skipped: boolean
  error: string | null
}> {
  // 1. Verificar duplicação
  const isDuplicate = await checkDuplicateNotification(input.eventHash)
  if (isDuplicate) {
    return {
      success: true,
      notificationId: null,
      skipped: true,
      error: null,
    }
  }

  // 2. Criar no Firestore
  const { id, error: createError } = await createEmailNotification(input)
  if (createError || !id) {
    return {
      success: false,
      notificationId: null,
      skipped: false,
      error: createError || 'Falha ao criar notificação',
    }
  }

  // 3. Gerar HTML do template
  const htmlContent = getNotificationTemplate(
    input.eventType,
    input.title,
    input.message,
    input.metadata || {},
  )

  // 4. Enviar via SendPulse
  const { success, error: sendError } = await sendEmailNotification(
    id,
    htmlContent,
  )

  if (!success) {
    return {
      success: false,
      notificationId: id,
      skipped: false,
      error: sendError,
    }
  }

  return {
    success: true,
    notificationId: id,
    skipped: false,
    error: null,
  }
}

/**
 * Marca uma notificação como lida.
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificationId)
    await updateDoc(docRef, {
      isRead: true,
      readAt: new Date(),
    } as { [x: string]: FieldValue | Partial<unknown> })
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: message }
  }
}

/**
 * Marca todas as notificações do destinatário como lidas.
 */
export async function markAllNotificationsAsRead(
  recipientId: string,
): Promise<{ error: string | null }> {
  try {
    const collectionRef = collection(db, COLLECTION_NAME)
    const q = query(
      collectionRef,
      where('recipientId', '==', recipientId),
      where('isRead', '==', false),
    )
    const snapshot = await getDocs(q)
    const now = new Date()

    await Promise.all(
      snapshot.docs.map((docSnap) =>
        updateDoc(docSnap.ref, {
          isRead: true,
          readAt: now,
        } as { [x: string]: FieldValue | Partial<unknown> }),
      ),
    )
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { error: message }
  }
}
