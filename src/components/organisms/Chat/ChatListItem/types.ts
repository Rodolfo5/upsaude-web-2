import { ChatEntity } from '@/types/entities/chat'
import { MessageEntity } from '@/types/entities/message'

export interface ChatListItemProps {
  chat: ChatEntity & { lastMessage?: MessageEntity | null }
  patientName: string
  profileImage?: string
  isSelected: boolean
  onClick: () => void
  onToggleBlocked: (chatId: string) => void
}
