/**
 * 👥 CONTEXTO DE USUÁRIOS
 *
 * Context React para dados específicos de usuários
 * - Dados do usuário atual e listas
 * - Operações CRUD de usuários
 * - Complementa o AuthContext (auth vs dados)
 */

'use client'

import { createContext } from 'react'

import { UserContextType } from './types'

/**
 * Context para gerenciamento de dados de usuários
 *
 * Uso:
 * - Provider: <UserContext.Provider value={userState}>
 * - Consumer: const userCtx = useContext(UserContext)
 * - Hook: const user = useUser() (recomendado)
 */
const UserContext = createContext<UserContextType>({} as UserContextType)

export default UserContext
