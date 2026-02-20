import { ChevronLeft } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  patientName: string
  profileImage?: string
  onBackToChatList?: () => void
}

export function ChatHeader({
  patientName,
  profileImage,
  onBackToChatList,
}: ChatHeaderProps) {
  const initials = patientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex shrink-0 border-b border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex w-full items-center gap-3">
        {onBackToChatList && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBackToChatList}
            aria-label="Voltar para lista de conversas"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10 shrink-0">
          {profileImage && <AvatarImage src={profileImage} alt={patientName} />}
          <AvatarFallback className="bg-purple-100 text-sm font-semibold text-purple-600">
            {initials || patientName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">{patientName}</h3>
        </div>
      </div>
    </div>
  )
}
