import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getAdminUsersPage } from '@/services/user'
import { UserRole } from '@/types/entities/user'

export const getAdminUsersPageQueryKey = ({
  cursor,
  limit,
  role,
  includeAgenda,
}: {
  cursor?: string | null
  limit?: number
  role?: UserRole
  includeAgenda?: boolean
}) =>
  [
    'users',
    'paginated',
    role ?? 'ALL',
    limit ?? 10,
    cursor ?? null,
    includeAgenda ?? false,
  ] as const

export const useAdminUsersPage = ({
  cursor,
  limit,
  role,
  includeAgenda,
  enabled = true,
}: {
  cursor?: string | null
  limit?: number
  role?: UserRole
  includeAgenda?: boolean
  enabled?: boolean
}) =>
  useQuery({
    queryKey: getAdminUsersPageQueryKey({
      cursor,
      limit,
      role,
      includeAgenda,
    }),
    queryFn: () =>
      getAdminUsersPage({
        cursor,
        limit,
        role,
        includeAgenda,
      }),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
    enabled,
  })
