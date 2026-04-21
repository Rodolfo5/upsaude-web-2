import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/app'
import type {
  FoodItem,
  MenuMealRecordEntity,
  MenuMealRecordEntry,
} from '@/types/entities/mealRecord'

const firestore = getFirestore(firebaseApp)

function toDate(value: unknown): Date | string {
  if (!value) return '' as unknown as Date
  if (typeof value === 'string') return value
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return '' as unknown as Date
}

function parseMeals(raw: unknown): MenuMealRecordEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map((m: Record<string, unknown>) => {
    const foods = (Array.isArray(m.foods) ? m.foods : []).map(
      (f: Record<string, unknown>) => ({
        id: String(f.id ?? ''),
        name: String(f.name ?? ''),
        portion: Number(f.portion) || 0,
        portionUnit: (f.portionUnit === 'ml' ? 'ml' : 'g') as 'g' | 'ml',
        kcal: typeof f.kcal === 'number' ? f.kcal : Number(f.kcal) || 0,
      }),
    ) as FoodItem[]
    return {
      mealType: String(m.mealType ?? ''),
      followedMenu: Boolean(m.followedMenu),
      kcal: typeof m.kcal === 'number' ? m.kcal : Number(m.kcal) || 0,
      imageUrl: String(m.imageUrl ?? ''),
      description: m.description != null ? String(m.description) : undefined,
      foods,
    } as MenuMealRecordEntry
  })
}

/**
 * Busca registros de refeição por intervalo de datas.
 * Caminho: users/{patientId}/therapeuticPlans/{planId}/healthPillars/{pillarId}/menu/{menuId}/mealRecords/{recordId}
 */
export async function getMealRecordsByDateRange(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
  startDate: Date,
  endDate: Date,
): Promise<MenuMealRecordEntity[]> {
  if (!patientId || !planId || !pillarId || !menuId) {
    return []
  }

  const mealRecordsRef = collection(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'menu',
    menuId,
    'mealRecords',
  )
  const snapshot = await getDocs(mealRecordsRef)

  if (snapshot.empty) {
    return []
  }

  const start = startDate.getTime()
  const end = endDate.getTime()

  const list: MenuMealRecordEntity[] = snapshot.docs
    .map((d) => {
      const data = d.data()
      const dateVal = data.date
      const date = toDate(dateVal)
      const dateMs =
        date instanceof Date
          ? date.getTime()
          : typeof date === 'string'
            ? new Date(date).getTime()
            : NaN
      if (Number.isNaN(dateMs) || dateMs < start || dateMs > end) {
        return null
      }
      return {
        id: d.id,
        menuId: String(data.menuId ?? menuId),
        date,
        meals: parseMeals(data.meals),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as MenuMealRecordEntity
    })
    .filter((x): x is MenuMealRecordEntity => x != null)

  list.sort((a, b) => {
    const ta =
      a.date instanceof Date
        ? a.date.getTime()
        : new Date(a.date as string).getTime()
    const tb =
      b.date instanceof Date
        ? b.date.getTime()
        : new Date(b.date as string).getTime()
    return tb - ta
  })

  return list
}

/**
 * Busca um registro de refeição por ID (formato dd-mm-aaaa).
 */
export async function getMealRecordById(
  patientId: string,
  planId: string,
  pillarId: string,
  menuId: string,
  recordId: string,
): Promise<MenuMealRecordEntity | null> {
  if (!patientId || !planId || !pillarId || !menuId || !recordId) {
    return null
  }

  const recordRef = doc(
    firestore,
    'users',
    patientId,
    'therapeuticPlans',
    planId,
    'healthPillars',
    pillarId,
    'menu',
    menuId,
    'mealRecords',
    recordId,
  )
  const docSnap = await getDoc(recordRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    menuId: String(data.menuId ?? menuId),
    date: toDate(data.date),
    meals: parseMeals(data.meals),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as MenuMealRecordEntity
}
