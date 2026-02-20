import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import {
  ActivityEntity,
  TrainingPrescriptionEntity,
} from '@/types/entities/healthPillar'

const firestore = getFirestore(firebaseApp)

/**
 * Converte prescrições do formato Firestore para TrainingPrescriptionEntity
 */
function parseTrainingPrescriptions(
  prescriptions: any[] | undefined,
): TrainingPrescriptionEntity[] {
  if (!prescriptions || !Array.isArray(prescriptions)) {
    return []
  }

  return prescriptions.map((prescription: any) => ({
    id: prescription.id,
    activityId: prescription.activityId,
    title: prescription.title,
    description: prescription.description || '',
    order: prescription.order,
    doctorId: prescription.doctorId || '',
    createdAt: prescription.createdAt?.toDate
      ? prescription.createdAt.toDate()
      : prescription.createdAt instanceof Date
        ? prescription.createdAt
        : prescription.createdAt
          ? new Date(prescription.createdAt)
          : new Date(),
    updatedAt: prescription.updatedAt?.toDate
      ? prescription.updatedAt.toDate()
      : prescription.updatedAt instanceof Date
        ? prescription.updatedAt
        : prescription.updatedAt
          ? new Date(prescription.updatedAt)
          : new Date(),
  }))
}

/**
 * Cria uma nova atividade associada a uma meta
 * Estrutura: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/activities/{activityId}
 */
export async function createActivity(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
  data: Partial<ActivityEntity>,
): Promise<ActivityEntity> {
  if (!patientId || !planId || !pillarId) {
    throw new Error('patientId, planId e pillarId são obrigatórios')
  }
  // goalId pode ser vazio para Estilo de Vida

  const activityRef = doc(
    collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      planId,
      'healthPillars',
      pillarId,
      'activities',
    ),
  )
  const activityId = activityRef.id

  const now = new Date()

  const newActivity: ActivityEntity = {
    id: activityId,
    pillarId,
    goalId,
    name: data.name || '',
    description: data.description,
    frequency: data.frequency,
    endDate: data.endDate,
    status: data.status || 'Ativa',
    doctorId: data.doctorId || '',
    createdAt: now,
    updatedAt: now,
    aiGenerated: data.aiGenerated,
    aiGeneratedAt: data.aiGeneratedAt,
    aiModel: data.aiModel,
    approvalStatus: data.approvalStatus,
    ...data,
  }

  // Remover campos undefined antes de salvar no Firestore
  const activityData: any = {
    id: activityId,
    pillarId,
    goalId,
    name: newActivity.name,
    status: newActivity.status,
    doctorId: newActivity.doctorId,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  if (newActivity.description !== undefined) {
    activityData.description = newActivity.description
  }
  if (newActivity.frequency !== undefined) {
    activityData.frequency = newActivity.frequency
  }
  if (data.endDate) {
    activityData.endDate = Timestamp.fromDate(
      typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate,
    )
  }
  // Campos específicos para exercícios
  if (data.modality !== undefined) {
    activityData.modality = data.modality
  }
  if (data.category !== undefined) {
    activityData.category = data.category
  }
  if (data.intensity !== undefined) {
    activityData.intensity = data.intensity
  }
  if (data.frequencyValue !== undefined) {
    activityData.frequencyValue = data.frequencyValue
  }
  if (data.frequencyUnit !== undefined) {
    activityData.frequencyUnit = data.frequencyUnit
  }
  if (data.patientGuidelines !== undefined) {
    activityData.patientGuidelines = data.patientGuidelines
  }
  if (data.distanceKm !== undefined) {
    activityData.distanceKm = data.distanceKm
  }
  // Campos específicos para biomarcadores
  if (data.deadlineValue !== undefined) {
    activityData.deadlineValue = data.deadlineValue
  }
  if (data.deadlineUnit !== undefined) {
    activityData.deadlineUnit = data.deadlineUnit
  }
  // Prescrições de treino (salvas como array na atividade)
  if (data.trainingPrescriptions !== undefined) {
    // Converter prescrições para formato Firestore
    activityData.trainingPrescriptions = data.trainingPrescriptions.map(
      (prescription) => {
        const prescriptionData: any = {
          id: prescription.id,
          activityId: prescription.activityId,
          title: prescription.title,
          description: prescription.description || '',
          doctorId: prescription.doctorId,
          createdAt:
            prescription.createdAt instanceof Date
              ? Timestamp.fromDate(prescription.createdAt)
              : typeof prescription.createdAt === 'string'
                ? Timestamp.fromDate(new Date(prescription.createdAt))
                : prescription.createdAt,
          updatedAt:
            prescription.updatedAt instanceof Date
              ? Timestamp.fromDate(prescription.updatedAt)
              : typeof prescription.updatedAt === 'string'
                ? Timestamp.fromDate(new Date(prescription.updatedAt))
                : prescription.updatedAt,
        }
        if (prescription.order !== undefined) {
          prescriptionData.order = prescription.order
        }
        return prescriptionData
      },
    )
  }
  // Campos de IA
  if (newActivity.aiGenerated !== undefined) {
    activityData.aiGenerated = newActivity.aiGenerated
  }
  if (newActivity.aiGeneratedAt !== undefined) {
    activityData.aiGeneratedAt =
      newActivity.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(newActivity.aiGeneratedAt)
        : typeof newActivity.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(newActivity.aiGeneratedAt))
          : newActivity.aiGeneratedAt
  }
  if (newActivity.aiModel !== undefined) {
    activityData.aiModel = newActivity.aiModel
  }
  if (newActivity.approvalStatus !== undefined) {
    activityData.approvalStatus = newActivity.approvalStatus
  }

  await setDoc(activityRef, activityData)

  return newActivity
}

