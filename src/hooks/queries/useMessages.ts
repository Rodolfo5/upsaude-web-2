import { useEffect, useState } from 'react'

import { subscribeMessages } from '@/services/message'
import { MessageEntity } from '@/types/entities/message'

export const useMessages = (chatId: string | null) => {
  const [messages, setMessages] = useState<MessageEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const unsubscribe = subscribeMessages(
      chatId,
      (newMessages) => {
        setMessages(newMessages)
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [chatId])

  return { messages, isLoading, error }
}
