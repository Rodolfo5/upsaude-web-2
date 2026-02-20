'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { ChatHeader } from '@/components/organisms/Chat/ChatHeader/chatHeader'
import { ChatList } from '@/components/organisms/Chat/ChatList/chatList'
import { ChatListHeader } from '@/components/organisms/Chat/ChatListHeader/chatListHeader'
import { EmptyState } from '@/components/organisms/Chat/EmptyState/emptyState'
import { MessageInput } from '@/components/organisms/Chat/MessageInput/messageInput'
import { MessagesArea } from '@/components/organisms/Chat/MessagesArea/messagesArea'
import { AddChatModal } from '@/components/organisms/Modals/AddChatModal/addChatModal'
import useChatsByDoctor from '@/hooks/queries/useChatsByDoctor'
import { useChatsWithLastMessages } from '@/hooks/queries/useChatsWithLastMessages'
import { useCreateChat } from '@/hooks/queries/useCreateChat'
import { useMessages } from '@/hooks/queries/useMessages'
import { useAllPatientsByDoctor } from '@/hooks/queries/usePatientsByDoctor'
import { usePatientsByIds } from '@/hooks/queries/usePatientsByIds'
import { useSendMessage } from '@/hooks/queries/useSendMessage'
import { useToggleChatBlocked } from '@/hooks/queries/useToggleChatBlocked'
import { useUploadChatFile } from '@/hooks/queries/useUploadChatFile'
import useUser from '@/hooks/useUser'
import { PatientEntity } from '@/types/entities/user'

interface SelectedFile {
  file: File
  fileName: string
  fileSize: number
}