/**
 * Busca todas as atividades de um pilar
 */
export async function getAllActivitiesByPillar(
  patientId: string,
  planId: string,
  pillarId: string,
): Promise<ActivityEntity[]> {
  if (!patientId || !planId || !pillarId) {
    return []
  }

  const activitiesRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
  )
  const q = query(activitiesRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      pillarId: data.pillarId,
      goalId: data.goalId,
      name: data.name,
      description: data.description,
      frequency: data.frequency,
      endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
      status: data.status,
      doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      // Campos específicos para exercícios
      modality: data.modality,
      category: data.category,
      intensity: data.intensity,
      frequencyValue: data.frequencyValue,
      frequencyUnit: data.frequencyUnit,
      patientGuidelines: data.patientGuidelines,
      distanceKm: data.distanceKm,
      // Campos específicos para biomarcadores
      deadlineValue: data.deadlineValue,
      deadlineUnit: data.deadlineUnit,
      // Campos de IA
      aiGenerated: data.aiGenerated,
      aiGeneratedAt: data.aiGeneratedAt?.toDate
        ? data.aiGeneratedAt.toDate()
        : data.aiGeneratedAt,
      aiModel: data.aiModel,
      approvalStatus: data.approvalStatus,
    } as ActivityEntity
  })
}

/**
 * Busca todas as atividades de uma meta
 */
export async function getAllActivitiesByGoal(
  patientId: string,
  planId: string,
  pillarId: string,
  goalId: string,
): Promise<ActivityEntity[]> {
  if (!patientId || !planId || !pillarId || !goalId) {
    return []
  }

  const activitiesRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
  )
  const q = query(
    activitiesRef,
    where('goalId', '==', goalId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      pillarId: data.pillarId,
      goalId: data.goalId,
      name: data.name,
      description: data.description,
      frequency: data.frequency,
      endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
      status: data.status,
      doctorId: data.doctorId || data.createdBy || '', // Compatibilidade com dados antigos
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      // Campos específicos para exercícios
      modality: data.modality,
      category: data.category,
      intensity: data.intensity,
      frequencyValue: data.frequencyValue,
      frequencyUnit: data.frequencyUnit,
      patientGuidelines: data.patientGuidelines,
      distanceKm: data.distanceKm,
      // Campos específicos para biomarcadores
      deadlineValue: data.deadlineValue,
      deadlineUnit: data.deadlineUnit,
      // Prescrições de treino
      trainingPrescriptions:
        data.trainingPrescriptions && Array.isArray(data.trainingPrescriptions)
          ? parseTrainingPrescriptions(data.trainingPrescriptions)
          : [],
      // Campos de IA
      aiGenerated: data.aiGenerated,
      aiGeneratedAt: data.aiGeneratedAt?.toDate
        ? data.aiGeneratedAt.toDate()
        : data.aiGeneratedAt,
      aiModel: data.aiModel,
      approvalStatus: data.approvalStatus,
    } as ActivityEntity
  })
}

/**
 * Busca uma atividade específica por ID
 */
export async function getActivityById(
  patientId: string,
  planId: string,
  pillarId: string,
  activityId: string,
): Promise<ActivityEntity | null> {
  if (!patientId || !planId || !pillarId || !activityId) {
    return null
  }

  const activityRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
    activityId,
  )

  const activityDoc = await getDoc(activityRef)

  if (!activityDoc.exists()) {
    return null
  }

  const data = activityDoc.data()
  return {
    id: activityDoc.id,
    pillarId: data.pillarId,
    goalId: data.goalId,
    name: data.name,
    description: data.description,
    frequency: data.frequency,
    endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
    status: data.status,
    doctorId: data.doctorId || data.createdBy || '',
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
    // Campos específicos para exercícios
    modality: data.modality,
    category: data.category,
    intensity: data.intensity,
    frequencyValue: data.frequencyValue,
    frequencyUnit: data.frequencyUnit,
    patientGuidelines: data.patientGuidelines,
    distanceKm: data.distanceKm,
    // Campos específicos para biomarcadores
    deadlineValue: data.deadlineValue,
    deadlineUnit: data.deadlineUnit,
    // Prescrições de treino
    trainingPrescriptions: parseTrainingPrescriptions(
      data.trainingPrescriptions,
    ),
    // Campos de IA
    aiGenerated: data.aiGenerated,
    aiGeneratedAt: data.aiGeneratedAt?.toDate
      ? data.aiGeneratedAt.toDate()
      : data.aiGeneratedAt,
    aiModel: data.aiModel,
  } as ActivityEntity
}

