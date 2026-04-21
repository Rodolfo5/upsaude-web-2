import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { parseDateFromId } from '@/lib/parseDataFromId'
import { HumorEntity, SleepTimeEntity } from '@/types/entities/healthPillar'
import { QuestionnaireEntity } from '@/types/entities/questionnaireEntity'

import { getHealthPillar } from './healthPillar'
import { getAllGoalsByPillar } from './healthPillarGoal'
import { findAllQuestionnairesByPatient } from './questionnaires'
import { getAllTherapeuticPlansByPatient } from './therapeuticPlan'

const firestore = getFirestore(firebaseApp)

/**
 * Busca todos os registros de tempo de sono de um paciente
 * Percorre: último plano terapêutico → pilar "Saúde Mental" → goal "Qualidade de Sono" → sleepTime
 */
export async function getAllSleepTimeData(
  patientId: string,
): Promise<SleepTimeEntity[]> {
  try {
    if (!patientId) return []

    // 1. Buscar o último plano terapêutico
    const plans = await getAllTherapeuticPlansByPatient(patientId)
    if (plans.length === 0) return []

    const latestPlan = plans[0]

    // 2. Buscar o pilar de "Saúde Mental"
    const mentalHealthPillar = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Saúde Mental',
    )
    if (!mentalHealthPillar) return []

    // 3. Buscar a goal "Qualidade de Sono"
    const goals = await getAllGoalsByPillar(
      patientId,
      latestPlan.id,
      mentalHealthPillar.id,
    )
    const sleepGoal = goals.find((g) => g.type === 'Qualidade de Sono')
    if (!sleepGoal) return []

    // 4. Buscar todos os registros de sleepTime
    const sleepTimeRef = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      mentalHealthPillar.id,
      'goals',
      sleepGoal.id,
      'sleepTime',
    )
    const q = query(sleepTimeRef, orderBy('createdAt', 'asc'))
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
        goalId: data.goalId,
        sleepTime: data.sleepTime,
        createdAt,
      } as SleepTimeEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de tempo de sono:', error)
    return []
  }
}

/**
 * Busca todos os registros de humor de um paciente
 * Percorre: último plano terapêutico → pilar "Saúde Mental" → goal "Humor" → humor
 */
export async function getAllHumorData(
  patientId: string,
): Promise<HumorEntity[]> {
  try {
    if (!patientId) return []

    // 1. Buscar o último plano terapêutico
    const plans = await getAllTherapeuticPlansByPatient(patientId)
    if (plans.length === 0) return []

    const latestPlan = plans[0]

    // 2. Buscar o pilar de "Saúde Mental"
    const mentalHealthPillar = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Saúde Mental',
    )
    if (!mentalHealthPillar) return []

    // 3. Buscar a goal "Humor"
    const goals = await getAllGoalsByPillar(
      patientId,
      latestPlan.id,
      mentalHealthPillar.id,
    )
    const humorGoal = goals.find((g) => g.type === 'Humor')
    if (!humorGoal) return []

    // 4. Buscar todos os registros de humor
    const humorRef = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      mentalHealthPillar.id,
      'goals',
      humorGoal.id,
      'humor',
    )
    const q = query(humorRef, orderBy('createdAt', 'asc'))
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
        goalId: data.goalId,
        humor: data.humor,
        createdAt,
      } as HumorEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de humor:', error)
    return []
  }
}

export async function getAllStressData(
  patientId: string,
): Promise<QuestionnaireEntity[]> {
  try {
    if (!patientId) return []

    const questionnaires = await findAllQuestionnairesByPatient(patientId)
    const stressQuestionnaire = questionnaires.filter(
      (q) => q.questionnaireName === 'Avaliação de estresse',
    )
    if (!stressQuestionnaire) return []

    const stressAnswers = stressQuestionnaire.map((q) => ({
      id: q.id,
      result: q.result,
      createdAt: q.createdAt,
    }))

    return stressAnswers as QuestionnaireEntity[]
  } catch (error) {
    console.error('Erro ao buscar dados de stress:', error)
    return []
  }
}
