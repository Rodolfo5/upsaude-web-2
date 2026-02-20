import { useQuery } from '@tanstack/react-query'

import { FORTY_FIVE_MINUTES_IN_MS } from '@/constants/generic'
import useUser from '@/hooks/useUser'
import { getChatsByDoctor } from '@/services/chat'

export function getChatsByDoctorQueryKey(doctorId: string | undefined) {
  return ['chats', doctorId]
}

export const getChatsByDoctorQueryFn =
  (doctorId: string | undefined) => async () => {
    if (!doctorId) {
      throw new Error('DoctorId é obrigatório')
    }

    const result = await getChatsByDoctor(doctorId)
    if (result.error) {
      throw new Error(result.error)
    }

    return result.chats
  }

const useChatsByDoctor = () => {
  const { currentUser } = useUser()
  const doctorId = currentUser?.id

  return useQuery({
    queryKey: getChatsByDoctorQueryKey(doctorId),
    queryFn: getChatsByDoctorQueryFn(doctorId),
    enabled: !!doctorId,
    staleTime: FORTY_FIVE_MINUTES_IN_MS,
  })
}

export default useChatsByDoctor
