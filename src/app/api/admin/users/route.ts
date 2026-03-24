import { NextResponse } from 'next/server'

import { adminFirestore, getAdminApp } from '@/config/firebase/firebaseAdmin'
import {
  fetchAgendaMapForUsers,
  mapUserSnapshotToAdminListItem,
} from '@/lib/server/adminUsers'
import {
  forbiddenRouteResponse,
  isAdminRouteUser,
  requireAuthenticatedRouteUser,
} from '@/lib/server/routeAuth'
import { UserRole } from '@/types/entities/user'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

const isUserRole = (value: string | null): value is UserRole =>
  value != null && Object.values(UserRole).includes(value as UserRole)

const parsePageSize = (value: string | null) => {
  const parsedValue = Number.parseInt(value ?? '', 10)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.min(parsedValue, MAX_PAGE_SIZE)
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAuthenticatedRouteUser(request)

    if ('response' in authResult) {
      return authResult.response
    }

    if (!isAdminRouteUser(authResult.user)) {
      return forbiddenRouteResponse(
        'Apenas administradores podem listar usuarios no painel administrativo.',
      )
    }

    await getAdminApp()

    const db = adminFirestore()
    const url = new URL(request.url)
    const limit = parsePageSize(url.searchParams.get('limit'))
    const cursor = url.searchParams.get('cursor')
    const role = url.searchParams.get('role')
    const includeAgenda = url.searchParams.get('includeAgenda') === 'true'

    if (role && !isUserRole(role)) {
      return NextResponse.json(
        {
          users: [],
          error: 'Role invalida para paginação de usuarios.',
          nextCursor: null,
          hasNextPage: false,
        },
        { status: 400 },
      )
    }

    let usersQuery: FirebaseFirestore.Query = db.collection('users')

    if (role) {
      usersQuery = usersQuery.where('role', '==', role)
    }

    usersQuery = usersQuery.orderBy('createdAt', 'desc').limit(limit + 1)

    if (cursor) {
      const cursorSnapshot = await db.collection('users').doc(cursor).get()

      if (!cursorSnapshot.exists) {
        return NextResponse.json(
          {
            users: [],
            error: 'Cursor de paginação invalido.',
            nextCursor: null,
            hasNextPage: false,
          },
          { status: 400 },
        )
      }

      usersQuery = usersQuery.startAfter(cursorSnapshot)
    }

    const snapshot = await usersQuery.get()
    const pageDocs = snapshot.docs.slice(0, limit)
    const hasNextPage = snapshot.docs.length > limit
    const nextCursor =
      hasNextPage && pageDocs.length > 0
        ? pageDocs[pageDocs.length - 1].id
        : null

    const doctorIds = includeAgenda
      ? pageDocs
          .filter((docSnapshot) => docSnapshot.get('role') === UserRole.DOCTOR)
          .map((docSnapshot) => docSnapshot.id)
      : []

    const agendaMap = includeAgenda
      ? await fetchAgendaMapForUsers(db, doctorIds)
      : undefined

    const users = pageDocs.map((docSnapshot) =>
      mapUserSnapshotToAdminListItem(docSnapshot, agendaMap),
    )

    return NextResponse.json({
      users,
      error: null,
      nextCursor,
      hasNextPage,
    })
  } catch (error) {
    console.error('Erro ao listar usuarios paginados:', error)

    return NextResponse.json(
      {
        users: [],
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao listar usuarios paginados.',
        nextCursor: null,
        hasNextPage: false,
      },
      { status: 500 },
    )
  }
}
