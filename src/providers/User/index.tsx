/**
 * 👥 PROVIDER DE USUÁRIOS
 *
 * Gerencia dados específicos dos usuários da aplicação
 * - Dados do usuário atual
 * - Lista de todos os usuários (admin)
 * - Operações CRUD de usuários
 * - Sincronização com AuthProvider
 */

'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { THIRTY_MINUTES_IN_MS } from '@/constants/generic'
import { errorToast, successToast } from '@/hooks/useAppToast'
import useAuth from '@/hooks/useAuth'
import { getUserDoc, getAllUsers, updateUserDoc } from '@/services/user'
import { UserEntity, UserRole } from '@/types/entities/user'

import UserContext from './context'

// ====================================================================
// 📋 TIPOS
// ====================================================================

interface Props {
  children: React.ReactNode
}

// ====================================================================
// 🚀 COMPONENTE PROVIDER
// ====================================================================

const UserProvider = ({ children }: Props) => {
  const { userUid } = useAuth()
  const queryClient = useQueryClient()

  // ====================================================================
  // 📊 ESTADO INICIAL
  // ====================================================================

  const initialLoadingObject = {
    fetchCurrentUser: false,
    updateUser: false,
    getAllUsers: false,
    updateUserRole: false,
  }

  // Substituído useState+useEffect por useQuery — usa cache TanStack Query
  const {
    data: currentUser = null,
    isLoading: isLoadingCurrentUser,
  } = useQuery({
    queryKey: ['user', userUid],
    queryFn: async () => {
      const { user, error } = await getUserDoc(userUid!)
      if (error || !user || Object.keys(user).length === 0) {
        errorToast(error)
        return null
      }
      return user
    },
    enabled: !!userUid,
    staleTime: THIRTY_MINUTES_IN_MS,
  })

  const [allUsers, setAllUsers] = useState<UserEntity[] | null>(null)
  const [loadingState, setLoading] = useState(initialLoadingObject)

  const loading = useMemo(
    () => ({
      fetchCurrentUser: isLoadingCurrentUser,
      updateUser: loadingState.updateUser,
      getAllUsers: loadingState.getAllUsers,
      updateUserRole: loadingState.updateUserRole,
    }),
    [
      isLoadingCurrentUser,
      loadingState.updateUser,
      loadingState.getAllUsers,
      loadingState.updateUserRole,
    ],
  )

  // ====================================================================
  // 🔄 SINCRONIZAÇÃO COM AUTH
  // ====================================================================
  // useQuery com enabled: !!userUid já gerencia login/logout automaticamente

  // ====================================================================
  // 📖 OPERAÇÕES DE LEITURA
  // ====================================================================

  /**
   * Força reload dos dados do usuário (invalida cache TanStack Query)
   */
  const fetchCurrentUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user', userUid] })
  }

  /**
   * Carrega todos os usuários (para admin)
   */
  const fetchAllUsers = async () => {
    setLoading((prev) => ({ ...prev, getAllUsers: true }))

    try {
      const { users, error } = await getAllUsers()

      if (error) {
        errorToast(error)
      } else if (users && users.length === 0) {
        errorToast('Nenhum usuário encontrado')
      } else {
        setAllUsers(users || [])
      }
    } catch {
      errorToast('Erro ao buscar usuários')
    }

    setLoading((prev) => ({ ...prev, getAllUsers: false }))
  }

  // ====================================================================
  // ✏️ OPERAÇÕES DE ATUALIZAÇÃO
  // ====================================================================

  /**
   * Atualiza dados do usuário atual
   * - Salva no Firestore
   * - Atualiza estado local
   */
  const updateUser = async (updates: {
    email?: string
    name?: string
    role?: UserRole
  }) => {
    if (!userUid) {
      errorToast('Usuário não encontrado')
      return
    }

    setLoading((prev) => ({ ...prev, updateUser: true }))

    try {
      const { error } = await updateUserDoc(userUid, updates)

      if (error) {
        errorToast(error)
      } else {
        successToast('Perfil atualizado com sucesso')

        // 🔄 Invalida cache do TanStack Query para re-buscar dados atualizados
        await queryClient.invalidateQueries({ queryKey: ['user', userUid] })
      }
    } catch {
      errorToast('Erro ao atualizar perfil')
    }

    setLoading((prev) => ({ ...prev, updateUser: false }))
  }

  /**
   * Atualiza role de usuário específico (admin only)
   * - Atualiza no Firestore
   * - Atualiza nas listas locais
   */
  const updateUserRole = async (uid: string, role: UserRole) => {
    setLoading((prev) => ({ ...prev, updateUserRole: true }))

    try {
      const { error } = await updateUserDoc(uid, { role })

      if (error) {
        errorToast(error)
      } else {
        successToast(`Role atualizado para ${role}`)

        // 🔄 Atualizar na lista de usuários
        if (allUsers) {
          setAllUsers(
            allUsers.map((user) =>
              user.uid === uid
                ? { ...user, role, updatedAt: new Date() }
                : user,
            ),
          )
        }

        // 🔄 Invalida cache TanStack Query se for o próprio usuário
        if (currentUser?.uid === uid) {
          await queryClient.invalidateQueries({ queryKey: ['user', userUid] })
        }
      }
    } catch {
      errorToast('Erro ao atualizar role')
    }

    setLoading((prev) => ({ ...prev, updateUserRole: false }))
  }

  // ====================================================================
  // 🔧 UTILITÁRIOS
  // ====================================================================

  /**
   * Força reload dos dados do usuário atual
   */
  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user', userUid] })
  }

  // ====================================================================
  // 🎯 PROVIDER RENDER
  // ====================================================================

  return (
    <UserContext.Provider
      value={{
        currentUser,
        allUsers,
        loading,
        updateUser,
        fetchCurrentUser,
        fetchAllUsers,
        updateUserRole,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
