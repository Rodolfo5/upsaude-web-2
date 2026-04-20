import { MessageSquare as Message } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4">
      <div className="max-w-sm text-center">
        <Message className="mx-auto mb-4 h-12 w-12 text-gray-300 sm:h-16 sm:w-16" />
        <p className="text-base font-medium text-gray-600 sm:text-lg">
          {title}
        </p>
        <p className="mt-2 text-xs text-gray-500 sm:text-sm">{description}</p>
      </div>
    </div>
  )
}
