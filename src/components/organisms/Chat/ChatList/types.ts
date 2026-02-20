import { ChatEntity } from '@/types/entities/chat'
import { MessageEntity } from '@/types/entities/message'

export interface ChatWithLastMessage extends ChatEntity {
  lastMessage: MessageEntity | null
}

export interface ChatListProps {
  chats: ChatWithLastMessage[]
  isLoading: boolean
  selectedChatId: string | null
  searchText: string
  patientNameMap: Map<string, string>
  patientDataMap: Map<string, { name: string; profileImage?: string }>
  onSelectChat: (chatId: string) => void
  onToggleBlocked: (chatId: string) => void
  onOpenAddChat: () => void
}
