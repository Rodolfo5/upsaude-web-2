import { useEffect, useRef } from 'react'

import { MessageBubble } from '@/components/molecules/MessageBubble/messageBubble'
import { DateSeparator } from '@/components/organisms/Chat/DateSeparator/dateSeparator'
import { MessageEntity } from '@/types/entities/message'
import { isSameDay } from '@/utils/chat/formatMessageDate'

interface MessagesAreaProps {
  messages: MessageEntity[]
  isLoading: boolean
  currentUserId: string | undefined
}

export function MessagesArea({
  messages,
  isLoading,
  currentUserId,
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      className="flex-1 overflow-y-auto p-3 sm:p-4"
      style={{ minHeight: 0 }}
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400">Carregando mensagens...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400">Nenhuma mensagem foi enviada ainda</p>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null
            const shouldShowDateSeparator =
              !previousMessage ||
              !isSameDay(message.createdAt, previousMessage.createdAt)

            return (
              <div key={message.id}>
                {shouldShowDateSeparator && (
                  <DateSeparator timestamp={message.createdAt} />
                )}
                <MessageBubble
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                />
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}
