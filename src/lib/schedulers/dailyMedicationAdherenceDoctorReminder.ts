/**
 * Scheduler para notificar MÉDICOS quando pacientes não estão aderindo
 * ao plano medicamentoso.
 *
 * Roda às 5h da manhã e verifica, para cada paciente:
 * - Medicamentos ativos em uso (Uso contínuo ou Tratamento dentro do período)
 * - Se existe qualquer dose com status \"ignorei\" ou \"adiei\"
 *
 * Se houver não adesão em pelo menos um medicamento e o paciente tiver
 * médico responsável (`doctorId`), cria uma notificação em `doctorNotifications`.
 */

import admin from 'firebase-admin'

import { getAdminApp, adminFirestore } from '@/config/firebase/firebaseAdmin'

type FirestoreTimestamp = admin.firestore.Timestamp | { toDate?(): Date } | Date

function toDate(value: FirestoreTimestamp | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

function isMedicationInUsePeriod(medication: {
  usageClassification?: string
  startDate?: FirestoreTimestamp
  endDate?: FirestoreTimestamp
}): boolean {
  const now = new Date()

  if (medication.usageClassification === 'Uso contínuo') {
    return true
  }

  if (medication.usageClassification === 'Tratamento') {
    const startDate = toDate(medication.startDate)
    const endDate = toDate(medication.endDate)
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    return true
  }

  return false
}

export async function runDailyMedicationAdherenceDoctorReminder(): Promise<{
  processed: number
  notified: number
  errors: number
}> {
  await getAdminApp()
  const db = adminFirestore()

  let processed = 0
  let notified = 0
  let errors = 0

  const patientsSnapshot = await db
    .collection('users')
    .where('role', '==', 'PATIENT')
    .get()

  for (const patientDoc of patientsSnapshot.docs) {
    const patientId = patientDoc.id
    const patientData = patientDoc.data()
    const doctorId = patientData.doctorId as string | undefined
    const patientName = (patientData.name as string | undefined) || 'Paciente'

    processed++

    if (!doctorId) continue

    try {
      const medicationsSnapshot = await db
        .collection('users')
        .doc(patientId)
        .collection('medications')
        .where('status', '==', 'ACTIVE')
        .get()

      if (medicationsSnapshot.empty) continue

      let hasNonAdherence = false

      for (const medDoc of medicationsSnapshot.docs) {
        const medData = medDoc.data()

        if (!isMedicationInUsePeriod(medData)) {
          continue
        }

        const dosesSnapshot = await db
          .collection('users')
          .doc(patientId)
          .collection('medications')
          .doc(medDoc.id)
          .collection('doses')
          .get()

        const hasNonAdherenceForMedication = dosesSnapshot.docs.some((d) => {
          const status = (d.data().status as string) || ''
          return status === 'ignorei' || status === 'adiei'
        })

        if (hasNonAdherenceForMedication) {
          hasNonAdherence = true
          break
        }
      }

      if (!hasNonAdherence) continue

      await db.collection('doctorNotifications').add({
        title: 'Paciente não está aderindo à medicação',
        content: `O paciente ${patientName} não está seguindo o plano medicamentoso.`,
        users: [doctorId],
        type: 'Medicamento',
        status: '',
        hasSeenToUsers: [],
        createdAt: new Date(),
      })

      notified++
    } catch (error) {
      console.error(
        `Erro ao processar adesão à medicação para paciente ${patientId}:`,
        error,
      )
      errors++
    }
  }

  return { processed, notified, errors }
}
