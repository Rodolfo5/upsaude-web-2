import { useEffect, useMemo, useState } from 'react'

import { subscribeLastMessage } from '@/services/message'
import { ChatEntity } from '@/types/entities/chat'
import { MessageEntity } from '@/types/entities/message'

interface ChatWithLastMessage extends ChatEntity {
  lastMessage: MessageEntity | null
}

export const useChatsWithLastMessages = (chats: ChatEntity[] | undefined) => {
  const [lastMessagesMap, setLastMessagesMap] = useState<
    Map<string, MessageEntity | null>
  >(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Inscrever-se na última mensagem de cada chat
  useEffect(() => {
    if (!chats || chats.length === 0) {
      setLastMessagesMap(new Map())
      setIsLoading(false)
      return
    }

    const unsubscribes: (() => void)[] = []
    const newLastMessagesMap = new Map<string, MessageEntity | null>()

    let loadedCount = 0
    const totalChats = chats.length

    chats.forEach((chat) => {
      let hasReceivedFirstUpdate = false
      const unsubscribe = subscribeLastMessage(
        chat.id,
        (message) => {
          newLastMessagesMap.set(chat.id, message)
          setLastMessagesMap(new Map(newLastMessagesMap))
          if (!hasReceivedFirstUpdate) {
            hasReceivedFirstUpdate = true
            loadedCount++
            if (loadedCount === totalChats) {
              setIsLoading(false)
            }
          }
        },
        () => {
          newLastMessagesMap.set(chat.id, null)
          setLastMessagesMap(new Map(newLastMessagesMap))
          if (!hasReceivedFirstUpdate) {
            hasReceivedFirstUpdate = true
            loadedCount++
            if (loadedCount === totalChats) {
              setIsLoading(false)
            }
          }
        },
      )
      unsubscribes.push(unsubscribe)
    })

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [chats])

  // Ordenar chats pela última mensagem (mais recente primeiro)
  const sortedChats = useMemo(() => {
    if (!chats) return []

    const chatsWithLastMessage: ChatWithLastMessage[] = chats.map((chat) => ({
      ...chat,
      lastMessage: lastMessagesMap.get(chat.id) || null,
    }))

    const getTimestamp = (
      timestamp: { toDate?: () => Date } | Date,
    ): number => {
      if ('toDate' in timestamp && timestamp.toDate) {
        return timestamp.toDate().getTime()
      }
      return new Date(timestamp as unknown as Date).getTime()
    }

    return chatsWithLastMessage.sort((a, b) => {
      // Se ambos têm última mensagem, ordenar por timestamp
      if (a.lastMessage && b.lastMessage) {
        const timestampA = getTimestamp(a.lastMessage.createdAt)
        const timestampB = getTimestamp(b.lastMessage.createdAt)
        return timestampB - timestampA // Mais recente primeiro
      }

      // Se apenas um tem mensagem, ele vem primeiro
      if (a.lastMessage && !b.lastMessage) return -1
      if (!a.lastMessage && b.lastMessage) return 1

      // Se nenhum tem mensagem, ordenar por createdAt do chat
      const timestampA = getTimestamp(a.createdAt)
      const timestampB = getTimestamp(b.createdAt)
      return timestampB - timestampA // Mais recente primeiro
    })
  }, [chats, lastMessagesMap])

  return { sortedChats, isLoading }
}
