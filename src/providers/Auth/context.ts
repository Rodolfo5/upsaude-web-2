/**
 * 🔐 CONTEXTO DE AUTENTICAÇÃO
 *
 * Context React para compartilhar estado de auth globalmente
 * - Criado com tipo AuthContextType
 * - Valor inicial vazio (será preenchido pelo Provider)
 * - Consumido via useAuth hook
 */

import { createContext } from 'react'

import type { AuthContextType } from './types'

/**
 * Context principal de autenticação
 *
 * Uso:
 * - Provider: <AuthContext.Provider value={authState}>
 * - Consumer: const auth = useContext(AuthContext)
 * - Hook: const auth = useAuth() (recomendado)
 */
const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export default AuthContext
