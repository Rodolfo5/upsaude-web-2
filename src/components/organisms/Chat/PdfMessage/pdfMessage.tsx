import { PictureAsPdf } from '@mui/icons-material'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/utils/chat/formatMessageDate'

import { PdfMessageProps } from './types'

export function PdfMessage({
  fileName,
  fileUrl,
  isOwnMessage,
  createdAt,
}: PdfMessageProps) {
  const handleOpenPdf = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={cn(
        'max-w-[70%] cursor-pointer rounded-lg px-4 py-2 transition-colors hover:opacity-90',
        isOwnMessage
          ? 'bg-purple-600 text-white'
          : 'bg-gray-200 text-gray-900',
      )}
      onClick={handleOpenPdf}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpenPdf()
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded',
            isOwnMessage ? 'bg-purple-100' : 'bg-red-100',
          )}
        >
          <PictureAsPdf
            className={cn(
              'h-6 w-6',
              isOwnMessage ? 'text-purple-600' : 'text-red-600',
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium',
              isOwnMessage ? 'text-white' : 'text-gray-900',
            )}
          >
            {fileName}
          </p>
        </div>
      </div>
      <p
        className={cn(
          'mt-1 text-xs',
          isOwnMessage ? 'text-purple-100' : 'text-gray-500',
        )}
      >
        {formatMessageTime(createdAt)}
      </p>
    </div>
  )
}

