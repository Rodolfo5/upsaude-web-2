import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import {
  MedicationEntity,
  MedicationStatus,
  MedicationCreationBy,
} from '@/types/entities/medication'
import { normalizeMedication } from '@/utils/normalizeMedication'

const firestore = getFirestore(firebaseApp)

function removeUndefinedFields(data: Record<string, unknown>): DocumentData {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as DocumentData
}

/**
 * Busca todos os medicamentos de um paciente
 * Estrutura: users/{patientId}/medications/{medicationId}
 */
export async function findMedicationsByPatientId(
  patientId: string,
): Promise<MedicationEntity[]> {
  const medicationsRef = collection(
    firestore,
    'users',
    patientId,
    'medications',
  )
  const q = query(medicationsRef, orderBy('createdAt', 'desc'))

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  const medications = snapshot.docs.map((doc) => {
    const data = doc.data() as DocumentData

    return normalizeMedication({
      id: doc.id,
      ...data,
    })
  })

  return medications
}

/**
 * Busca um medicamento específico por ID
 */
export async function findMedicationById(
  patientId: string,
  medicationId: string,
): Promise<MedicationEntity | null> {
  const medicationRef = doc(
    firestore,
    'users',
    patientId,
    'medications',
    medicationId,
  )
  const snap = await getDoc(medicationRef)

  if (!snap.exists()) return null

  const data = snap.data() as DocumentData

  return normalizeMedication({
    id: snap.id,
    ...data,
  })
}

/**
 * Atualiza o status de um medicamento
 */
export async function updateMedicationStatus(
  patientId: string,
  medicationId: string,
  status: MedicationStatus,
): Promise<void> {
  const medicationRef = doc(
    firestore,
    'users',
    patientId,
    'medications',
    medicationId,
  )

  await updateDoc(medicationRef, {
    status,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Atualiza dados de um medicamento
 */
export async function updateMedication(
  patientId: string,
  medicationId: string,
  updates: Partial<MedicationEntity>,
): Promise<void> {
  const medicationRef = doc(
    firestore,
    'users',
    patientId,
    'medications',
    medicationId,
  )

  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: Timestamp.now(),
  }

  if (updates.startDate) {
    updateData.startDate =
      typeof updates.startDate === 'string'
        ? Timestamp.fromDate(new Date(updates.startDate))
        : updates.startDate
  }

  if (updates.endDate) {
    updateData.endDate =
      typeof updates.endDate === 'string'
        ? Timestamp.fromDate(new Date(updates.endDate))
        : updates.endDate
  }

  if (updates.prescriptionDate) {
    updateData.prescriptionDate =
      typeof updates.prescriptionDate === 'string'
        ? Timestamp.fromDate(new Date(updates.prescriptionDate))
        : updates.prescriptionDate
  }

  await updateDoc(medicationRef, removeUndefinedFields(updateData))
}

/**
 * Deleta um medicamento
 */
export async function deleteMedication(
  patientId: string,
  medicationId: string,
): Promise<void> {
  const medicationRef = doc(
    firestore,
    'users',
    patientId,
    'medications',
    medicationId,
  )

  await deleteDoc(medicationRef)
}

/**
 * Cria um novo medicamento na subcoleção do paciente
 */
export async function createMedication(
  patientId: string,
  medicationData: Partial<MedicationEntity>,
): Promise<MedicationEntity> {
  if (!patientId) {
    throw new Error('patientId é obrigatório')
  }

  const medicationRef = doc(
    collection(firestore, 'users', patientId, 'medications'),
  )
  const medicationId = medicationRef.id

  const now = new Date()

  const newMedication: MedicationEntity = {
    id: medicationId,
    userId: patientId,
    name: medicationData.name || '',
    image: medicationData.image || '',
    usageClassification: medicationData.usageClassification || '',
    pharmaceuticalForm: medicationData.pharmaceuticalForm || '',
    observation: medicationData.observation,
    concentration: medicationData.concentration || 0,
    concentrationUnit: medicationData.concentrationUnit || '',
    stock: medicationData.stock || 0,
    stockUnit: medicationData.stockUnit || '',
    dose: medicationData.dose || 0,
    doseUnit: medicationData.doseUnit || '',
    interval: medicationData.interval,
    intervalUnit: medicationData.intervalUnit,
    startDate: medicationData.startDate,
    endDate: medicationData.endDate,
    prescriber: medicationData.prescriber,
    otherPrescriber: medicationData.otherPrescriber,
    attachment: medicationData.attachment,
    prescriptionDate: medicationData.prescriptionDate,
    memedId: medicationData.memedId,
    memedUrl: medicationData.memedUrl,
    medicationReminder: medicationData.medicationReminder || [],
    inventoryReminder: medicationData.inventoryReminder || [],
    status: medicationData.status || MedicationStatus.ACTIVE,
    createdBy: medicationData.createdBy || MedicationCreationBy.DOCTOR,
    methodOfMeasurement: medicationData.methodOfMeasurement,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }

  // Converter datas para Timestamp se necessário
  const firestoreData: Record<string, unknown> = {
    ...newMedication,
    startDate: newMedication.startDate
      ? typeof newMedication.startDate === 'string'
        ? Timestamp.fromDate(new Date(newMedication.startDate))
        : null
      : null,
    endDate: newMedication.endDate
      ? typeof newMedication.endDate === 'string'
        ? Timestamp.fromDate(new Date(newMedication.endDate))
        : null
      : null,
    prescriptionDate: newMedication.prescriptionDate
      ? typeof newMedication.prescriptionDate === 'string'
        ? Timestamp.fromDate(new Date(newMedication.prescriptionDate))
        : null
      : null,
  }

  await setDoc(medicationRef, removeUndefinedFields(firestoreData))

  return newMedication
}
