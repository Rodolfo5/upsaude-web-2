import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  getFirestore,
  Timestamp,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { ChatEntity } from '@/types/entities/chat'

const db = getFirestore(firebaseApp)

const COLLECTION_NAME = 'chats'

interface OperationResult {
  error: string | null
  id?: string
}

interface ChatsResult {
  chats: ChatEntity[]
  error: string | null
}

export const createChat = async ({
  patientId,
  doctorId,
}: {
  patientId: string
  doctorId: string
}): Promise<OperationResult> => {
  if (!patientId || !doctorId) {
    return {
      error: 'PatientId e DoctorId são obrigatórios',
    }
  }

  if (patientId === doctorId) {
    return {
      error: 'Não é possível criar um chat consigo mesmo',
    }
  }

  try {
    const now = Timestamp.now()

    const docRef = doc(collection(db, COLLECTION_NAME))
    const chatId = docRef.id

    const chatData: ChatEntity = {
      id: chatId,
      patientId,
      doctorId,
      createdAt: now,
      blocked: false,
    }

    await setDoc(docRef, chatData)

    return { error: null, id: chatId }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        error: error.message,
      }
    }

    return {
      error: error instanceof Error ? error.message : 'Erro ao criar chat',
    }
  }
}

export const getChatsByDoctor = async (
  doctorId: string,
): Promise<ChatsResult> => {
  if (!doctorId) {
    return {
      chats: [],
      error: 'DoctorId é obrigatório',
    }
  }

  try {
    const chatsRef = collection(db, COLLECTION_NAME)

    const q = query(chatsRef, where('doctorId', '==', doctorId))

    const querySnapshot = await getDocs(q)

    const chats: ChatEntity[] = []

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()

      chats.push({
        id: docSnapshot.id,
        patientId: data.patientId || '',
        doctorId: data.doctorId || '',
        createdAt: data.createdAt || Timestamp.now(),
        blocked: data.blocked || false,
      } as ChatEntity)
    })

    return {
      chats,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar chats:', error)

    if (error instanceof FirebaseError) {
      return {
        chats: [],
        error: error.message,
      }
    }

    return {
      chats: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar chats do médico',
    }
  }
}

export const toggleChatBlocked = async (
  chatId: string,
): Promise<OperationResult> => {
  if (!chatId) {
    return {
      error: 'ChatId é obrigatório',
    }
  }

  try {
    const chatRef = doc(db, COLLECTION_NAME, chatId)

    const chatDoc = await getDoc(chatRef)

    if (!chatDoc.exists()) {
      return {
        error: 'Chat não encontrado',
      }
    }

    const data = chatDoc.data()
    const currentBlocked = data.blocked || false

    await updateDoc(chatRef, {
      blocked: !currentBlocked,
    })

    return { error: null }
  } catch (error: unknown) {
    console.error('Erro ao alterar blocked do chat:', error)

    if (error instanceof FirebaseError) {
      return {
        error: error.message,
      }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao alterar blocked do chat',
    }
  }
}
