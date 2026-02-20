import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import { getAllUsers } from '@/services/user'

export function getAllUsersQueryKey() {
  return ['users']
}

export const getAllUsersQueryFn = () => {
  return () => getAllUsers()
}

const useAllUsers = () => {
  return useQuery({
    queryKey: getAllUsersQueryKey(),
    queryFn: getAllUsersQueryFn(),
    select: (data) => (Array.isArray(data) ? data : data.users),
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useAllUsers
