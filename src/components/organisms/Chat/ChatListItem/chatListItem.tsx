import { Block, Message } from '@mui/icons-material'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatTime } from '@/utils/chat/formatTime'

import { ChatListItemProps } from './types'

export function ChatListItem({
  chat,
  patientName,
  profileImage,
  isSelected,
  onClick,
  onToggleBlocked,
}: ChatListItemProps) {
  const lastMessage = chat.lastMessage

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const displayName = truncateText(patientName, 25)
  const displayLastMessage = lastMessage
    ? truncateText(lastMessage.text, 30)
    : ''
  const displayTime = lastMessage
    ? formatTime(lastMessage.createdAt)
    : formatTime(chat.createdAt)

  const initials = patientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50',
        isSelected && 'bg-purple-50 hover:bg-purple-50',
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(
          'h-12 w-12 shrink-0',
          isSelected && 'ring-2 ring-purple-200',
        )}
      >
        {profileImage && <AvatarImage src={profileImage} alt={patientName} />}
        <AvatarFallback
          className={cn(
            'text-sm font-semibold',
            isSelected
              ? 'bg-purple-100 text-purple-600'
              : 'bg-gray-200 text-gray-600',
          )}
        >
          {initials || patientName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Informações do Chat */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              'truncate text-sm font-medium',
              isSelected ? 'text-gray-900' : 'text-gray-900',
            )}
          >
            {displayName}
          </p>
          {lastMessage && (
            <span
              className={cn(
                'ml-2 shrink-0 text-xs',
                isSelected ? 'text-gray-600' : 'text-gray-500',
              )}
            >
              {displayTime}
            </span>
          )}
        </div>
        {displayLastMessage && (
          <p
            className={cn(
              'truncate text-xs',
              isSelected ? 'text-gray-600' : 'text-gray-500',
            )}
          >
            {displayLastMessage}
          </p>
        )}
      </div>

      {/* Ícone de Mensagem */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleBlocked(chat.id)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full p-0 transition-colors hover:bg-gray-100"
          aria-label={chat.blocked ? 'Desbloquear chat' : 'Bloquear chat'}
        >
          {chat.blocked ? (
            <Block
              className={cn(
                'h-5 w-5',
                isSelected ? 'text-red-600' : 'text-red-400',
              )}
            />
          ) : (
            <Message
              className={cn(
                'h-5 w-5',
                isSelected ? 'text-purple-600' : 'text-gray-400',
              )}
            />
          )}
        </button>
      </div>
    </button>
  )
}
