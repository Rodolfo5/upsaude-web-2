import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { parseDateFromId } from '@/lib/parseDataFromId'
import { WeightRecordEntity } from '@/types/entities/lifestyle'

import { getHealthPillar } from './healthPillar'
import { getAllActivitiesByPillar } from './healthPillarActivity'
import { getAllTherapeuticPlansByPatient } from './therapeuticPlan'

const firestore = getFirestore(firebaseApp)

const WEIGHING_ACTIVITY_NAME = 'Atividade de pesagem'

/**
 * Busca todos os registros de peso do paciente
 */
export async function getAllWeightRecords(
  patientId: string,
): Promise<WeightRecordEntity[]> {
  if (!patientId) return []

  // 1. Buscar o último plano terapêutico
  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]

  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Estilo de Vida',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    const weighingActivity = activities.find(
      (activity) => activity.name === WEIGHING_ACTIVITY_NAME,
    )

    if (!weighingActivity) return []

    const weightRecordsRef = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      healthPillarRef.id,
      'activities',
      weighingActivity.id,
      'weightRecords',
    )

    const q = query(weightRecordsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return []

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      const createdAtFromId = parseDateFromId(doc.id)
      const createdAtField = data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt
      const createdAt = createdAtFromId ?? createdAtField ?? new Date()

      return {
        id: doc.id,
        activityId: data.activityId || weighingActivity.id,
        weight: data.weight || 0,
        imageUrl: data.imageUrl,
        createdAt,
      } as WeightRecordEntity
    })
  } catch (error) {
    console.error('Erro ao buscar registros de peso:', error)
    return []
  }
}

/**
 * Busca registros de peso por intervalo de datas
 */
export async function getWeightRecordsByDateRange(
  patientId: string,
  startDate: Date,
  endDate: Date,
): Promise<WeightRecordEntity[]> {
  const allRecords = await getAllWeightRecords(patientId)

  const start = startDate.getTime()
  const end = endDate.getTime()

  return allRecords.filter((record) => {
    const recordDate =
      record.createdAt instanceof Date
        ? record.createdAt
        : new Date(record.createdAt)
    const recordTime = recordDate.getTime()
    return recordTime >= start && recordTime <= end
  })
}
