/**
 * 🪝 HOOK DE AUTENTICAÇÃO
 *
 * Hook customizado para acessar o contexto de autenticação
 * - Type safety garantido
 * - Validação de Provider obrigatória
 * - Interface limpa para componentes
 */

import { useContext } from 'react'

import { AuthContextType } from '@/providers/Auth/types'
import AuthContext from '@providers/Auth/context'

/**
 * Hook para acessar dados de autenticação
 *
 * Funcionalidades:
 * - Acesso ao userUid, loading, operações de auth
 * - Type safety completo com AuthContextType
 * - Erro claro se usado fora do Provider
 *
 * @returns Contexto completo de autenticação
 * @throws Error se usado fora do AuthProvider
 *
 * Uso:
 * ```typescript
 * const { userUid, loginWithInternalService, loading } = useAuth()
 *
 * if (loading.onAuthUserChanged) return <Loading />
 * if (!userUid) return <Login />
 * return <Dashboard />
 * ```
 */
export default function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  // 🛡️ Validação obrigatória do Provider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
