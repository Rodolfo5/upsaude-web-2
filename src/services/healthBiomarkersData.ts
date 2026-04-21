import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import { parseDateFromId } from '@/lib/parseDataFromId'
import {
  BloodGlucoseEntity,
  BloodPressureEntity,
  HeartRateEntity,
  OximetryEntity,
  TemperatureEntity,
} from '@/types/entities/biomarkers'

import { getHealthPillar } from './healthPillar'
import { getAllActivitiesByPillar } from './healthPillarActivity'
import { getAllTherapeuticPlansByPatient } from './therapeuticPlan'

const firestore = getFirestore(firebaseApp)

export async function getAllBloodPressureData(
  patientId: string,
): Promise<BloodPressureEntity[]> {
  if (!patientId) return []

  // 1. Buscar o último plano terapêutico
  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]

  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Biomarcadores de Saúde',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    const bloodPressureActivity = activities.find(
      (activity) => activity.name === 'Aferir Pressão Arterial',
    )

    if (!bloodPressureActivity) return []

    const bloodPressureData = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      healthPillarRef.id,
      'activities',
      bloodPressureActivity.id,
      'bloodPressure',
    )

    const q = query(bloodPressureData, orderBy('createdAt', 'asc'))
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
        ...data,
        createdAt,
      } as BloodPressureEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de pressão arterial:', error)
    return []
  }
}

export async function getAllGlycemiaData(
  patientId: string,
): Promise<BloodGlucoseEntity[]> {
  if (!patientId) return []

  // 1. Buscar o último plano terapêutico
  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]

  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Biomarcadores de Saúde',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    const bloodGlucoseActivity = activities.find(
      (activity) => activity.name === 'Aferir Glicemia',
    )

    if (!bloodGlucoseActivity) return []

    const bloodGlucoseData = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      healthPillarRef.id,
      'activities',
      bloodGlucoseActivity.id,
      'bloodGlucose',
    )

    const q = query(bloodGlucoseData, orderBy('createdAt', 'asc'))
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
        ...data,
        createdAt,
      } as BloodGlucoseEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de glicemia:', error)
    return []
  }
}

export async function getAllOximetryData(
  patientId: string,
): Promise<OximetryEntity[]> {
  if (!patientId) return []
  // 1. Buscar o último plano terapêutico
  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]

  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Biomarcadores de Saúde',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    const oximetryActivity = activities.find(
      (activity) => activity.name === 'Aferir Oximetria',
    )

    if (!oximetryActivity) return []

    const oximetryData = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      healthPillarRef.id,
      'activities',
      oximetryActivity.id,
      'oximetry',
    )

    const q = query(oximetryData, orderBy('createdAt', 'asc'))
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
        ...data,
        createdAt,
      } as OximetryEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de oximetria:', error)
    return []
  }
}

export async function getAllTemperatureData(
  patientId: string,
): Promise<TemperatureEntity[]> {
  if (!patientId) return []
  // 1. Buscar o último plano terapêutico
  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]
  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Biomarcadores de Saúde',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    const temperatureActivity = activities.find(
      (activity) => activity.name === 'Aferir Temperatura',
    )

    if (!temperatureActivity) return []

    const temperatureData = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      healthPillarRef.id,
      'activities',
      temperatureActivity.id,
      'temperature',
    )

    const q = query(temperatureData, orderBy('createdAt', 'asc'))
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
        ...data,
        createdAt,
      } as TemperatureEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de temperatura:', error)
    return []
  }
}

export async function getAllHeartRateData(
  patientId: string,
): Promise<HeartRateEntity[]> {
  if (!patientId) return []
  // 1. Buscar o último plano terapêutico
  const plans = await getAllTherapeuticPlansByPatient(patientId)
  if (plans.length === 0) return []

  const latestPlan = plans[0]

  try {
    const healthPillarRef = await getHealthPillar(
      patientId,
      latestPlan.id,
      'Biomarcadores de Saúde',
    )

    if (!healthPillarRef) return []

    const activities = await getAllActivitiesByPillar(
      patientId,
      latestPlan.id,
      healthPillarRef.id,
    )

    const heartRateActivity = activities.find(
      (activity) => activity.name === 'Aferir Frequência Cardíaca',
    )

    if (!heartRateActivity) return []

    const heartRateData = collection(
      firestore,
      'users',
      patientId,
      'therapeuticPlans',
      latestPlan.id,
      'healthPillars',
      healthPillarRef.id,
      'activities',
      heartRateActivity.id,
      'heartRate',
    )

    const q = query(heartRateData, orderBy('createdAt', 'asc'))
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
        ...data,
        createdAt,
      } as HeartRateEntity
    })
  } catch (error) {
    console.error('Erro ao buscar dados de frequência cardíaca:', error)
    return []
  }
}
