import { formatMessageDate } from '@/utils/chat/formatMessageDate'

interface DateSeparatorProps {
  timestamp: { toDate?: () => Date } | Date
}

export function DateSeparator({ timestamp }: DateSeparatorProps) {
  const dateLabel = formatMessageDate(timestamp)

  return (
    <div className="my-4 flex items-center">
      <div className="flex-1 border-t border-gray-200"></div>
      <span className="mx-4 text-xs font-medium text-gray-500">
        {dateLabel}
      </span>
      <div className="flex-1 border-t border-gray-200"></div>
    </div>
  )
}