export default function ChatPage() {
  const [isAddChatModalOpen, setIsAddChatModalOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const chatIdFromUrl = searchParams.get('chatId')

  const { currentUser } = useUser()
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChat()
  const { data: chats, isLoading: isLoadingChats } = useChatsByDoctor()
  const { sortedChats, isLoading: isLoadingLastMessages } =
    useChatsWithLastMessages(chats)
  const { data: patientsByDoctor } = useAllPatientsByDoctor()

  // Extrair IDs únicos dos pacientes dos chats
  const patientIdsFromChats = useMemo(() => {
    if (!chats) return []
    const uniqueIds = new Set<string>()
    chats.forEach((chat) => {
      if (chat.patientId) {
        uniqueIds.add(chat.patientId)
      }
    })
    return Array.from(uniqueIds)
  }, [chats])

  // Buscar pacientes pelos IDs dos chats
  const { data: patientsFromChats } = usePatientsByIds(patientIdsFromChats)

  // Combinar pacientes de ambas as fontes (chats e doctorId)
  const patients = useMemo(() => {
    const map = new Map<string, PatientEntity>()

    // Adicionar pacientes do doctorId primeiro
    patientsByDoctor?.forEach((patient) => {
      map.set(patient.id, patient)
    })

    // Adicionar pacientes dos chats (sobrescreve se já existir)
    patientsFromChats?.forEach((patient) => {
      map.set(patient.id, patient)
    })

    return Array.from(map.values())
  }, [patientsByDoctor, patientsFromChats])
  const { messages, isLoading: isLoadingMessages } = useMessages(selectedChatId)
  const { mutate: sendMessage, isPending: isSendingMessage } = useSendMessage()
  const { mutate: toggleBlocked } = useToggleChatBlocked()
  const { mutate: uploadFile, isPending: isUploadingFile } = useUploadChatFile()

  // Mapear patientId para dados do paciente (nome e foto)
  const patientDataMap = useMemo(() => {
    const map = new Map<string, { name: string; profileImage?: string }>()
    patients?.forEach((patient) => {
      map.set(patient.id, {
        name: patient.name || patient.email || patient.id,
        profileImage: patient.profileImage,
      })
    })
    return map
  }, [patients])

  // Mapear patientId para nome do paciente (para compatibilidade)
  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>()
    patientDataMap.forEach((data, id) => {
      map.set(id, data.name)
    })
    return map
  }, [patientDataMap])

  // Filtrar chats baseado no texto de busca (usando sortedChats que já está ordenado)
  const filteredChats = useMemo(() => {
    if (!sortedChats || !searchText.trim()) {
      return sortedChats || []
    }

    const searchLower = searchText.toLowerCase().trim()
    return sortedChats.filter((chat) => {
      const patientName = patientNameMap.get(chat.patientId) || chat.patientId
      return patientName.toLowerCase().includes(searchLower)
    })
  }, [sortedChats, searchText, patientNameMap])

  // Seleciona o primeiro chat automaticamente quando os chats são carregados
  useEffect(() => {
    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl)
    } else if (sortedChats && sortedChats.length > 0 && !selectedChatId) {
      setSelectedChatId(sortedChats[0].id)
    }
  }, [sortedChats, selectedChatId, chatIdFromUrl])

  const handleToggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
    if (isSearchOpen) {
      setSearchText('')
    }
  }

  const handleOpenAddChatModal = () => {
    setIsAddChatModalOpen(true)
  }

  const handleCloseAddChatModal = () => {
    setIsAddChatModalOpen(false)
  }

  const handleCreateChat = (patientId: string) => {
    if (!currentUser?.id) {
      return
    }

    const existingChat = chats?.find((chat) => chat.patientId === patientId)
    if (existingChat) {
      setSelectedChatId(existingChat.id)
      router.push(`/chat?chatId=${existingChat.id}`)
      handleCloseAddChatModal()
      return
    }

    createChat(
      {
        patientId,
        doctorId: currentUser.id,
      },
      {
        onSuccess: () => {
          handleCloseAddChatModal()
        },
      },
    )
  }

  const selectedChat = sortedChats?.find((chat) => chat.id === selectedChatId)

  const handleFileSelect = (file: File) => {
    setSelectedFile({
      file,
      fileName: file.name,
      fileSize: file.size,
    })
    // Limpar texto quando selecionar arquivo
    setMessageText('')
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
  }

  const handleSendMessage = () => {
    if (
      (!messageText.trim() && !selectedFile) ||
      !selectedChatId ||
      !currentUser?.id
    ) {
      return
    }

    const receiverId =
      selectedChat?.doctorId === currentUser.id
        ? selectedChat.patientId
        : selectedChat?.doctorId

    if (!receiverId) {
      return
    }

    // Se tiver arquivo, fazer upload primeiro
    if (selectedFile) {
      uploadFile(
        {
          file: selectedFile.file,
          chatId: selectedChatId,
        },
        {
          onSuccess: (result) => {
            if (result.error || !result.url) {
              return
            }

            // Enviar mensagem com arquivo
            sendMessage(
              {
                chatId: selectedChatId,
                message: {
                  senderId: currentUser.id,
                  receiverId,
                  text: messageText.trim() || selectedFile.fileName,
                  type: 'pdf',
                  fileUrl: result.url,
                  fileName: selectedFile.fileName,
                  fileType: 'application/pdf',
                },
              },
              {
                onSuccess: () => {
                  setMessageText('')
                  setSelectedFile(null)
                },
              },
            )
          },
        },
      )
    } else {
      // Enviar mensagem de texto normal
      sendMessage(
        {
          chatId: selectedChatId,
          message: {
            senderId: currentUser.id,
            receiverId,
            text: messageText.trim(),
            type: 'text',
          },
        },
        {
          onSuccess: () => {
            setMessageText('')
          },
        },
      )
    }
  }

  const selectedPatientData =
    selectedChat && patientDataMap.get(selectedChat.patientId)
      ? patientDataMap.get(selectedChat.patientId)!
      : { name: selectedChat?.patientId || '', profileImage: undefined }

  return (
    <div className="flex h-screen w-full max-w-full overflow-x-hidden overflow-y-hidden">
      {/* Coluna Esquerda - Lista de Conversas (no mobile esconde quando uma conversa está selecionada) */}
      <div
        className={`flex h-full min-w-0 flex-col border-r border-gray-200 md:w-96 md:flex-shrink-0 ${
          selectedChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatListHeader
          isSearchOpen={isSearchOpen}
          searchText={searchText}
          onToggleSearch={handleToggleSearch}
          onSearchChange={setSearchText}
          onClearSearch={() => setSearchText('')}
          onOpenAddChat={handleOpenAddChatModal}
        />

        <ChatList
          chats={filteredChats}
          isLoading={isLoadingChats || isLoadingLastMessages}
          selectedChatId={selectedChatId}
          searchText={searchText}
          patientNameMap={patientNameMap}
          patientDataMap={patientDataMap}
          onSelectChat={setSelectedChatId}
          onToggleBlocked={(chatId) => toggleBlocked(chatId)}
          onOpenAddChat={handleOpenAddChatModal}
        />
      </div>

      {/* Coluna Direita - Área de Mensagens (no mobile só aparece quando uma conversa está selecionada) */}
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col bg-gray-50 ${
          selectedChatId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedChat ? (
          <>
            <ChatHeader
              patientName={selectedPatientData.name}
              profileImage={selectedPatientData.profileImage}
              onBackToChatList={() => setSelectedChatId(null)}
            />

            <MessagesArea
              messages={messages}
              isLoading={isLoadingMessages}
              currentUserId={currentUser?.id}
            />

            <MessageInput
              messageText={messageText}
              isSending={isSendingMessage || isUploadingFile}
              selectedFile={selectedFile}
              onMessageChange={setMessageText}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              onSend={handleSendMessage}
            />
          </>
        ) : (
          <EmptyState
            title="Selecione uma conversa"
            description="Escolha uma conversa da lista para começar a enviar mensagens"
          />
        )}
      </div>

      <AddChatModal
        isOpen={isAddChatModalOpen}
        setIsOpen={setIsAddChatModalOpen}
        title="Novo chat"
        description="Crie um novo chat com o seu paciente"
        action={handleCreateChat}
        actionLabel="Criar chat"
        loading={isCreatingChat}
        excludePatientIds={patientIdsFromChats}
      />
    </div>
  )
}
