import { useEffect, useState } from 'react'

import { subscribeLastMessage } from '@/services/message'
import { MessageEntity } from '@/types/entities/message'

export const useLastMessage = (chatId: string | null) => {
  const [lastMessage, setLastMessage] = useState<MessageEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chatId) {
      setLastMessage(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeLastMessage(
      chatId,
      (message) => {
        setLastMessage(message)
        setIsLoading(false)
      },
      (err) => {
        setError(err.message || 'Erro ao buscar última mensagem')
        setIsLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [chatId])

  return { lastMessage, isLoading, error }
}
