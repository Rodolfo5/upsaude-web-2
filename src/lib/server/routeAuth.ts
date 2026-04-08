import 'server-only'

import { NextResponse } from 'next/server'

import {
  adminAuth,
  adminFirestore,
  getAdminApp,
} from '@/config/firebase/firebaseAdmin'
import { UserRole } from '@/types/entities/user'

export interface AuthenticatedRouteUser {
  uid: string
  email: string | null
  role: UserRole | null
  userDocId: string | null
  userIds: string[]
  userData: FirebaseFirestore.DocumentData | null
}

const USER_ROLES = new Set<string>(Object.values(UserRole))

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && USER_ROLES.has(value)

const normalizeUserIds = (...values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      ),
    ),
  )

export const unauthorizedRouteResponse = (
  message = 'Sessao invalida ou expirada.',
) => NextResponse.json({ error: message }, { status: 401 })

export const forbiddenRouteResponse = (message = 'Acesso negado.') =>
  NextResponse.json({ error: message }, { status: 403 })

export const isAdminRouteUser = (user: AuthenticatedRouteUser) =>
  user.role === UserRole.ADMIN

export const isPatientRouteUser = (user: AuthenticatedRouteUser) =>
  user.role === UserRole.PATIENT

export const hasRouteUserRole = (
  user: AuthenticatedRouteUser,
  allowedRoles: UserRole[],
) => Boolean(user.role && allowedRoles.includes(user.role))

export const isSameRouteUser = (
  user: AuthenticatedRouteUser,
  targetUserId?: string | null,
) =>
  Boolean(
    targetUserId &&
    typeof targetUserId === 'string' &&
    user.userIds.includes(targetUserId),
  )

export const isAdminOrSameRouteUser = (
  user: AuthenticatedRouteUser,
  targetUserId?: string | null,
) => isAdminRouteUser(user) || isSameRouteUser(user, targetUserId)

export const isAdminOrSamePatientRouteUser = (
  user: AuthenticatedRouteUser,
  targetUserId?: string | null,
) =>
  isAdminRouteUser(user) ||
  (isPatientRouteUser(user) && isSameRouteUser(user, targetUserId))

export async function findUserDocumentByAnyId(
  db: FirebaseFirestore.Firestore,
  userId: string,
) {
  const userDoc = await db.collection('users').doc(userId).get()

  if (userDoc.exists) {
    return userDoc
  }

  const byIdSnapshot = await db
    .collection('users')
    .where('id', '==', userId)
    .limit(1)
    .get()

  if (!byIdSnapshot.empty) {
    return byIdSnapshot.docs[0]
  }

  const byUidSnapshot = await db
    .collection('users')
    .where('uid', '==', userId)
    .limit(1)
    .get()

  if (!byUidSnapshot.empty) {
    return byUidSnapshot.docs[0]
  }

  return null
}

export async function requireAuthenticatedRouteUser(request: Request): Promise<
  | {
      user: AuthenticatedRouteUser
      db: FirebaseFirestore.Firestore
    }
  | { response: NextResponse }
> {
  const authorizationHeader = request.headers.get('authorization')

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return {
      response: unauthorizedRouteResponse(
        'Envie um token Bearer valido no cabecalho Authorization.',
      ),
    }
  }

  const token = authorizationHeader.slice('Bearer '.length).trim()

  if (!token) {
    return {
      response: unauthorizedRouteResponse(
        'Token de autenticacao nao informado.',
      ),
    }
  }

  try {
    await getAdminApp()

    const decodedToken = await adminAuth().verifyIdToken(token)
    const db = adminFirestore()
    const userDoc = await findUserDocumentByAnyId(db, decodedToken.uid)
    const userData = userDoc?.data() ?? null

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email ?? null,
        role: isUserRole(userData?.role) ? userData.role : null,
        userDocId: userDoc?.id ?? null,
        userIds: normalizeUserIds(
          decodedToken.uid,
          userDoc?.id,
          typeof userData?.id === 'string' ? userData.id : null,
          typeof userData?.uid === 'string' ? userData.uid : null,
        ),
        userData,
      },
      db,
    }
  } catch (error) {
    console.error('Erro ao autenticar rota protegida:', error)

    return {
      response: unauthorizedRouteResponse(
        'Nao foi possivel validar a autenticacao.',
      ),
    }
  }
}
