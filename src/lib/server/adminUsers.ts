import { AgendaEntity } from '@/types/entities/agenda'
import { DoctorEntity, UserRole } from '@/types/entities/user'

const FIRESTORE_IN_QUERY_LIMIT = 10

const isDateLike = (value: unknown): value is { toDate: () => Date } =>
  typeof value === 'object' &&
  value !== null &&
  'toDate' in value &&
  typeof (value as { toDate?: unknown }).toDate === 'function'

export const serializeFirestoreValue = (value: unknown): unknown => {
  if (value == null) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (isDateLike(value)) {
    return value.toDate().toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        serializeFirestoreValue(item),
      ]),
    )
  }

  return value
}

const chunkArray = <T>(items: T[], size: number) => {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export async function fetchAgendaMapForUsers(
  db: FirebaseFirestore.Firestore,
  userIds: string[],
) {
  const agendaMap = new Map<string, AgendaEntity>()

  if (userIds.length === 0) {
    return agendaMap
  }

  const chunks = chunkArray(userIds, FIRESTORE_IN_QUERY_LIMIT)

  for (const chunk of chunks) {
    const snapshot = await db
      .collectionGroup('agenda')
      .where('professionalId', 'in', chunk)
      .get()

    snapshot.docs.forEach((docSnapshot) => {
      const data = serializeFirestoreValue(
        docSnapshot.data(),
      ) as AgendaEntity & { professionalId?: string }

      const professionalId = data.professionalId

      if (typeof professionalId === 'string' && !agendaMap.has(professionalId)) {
        agendaMap.set(professionalId, data)
      }
    })
  }

  return agendaMap
}

export const mapUserSnapshotToAdminListItem = (
  docSnapshot: FirebaseFirestore.QueryDocumentSnapshot,
  agendaMap?: Map<string, AgendaEntity>,
) => {
  const data = serializeFirestoreValue(
    docSnapshot.data(),
  ) as Record<string, unknown>

  const mappedUser = {
    ...data,
    id: docSnapshot.id,
    uid:
      typeof data.uid === 'string' && data.uid.trim().length > 0
        ? data.uid
        : docSnapshot.id,
  } as DoctorEntity

  if (
    agendaMap &&
    data.role === UserRole.DOCTOR &&
    agendaMap.has(docSnapshot.id)
  ) {
    mappedUser.agenda = agendaMap.get(docSnapshot.id)
  }

  return mappedUser
}
