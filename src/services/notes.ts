/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  getDocs,
  getFirestore,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import type { NoteEntity } from '@/types/entities/note'

import { findDoctorById } from './doctor'

const firestore = getFirestore(firebaseApp)

export async function createNote(
  userId: string,
  data: Partial<NoteEntity>,
): Promise<NoteEntity> {
  const noteRef = doc(collection(firestore, 'users', userId, 'notes'))
  const noteId = noteRef.id

  const noteData: NoteEntity = {
    id: noteId,
    userId,
    doctorId: data.doctorId,
    content: data.content || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as NoteEntity

  await setDoc(noteRef, noteData)
  return noteData
}

export async function findAllNotes(userId: string): Promise<NoteEntity[]> {
  try {
    const notesRef = collection(firestore, 'users', userId, 'notes')
    const q = query(notesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    if (snapshot.empty) return []

    // Função auxiliar para converter Timestamp do Firestore para Date
    const convertDate = (value: unknown): Date | string | undefined => {
      if (!value) return value as undefined
      if (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value &&
        typeof (value as { toDate: unknown }).toDate === 'function'
      ) {
        return (value as { toDate: () => Date }).toDate()
      }
      return value as Date | string
    }

    const notesRaw = snapshot.docs.map((d) => {
      const data = d.data() as Partial<NoteEntity>
      const id = (data.id as string) || d.id
      return {
        id,
        userId: data.userId || userId,
        doctorId: data.doctorId as string | undefined,
        content: (data.content as string) || '',
        createdAt: convertDate(data.createdAt) || new Date(),
        updatedAt: convertDate(data.updatedAt) || new Date(),
      } as NoteEntity
    })

    // coletar doctorIds e buscar doctors
    const doctorIds = [
      ...new Set(
        notesRaw.map((n) => n.doctorId).filter((v): v is string => Boolean(v)),
      ),
    ]
    const doctors = await Promise.all(doctorIds.map((id) => findDoctorById(id)))
    const doctorMap = new Map(doctors.filter((d) => d).map((d) => [d!.id, d!]))

    const notes = notesRaw.map((n) => ({
      ...n,
      doctor: n.doctorId
        ? {
            id: n.doctorId,
            name: doctorMap.get(n.doctorId!)?.name || '',
            typeOfCredential:
              doctorMap.get(n.doctorId!)?.typeOfCredential || '',
            credential: doctorMap.get(n.doctorId!)?.credential || '',
            state: doctorMap.get(n.doctorId!)?.state || '',
          }
        : undefined,
    }))

    return notes
  } catch (error) {
    console.error('Erro ao buscar observações:', error)
    // Se houver erro com orderBy (ex: índice faltando), tenta sem ordenação
    try {
      const notesRef = collection(firestore, 'users', userId, 'notes')
      const snapshot = await getDocs(notesRef)

      if (snapshot.empty) return []

      // Função auxiliar para converter Timestamp do Firestore para Date
      const convertDate = (value: unknown): Date | string | undefined => {
        if (!value) return value as undefined
        if (
          typeof value === 'object' &&
          value !== null &&
          'toDate' in value &&
          typeof (value as { toDate: unknown }).toDate === 'function'
        ) {
          return (value as { toDate: () => Date }).toDate()
        }
        return value as Date | string
      }

      const notesRaw = snapshot.docs.map((d) => {
        const data = d.data() as Partial<NoteEntity>
        const id = (data.id as string) || d.id
        return {
          id,
          userId: data.userId || userId,
          doctorId: data.doctorId as string | undefined,
          content: (data.content as string) || '',
          createdAt: convertDate(data.createdAt) || new Date(),
          updatedAt: convertDate(data.updatedAt) || new Date(),
        } as NoteEntity
      })

      // Ordenar manualmente por data
      notesRaw.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })

      // coletar doctorIds e buscar doctors
      const doctorIds = [
        ...new Set(
          notesRaw
            .map((n) => n.doctorId)
            .filter((v): v is string => Boolean(v)),
        ),
      ]
      const doctors = await Promise.all(
        doctorIds.map((id) => findDoctorById(id)),
      )
      const doctorMap = new Map(
        doctors.filter((d) => d).map((d) => [d!.id, d!]),
      )

      const notes = notesRaw.map((n) => ({
        ...n,
        doctor: n.doctorId
          ? {
              id: n.doctorId,
              name: doctorMap.get(n.doctorId!)?.name || '',
              typeOfCredential:
                doctorMap.get(n.doctorId!)?.typeOfCredential || '',
              credential: doctorMap.get(n.doctorId!)?.credential || '',
              state: doctorMap.get(n.doctorId!)?.state || '',
            }
          : undefined,
      }))

      return notes
    } catch (fallbackError) {
      console.error('Erro ao buscar observações (fallback):', fallbackError)
      return []
    }
  }
}
