import { useContext } from 'react'

import { UserContextType } from '@/providers/User/types'
import UserContext from '@providers/User/context'

export default function useUser(): UserContextType {
  return useContext(UserContext)
}
