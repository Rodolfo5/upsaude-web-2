import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { parseDateFromId } from '@/lib/parseDataFromId'
import { ExerciseRecordEntity } from '@/types/entities/lifestyle'

import { getHealthPillar } from './healthPillar'
import { getAllActivitiesByPillar } from './healthPillarActivity'
import { getAllTherapeuticPlansByPatient } from './therapeuticPlan'

const firestore = getFirestore(firebaseApp)

const EXERCISE_ACTIVITY_NAME = 'Recomendação de exercício'

/**
 * Busca todos os registros de exercícios do paciente
 */
export async function getAllExerciseRecords(
  patientId: string,
): Promise<ExerciseRecordEntity[]> {
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

    // Buscar todas as atividades de exercício
    const exerciseActivities = activities.filter(
      (activity) => activity.name === EXERCISE_ACTIVITY_NAME,
    )

    if (exerciseActivities.length === 0) return []

    // Buscar registros de todas as atividades de exercício
    const allRecords: ExerciseRecordEntity[] = []

    for (const activity of exerciseActivities) {
      const exercisesRef = collection(
        firestore,
        'users',
        patientId,
        'therapeuticPlans',
        latestPlan.id,
        'healthPillars',
        healthPillarRef.id,
        'activities',
        activity.id,
        'exercises',
      )

      const q = query(exercisesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const records = snapshot.docs.map((doc) => {
          const data = doc.data()
          const createdAtFromId = parseDateFromId(doc.id)
          const createdAtField = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt
          const createdAt = createdAtFromId ?? createdAtField ?? new Date()

          return {
            id: doc.id,
            activityId: data.activityId || activity.id,
            categoryId: data.categoryId || '',
            caloriesBurned: data.caloriesBurned || 0,
            duration: data.duration || '00:00',
            createdAt,
          } as ExerciseRecordEntity
        })

        allRecords.push(...records)
      }
    }

    // Ordenar todos os registros por data (mais recentes primeiro)
    allRecords.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const dateB =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })

    return allRecords
  } catch (error) {
    console.error('Erro ao buscar registros de exercícios:', error)
    return []
  }
}

/**
 * Busca registros de exercícios por intervalo de datas
 */
export async function getExerciseRecordsByDateRange(
  patientId: string,
  startDate: Date,
  endDate: Date,
): Promise<ExerciseRecordEntity[]> {
  const allRecords = await getAllExerciseRecords(patientId)

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
