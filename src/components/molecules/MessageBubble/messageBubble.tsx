import { PdfMessage } from '@/components/organisms/Chat/PdfMessage/pdfMessage'
import { cn } from '@/lib/utils'
import { MessageEntity } from '@/types/entities/message'
import { formatMessageTime } from '@/utils/chat/formatMessageDate'

interface MessageBubbleProps {
  message: MessageEntity
  isOwnMessage: boolean
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  // Se for mensagem de PDF
  if (message.type === 'pdf' && message.fileUrl && message.fileName) {
    return (
      <div
        className={cn(
          'mb-3 flex w-full',
          isOwnMessage ? 'justify-end' : 'justify-start',
        )}
      >
        <PdfMessage
          fileName={message.fileName}
          fileUrl={message.fileUrl}
          isOwnMessage={isOwnMessage}
          createdAt={message.createdAt}
        />
      </div>
    )
  }

  // Mensagem de texto normal
  return (
    <div
      className={cn(
        'mb-3 flex w-full',
        isOwnMessage ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isOwnMessage
            ? 'bg-purple-600 text-white'
            : 'bg-gray-200 text-gray-900',
        )}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={cn(
            'mt-1 text-xs',
            isOwnMessage ? 'text-purple-100' : 'text-gray-500',
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}