/**
 * Atualiza uma atividade existente
 */
export async function updateActivity(
  patientId: string,
  planId: string,
  pillarId: string,
  _goalId: string,
  activityId: string,
  data: Partial<ActivityEntity>,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !activityId) {
    throw new Error('patientId, planId, pillarId e activityId são obrigatórios')
  }

  const activityRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
    activityId,
  )

  // Remover campos undefined antes de atualizar no Firestore
  const updateData: any = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (data.name !== undefined) {
    updateData.name = data.name
  }
  if (data.description !== undefined) {
    updateData.description = data.description
  }
  if (data.frequency !== undefined) {
    updateData.frequency = data.frequency
  }
  if (data.status !== undefined) {
    updateData.status = data.status
  }
  if (data.endDate !== undefined) {
    updateData.endDate = Timestamp.fromDate(
      typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate,
    )
  }
  if (data.doctorId !== undefined) {
    updateData.doctorId = data.doctorId
  }
  // Campos específicos para exercícios
  if (data.modality !== undefined) {
    updateData.modality = data.modality
  }
  if (data.category !== undefined) {
    updateData.category = data.category
  }
  if (data.intensity !== undefined) {
    updateData.intensity = data.intensity
  }
  if (data.frequencyValue !== undefined) {
    updateData.frequencyValue = data.frequencyValue
  }
  if (data.frequencyUnit !== undefined) {
    updateData.frequencyUnit = data.frequencyUnit
  }
  if (data.patientGuidelines !== undefined) {
    updateData.patientGuidelines = data.patientGuidelines
  }
  if (data.distanceKm !== undefined) {
    updateData.distanceKm = data.distanceKm
  }
  // Campos específicos para biomarcadores
  if (data.deadlineValue !== undefined) {
    updateData.deadlineValue = data.deadlineValue
  }
  if (data.deadlineUnit !== undefined) {
    updateData.deadlineUnit = data.deadlineUnit
  }
  // Prescrições de treino (salvas como array na atividade)
  if (data.trainingPrescriptions !== undefined) {
    // Converter prescrições para formato Firestore
    updateData.trainingPrescriptions = data.trainingPrescriptions.map(
      (prescription) => {
        const prescriptionData: any = {
          id: prescription.id,
          activityId: prescription.activityId,
          title: prescription.title,
          description: prescription.description || '',
          doctorId: prescription.doctorId,
          createdAt:
            prescription.createdAt instanceof Date
              ? Timestamp.fromDate(prescription.createdAt)
              : typeof prescription.createdAt === 'string'
                ? Timestamp.fromDate(new Date(prescription.createdAt))
                : prescription.createdAt,
          updatedAt:
            prescription.updatedAt instanceof Date
              ? Timestamp.fromDate(prescription.updatedAt)
              : typeof prescription.updatedAt === 'string'
                ? Timestamp.fromDate(new Date(prescription.updatedAt))
                : prescription.updatedAt,
        }
        if (prescription.order !== undefined) {
          prescriptionData.order = prescription.order
        }
        return prescriptionData
      },
    )
  }
  // Campos de IA
  if (data.aiGenerated !== undefined) {
    updateData.aiGenerated = data.aiGenerated
  }
  if (data.aiGeneratedAt !== undefined) {
    updateData.aiGeneratedAt =
      data.aiGeneratedAt instanceof Date
        ? Timestamp.fromDate(data.aiGeneratedAt)
        : typeof data.aiGeneratedAt === 'string'
          ? Timestamp.fromDate(new Date(data.aiGeneratedAt))
          : data.aiGeneratedAt
  }
  if (data.aiModel !== undefined) {
    updateData.aiModel = data.aiModel
  }
  if (data.approvalStatus !== undefined) {
    updateData.approvalStatus = data.approvalStatus
  }

  await updateDoc(activityRef, updateData)
}

/**
 * Remove uma atividade
 */
export async function deleteActivity(
  patientId: string,
  planId: string,
  pillarId: string,
  _goalId: string,
  activityId: string,
): Promise<void> {
  if (!patientId || !planId || !pillarId || !activityId) {
    throw new Error('patientId, planId, pillarId e activityId são obrigatórios')
  }

  const activityRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'activities',
    activityId,
  )

  await deleteDoc(activityRef)
}
