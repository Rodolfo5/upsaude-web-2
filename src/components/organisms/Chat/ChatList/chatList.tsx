import { Message } from '@mui/icons-material'

import { Button } from '@/components/atoms/Button/button'

import { ChatListItem } from '../ChatListItem/chatListItem'

import { ChatListProps } from './types'

export function ChatList(props: ChatListProps) {
  const {
    chats,
    isLoading,
    selectedChatId,
    searchText,
    patientDataMap,
    onSelectChat,
    onToggleBlocked,
    onOpenAddChat,
  } = props
  return (
    <div className="flex-1 overflow-y-auto bg-white" style={{ minHeight: 0 }}>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">Carregando conversas...</p>
        </div>
      ) : chats && chats.length > 0 ? (
        chats.map((chat) => {
          const patientData = patientDataMap.get(chat.patientId) || {
            name: chat.patientId,
            profileImage: undefined,
          }
          return (
            <ChatListItem
              key={chat.id}
              chat={chat}
              patientName={patientData.name}
              profileImage={patientData.profileImage}
              isSelected={selectedChatId === chat.id}
              onClick={() => onSelectChat(chat.id)}
              onToggleBlocked={onToggleBlocked}
            />
          )
        })
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Message className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-600">
            {searchText
              ? 'Nenhuma conversa encontrada com esse nome'
              : 'Nenhuma conversa encontrada'}
          </p>
          <Button
            variant="secondary-color"
            size="sm"
            className="mt-4"
            onClick={onOpenAddChat}
          >
            Criar primeira conversa
          </Button>
        </div>
      )}
    </div>
  )
}
