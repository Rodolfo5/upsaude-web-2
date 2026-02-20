import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { createRequestConsultation } from '@/services/requestConsultations'
import {
  ConsultationPlanEntity,
  CreateConsultationPlanData,
} from '@/types/entities/consultationPlan'

const db = getFirestore(firebaseApp)

interface GetConsultationPlansResult {
  plans: ConsultationPlanEntity[]
  error: string | null
}

interface CreateConsultationPlanResult {
  planId: string | null
  error: string | null
}

interface UpdateConsultationPlanResult {
  success: boolean
  error: string | null
}

export const getConsultationPlans = async (
  userId: string,
  therapeuticPlanId: string,
): Promise<GetConsultationPlansResult> => {
  if (!userId) {
    return {
      plans: [],
      error: 'UserId é obrigatório',
    }
  }

  if (!therapeuticPlanId) {
    return {
      plans: [],
      error: 'TherapeuticPlanId é obrigatório',
    }
  }

  try {
    const consultationPlanRef = collection(
      db,
      'users',
      userId,
      'therapeuticPlans',
      therapeuticPlanId,
      'consultationPlan',
    )

    const querySnapshot = await getDocs(consultationPlanRef)

    const plans: ConsultationPlanEntity[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      plans.push({
        id: doc.id,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
        specialty: data.specialty,
        frequency: data.frequency,
        totalConsultations: data.totalConsultations,
        reason: data.reason,
        doctorId: data.doctorId,
      })
    })

    return {
      plans,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao buscar planos de consulta:', error)

    if (error instanceof FirebaseError) {
      return {
        plans: [],
        error: error.message,
      }
    }

    return {
      plans: [],
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar planos de consulta',
    }
  }
}

export const getConsultationPlanById = async (
  userId: string,
  therapeuticPlanId: string,
  planId: string,
): Promise<ConsultationPlanEntity | null> => {
  if (!userId || !therapeuticPlanId || !planId) {
    return null
  }

  try {
    const planRef = collection(
      db,
      'users',
      userId,
      'therapeuticPlans',
      therapeuticPlanId,
      'consultationPlan',
    )

    const querySnapshot = await getDocs(planRef)

    let plan: ConsultationPlanEntity | null = null
    querySnapshot.forEach((doc) => {
      if (doc.id === planId) {
        const data = doc.data()
        plan = {
          id: doc.id,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
          specialty: data.specialty,
          frequency: data.frequency,
          totalConsultations: data.totalConsultations,
          reason: data.reason,
          doctorId: data.doctorId,
        }
      }
    })
    return plan
  } catch (error: unknown) {
    console.error('Erro ao buscar plano de consulta por ID:', error)
    return null
  }
}

export const createConsultationPlan = async (
  data: CreateConsultationPlanData,
): Promise<CreateConsultationPlanResult> => {
  if (!data.userId) {
    return {
      planId: null,
      error: 'UserId é obrigatório',
    }
  }

  if (!data.therapeuticPlanId) {
    return {
      planId: null,
      error: 'TherapeuticPlanId é obrigatório',
    }
  }

  if (!data.specialty) {
    return {
      planId: null,
      error: 'Especialidade é obrigatória',
    }
  }

  if (!data.frequency || !data.frequency.quantity || !data.frequency.interval) {
    return {
      planId: null,
      error: 'Frequência é obrigatória',
    }
  }

  if (!data.totalConsultations || data.totalConsultations < 2) {
    return {
      planId: null,
      error: 'Quantidade total de consultas deve ser maior que 1',
    }
  }

  if (!data.reason) {
    return {
      planId: null,
      error: 'Justificativa é obrigatória',
    }
  }

  try {
    const consultationPlanRef = collection(
      db,
      'users',
      data.userId,
      'therapeuticPlans',
      data.therapeuticPlanId,
      'consultationPlan',
    )

    const now = Timestamp.now()

    const planData: Omit<ConsultationPlanEntity, 'id'> = {
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
      specialty: data.specialty,
      frequency: data.frequency,
      totalConsultations: data.totalConsultations,
      reason: data.reason,
      doctorId: data.doctorId,
    }

    const newPlanRef = await addDoc(consultationPlanRef, planData)

    // Create request consultations
    for (let i = 0; i < data.totalConsultations; i++) {
      const requestData = {
        doctorId: data.doctorId,
        patientId: data.patientId,
        specialty: data.specialty,
        responsible: false, // or based on something
        reason: data.reason,
        type: 'PLAN' as const,
        consultationId: newPlanRef.id,
        numberConsultations: String(data.totalConsultations),
      }

      const result = await createRequestConsultation(requestData)
      if (!result.requestId) {
        console.error('Erro ao criar request consultation:', result.error)
        // Maybe continue or handle error
      }
    }

    return {
      planId: newPlanRef.id,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao criar plano de consulta:', error)

    if (error instanceof FirebaseError) {
      return {
        planId: null,
        error: error.message,
      }
    }

    return {
      planId: null,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao criar plano de consulta',
    }
  }
}

export const updateConsultationPlan = async (
  userId: string,
  therapeuticPlanId: string,
  planId: string,
  data: Partial<CreateConsultationPlanData>,
): Promise<UpdateConsultationPlanResult> => {
  if (!userId || !therapeuticPlanId || !planId) {
    return {
      success: false,
      error: 'UserId, TherapeuticPlanId e PlanId são obrigatórios',
    }
  }

  try {
    const planRef = doc(
      db,
      'users',
      userId,
      'therapeuticPlans',
      therapeuticPlanId,
      'consultationPlan',
      planId,
    )

    const updateData: Partial<ConsultationPlanEntity> = {
      updatedAt: Timestamp.now().toDate(),
    }

    if (data.specialty) updateData.specialty = data.specialty
    if (data.frequency) updateData.frequency = data.frequency
    if (data.totalConsultations)
      updateData.totalConsultations = data.totalConsultations
    if (data.reason) updateData.reason = data.reason
    if (data.doctorId) updateData.doctorId = data.doctorId

    await updateDoc(planRef, updateData)

    return {
      success: true,
      error: null,
    }
  } catch (error: unknown) {
    console.error('Erro ao atualizar plano de consulta:', error)

    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar plano de consulta',
    }
  }
}
