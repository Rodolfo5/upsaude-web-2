import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'

const db = getFirestore(firebaseApp)

const SUBSCRIPTIONS_COLLECTION = 'subscriptions'
const INSTANT_PAYMENTS_COLLECTION = 'instantPayments'

const normalizeDate = (value: unknown): Date | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  if (typeof value === 'object' && 'toDate' in (value as Timestamp)) {
    return (value as Timestamp).toDate()
  }
  return undefined
}

export interface SubscriptionRecord {
  id: string
  userId?: string
  monthlyAmountInCents: number
  status?: string
  startDate?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface InstantPaymentRecord {
  id: string
  userId?: string
  doctorId?: string
  valueInCents: number
  paymentStatus?: string
  paymentMethod?: string
  protocolNumber?: string
  date?: Date
  hour?: string
  format?: string
  createdAt?: Date
  paidAt?: Date
}

interface SubscriptionsResult {
  subscriptions: SubscriptionRecord[]
  error: string | null
}

interface InstantPaymentsResult {
  instantPayments: InstantPaymentRecord[]
  error: string | null
}

export const getAllSubscriptions = async (): Promise<SubscriptionsResult> => {
  try {
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION)
    const q = query(subscriptionsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)

    const subscriptions = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data()
      return {
        id: docSnapshot.id,
        userId: data.userId,
        monthlyAmountInCents: Number(data.monthlyAmountInCents || 0),
        status: data.status,
        startDate: normalizeDate(data.startDate),
        createdAt: normalizeDate(data.createdAt),
        updatedAt: normalizeDate(data.updatedAt),
      }
    })

    return { subscriptions, error: null }
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error)
    return {
      subscriptions: [],
      error:
        error instanceof Error ? error.message : 'Erro ao buscar assinaturas',
    }
  }
}

export const getAllInstantPayments =
  async (): Promise<InstantPaymentsResult> => {
    try {
      const instantPaymentsRef = collection(db, INSTANT_PAYMENTS_COLLECTION)
      const q = query(instantPaymentsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      const instantPayments = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          userId: data.userId,
          doctorId: data.doctorId,
          valueInCents: Number(data.valueInCents || 0),
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
          protocolNumber: data.protocolNumber,
          date: normalizeDate(data.date),
          hour: data.hour,
          format: data.format,
          createdAt: normalizeDate(data.createdAt),
          paidAt: normalizeDate(data.paidAt),
        }
      })

      return { instantPayments, error: null }
    } catch (error) {
      console.error('Erro ao buscar pagamentos instantâneos:', error)
      return {
        instantPayments: [],
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar pagamentos instantâneos',
      }
    }
  }
