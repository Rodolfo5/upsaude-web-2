import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { notifyNewMessage } from '@/services/emailNotification'
import { MessageEntity } from '@/types/entities/message'

const db = getFirestore(firebaseApp)

const CHATS_COLLECTION = 'chats'

interface OperationResult {
  error: string | null
}

/**
 * Envia uma mensagem para um chat
 */
export const sendMessage = async (
  chatId: string,
  message: Omit<MessageEntity, 'id' | 'createdAt'> & { id?: string },
): Promise<OperationResult> => {
  if (!chatId || !message.senderId) {
    return {
      error: 'ChatId e senderId são obrigatórios',
    }
  }

  // Validar: precisa ter texto OU arquivo
  if (!message.text && !message.fileUrl) {
    return {
      error: 'Mensagem deve conter texto ou arquivo',
    }
  }

  try {
    const messagesCol = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`)
    const messageId = message.id || `msg_${Date.now()}`
    const messageRef = doc(messagesCol, messageId)

    await setDoc(messageRef, {
      ...message,
      id: messageId,
      createdAt: serverTimestamp(),
    })

    const chatRef = doc(db, CHATS_COLLECTION, chatId)
    const chatSnap = await getDoc(chatRef)
    if (chatSnap.exists()) {
      const chatData = chatSnap.data()
      const patientId = chatData?.patientId
      const doctorId = chatData?.doctorId
      if (patientId && doctorId && message.senderId === patientId) {
        notifyNewMessage(doctorId, chatId, message.senderId).catch(
          (err: unknown) =>
            console.error('Erro ao enviar notificação de nova mensagem:', err),
        )
      }
    }

    return { error: null }
  } catch (error: unknown) {
    console.error('Erro ao enviar mensagem:', error)

    if (error instanceof FirebaseError) {
      return {
        error: error.message,
      }
    }

    return {
      error: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
    }
  }
}

/**
 * Lista mensagens de um chat (uma vez)
 */
export const listMessagesOnce = async (
  chatId: string,
  pageSize = 50,
): Promise<{ messages: MessageEntity[]; error: string | null }> => {
  if (!chatId) {
    return {
      messages: [],
      error: 'ChatId é obrigatório',
    }
  }

  try {
    const messagesCol = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`)
    const q = query(messagesCol, orderBy('createdAt', 'asc'), limit(pageSize))
    const snapshot = await getDocs(q)

    const messages: MessageEntity[] = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data()
      return {
        id: docSnapshot.id,
        senderId: data.senderId || '',
        receiverId: data.receiverId || '',
        text: data.text || '',
        type: data.type || 'text',
        createdAt: data.createdAt || Timestamp.now(),
        fileUrl: data.fileUrl || undefined,
        fileName: data.fileName || undefined,
        fileType: data.fileType || undefined,
      } as MessageEntity
    })

    return {
      messages,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao listar mensagens:', error)

    if (error instanceof FirebaseError) {
      return {
        messages: [],
        error: error.message,
      }
    }

    return {
      messages: [],
      error:
        error instanceof Error ? error.message : 'Erro ao listar mensagens',
    }
  }
}

/**
 * Inscreve-se em mensagens de um chat em tempo real
 */
export const subscribeMessages = (
  chatId: string,
  onChange: (messages: MessageEntity[]) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  if (!chatId) {
    return () => { }
  }

  try {
    const messagesCol = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`)
    const q = query(messagesCol, orderBy('createdAt', 'asc'))

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: MessageEntity[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            senderId: data.senderId || '',
            receiverId: data.receiverId || '',
            text: data.text || '',
            type: data.type || 'text',
            createdAt: data.createdAt || Timestamp.now(),
            fileUrl: data.fileUrl || undefined,
            fileName: data.fileName || undefined,
            fileType: data.fileType || undefined,
          } as MessageEntity
        })
        onChange(messages)
      },
      (error) => {
        console.error('Erro ao inscrever em mensagens:', error)
        if (onError) {
          onError(new Error(error.message))
        }
      },
    )
  } catch (error) {
    console.error('Erro ao criar subscription:', error)
    if (onError) {
      onError(
        error instanceof Error
          ? error
          : new Error('Erro ao criar subscription de mensagens'),
      )
    }
    return () => { }
  }
}

/**
 * Busca a última mensagem de um chat
 */
export const getLastMessage = async (
  chatId: string,
): Promise<{ message: MessageEntity | null; error: string | null }> => {
  if (!chatId) {
    return {
      message: null,
      error: 'ChatId é obrigatório',
    }
  }

  try {
    const messagesCol = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`)
    const q = query(messagesCol, orderBy('createdAt', 'desc'), limit(1))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return {
        message: null,
        error: null,
      }
    }

    const docSnapshot = snapshot.docs[0]
    const data = docSnapshot.data()

    const message: MessageEntity = {
      id: docSnapshot.id,
      senderId: data.senderId || '',
      receiverId: data.receiverId || '',
      text: data.text || '',
      type: data.type || 'text',
      createdAt: data.createdAt || Timestamp.now(),
      fileUrl: data.fileUrl || undefined,
      fileName: data.fileName || undefined,
      fileType: data.fileType || undefined,
    }

    return {
      message,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar última mensagem:', error)

    if (error instanceof FirebaseError) {
      return {
        message: null,
        error: error.message,
      }
    }

    return {
      message: null,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar última mensagem',
    }
  }
}

/**
 * Inscreve-se na última mensagem de um chat em tempo real
 */
export const subscribeLastMessage = (
  chatId: string,
  onChange: (message: MessageEntity | null) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  if (!chatId) {
    return () => { }
  }

  try {
    const messagesCol = collection(db, `${CHATS_COLLECTION}/${chatId}/messages`)
    const q = query(messagesCol, orderBy('createdAt', 'desc'), limit(1))

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onChange(null)
          return
        }

        const docSnapshot = snapshot.docs[0]
        const data = docSnapshot.data()

        const message: MessageEntity = {
          id: docSnapshot.id,
          senderId: data.senderId || '',
          receiverId: data.receiverId || '',
          text: data.text || '',
          type: data.type || 'text',
          createdAt: data.createdAt || Timestamp.now(),
          fileUrl: data.fileUrl || undefined,
          fileName: data.fileName || undefined,
          fileType: data.fileType || undefined,
        }

        onChange(message)
      },
      (error) => {
        console.error('Erro ao inscrever na última mensagem:', error)
        if (onError) {
          onError(new Error(error.message))
        }
      },
    )
  } catch (error) {
    console.error('Erro ao criar subscription da última mensagem:', error)
    if (onError) {
      onError(
        error instanceof Error
          ? error
          : new Error('Erro ao criar subscription da última mensagem'),
      )
    }
    return () => { }
  }
}
