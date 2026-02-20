import { MessageEntity } from '@/types/entities/message'

export interface MessagesAreaProps {
  messages: MessageEntity[]
  isLoading: boolean
  currentUserId: string | undefined
}
